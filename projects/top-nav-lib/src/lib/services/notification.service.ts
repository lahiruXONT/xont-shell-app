import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, firstValueFrom, interval } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationPanelState,
  NotificationConfig,
  AdminAlert,
} from '../models/notification.model';

/**
 * Notification Service with SignalR Integration
 * Legacy: SignalR notifications + notification panel from Main.aspx
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // Default configuration
  private readonly DEFAULT_CONFIG: NotificationConfig = {
    maxNotifications: 100,
    autoMarkRead: false,
    autoMarkReadDelay: 5000,
    showToast: true,
    toastDuration: 5000,
    enableSound: true,
    groupByType: false,
    enableAdminAlerts: true,
  };

  // SignalR connection
  private hubConnection: signalR.HubConnection | null = null;
  private isConnected = signal<boolean>(false);

  // Notification state using signals
  private notificationsSignal = signal<Notification[]>([]);
  private unreadCountSignal = signal<number>(0);
  private panelStateSignal = signal<NotificationPanelState>({
    isOpen: false,
    unreadCount: 0,
    selectedNotification: null,
    showMessageView: false,
    notifications: [],
  });
  private configSignal = signal<NotificationConfig>(this.DEFAULT_CONFIG);

  // Admin alerts
  private adminAlertSignal = signal<AdminAlert | null>(null);
  private audioElement: HTMLAudioElement | null = null;

  // Legacy observables for compatibility
  private notificationSubject = new BehaviorSubject<Notification[]>([]);
  private newNotificationSubject = new Subject<Notification>();

  // Public readonly signals
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly panelState = this.panelStateSignal.asReadonly();
  readonly isSignalRConnected = this.isConnected.asReadonly();
  readonly adminAlert = this.adminAlertSignal.asReadonly();

  // Computed values
  readonly unreadNotifications = computed(() =>
    this.notificationsSignal().filter((n) => !n.isRead)
  );

  readonly taskNotifications = computed(() =>
    this.notificationsSignal().filter((n) => n.type === NotificationType.TASK)
  );

  readonly messageNotifications = computed(() =>
    this.notificationsSignal().filter(
      (n) => n.type === NotificationType.MESSAGE
    )
  );

  // Public observables
  readonly notifications$ = this.notificationSubject.asObservable();
  readonly newNotification$ = this.newNotificationSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAudioElement();
  }

  /**
   * Initialize SignalR connection
   * Legacy: SignalR hub connection from Main.aspx
   */
  async connectToHub(
    hubUrl: string,
    accessTokenFactory: () => string
  ): Promise<void> {
    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => accessTokenFactory(),
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup event handlers
      this.setupSignalRHandlers();

      // Start connection
      await this.hubConnection.start();
      this.isConnected.set(true);
      console.log('SignalR Connected');
    } catch (error) {
      console.error('SignalR Connection Error:', error);
      this.isConnected.set(false);
    }
  }

  /**
   * Setup SignalR event handlers
   * Legacy: Notification handlers from Main.aspx
   */
  private setupSignalRHandlers(): void {
    if (!this.hubConnection) return;

    // Receive notification event (Legacy: MyMethodResult)
    this.hubConnection.on(
      'ReceiveNotification',
      (notification: Notification) => {
        this.handleNewNotification(notification);
      }
    );

    // Admin alert event (Legacy: Admin alert popup)
    this.hubConnection.on('AdminAlert', (alert: AdminAlert) => {
      this.handleAdminAlert(alert);
    });

    // Connection events
    this.hubConnection.onreconnecting(() => {
      this.isConnected.set(false);
      console.log('SignalR Reconnecting...');
    });

    this.hubConnection.onreconnected(() => {
      this.isConnected.set(true);
      console.log('SignalR Reconnected');
      this.loadNotifications(); // Reload on reconnect
    });

    this.hubConnection.onclose(() => {
      this.isConnected.set(false);
      console.log('SignalR Disconnected');
    });
  }

  /**
   * Handle new notification received
   * Legacy: MyMethodResult function
   */
  private handleNewNotification(notification: Notification): void {
    const current = this.notificationsSignal();
    const updated = [notification, ...current].slice(
      0,
      this.configSignal().maxNotifications
    );

    this.notificationsSignal.set(updated);
    this.updateUnreadCount();
    this.notificationSubject.next(updated);
    this.newNotificationSubject.next(notification);

    // Show toast notification
    if (this.configSignal().showToast) {
      this.showToastNotification(notification);
    }

    // Play sound
    if (this.configSignal().enableSound) {
      this.playNotificationSound();
    }

    // Update panel state
    this.updatePanelState();
  }

  /**
   * Handle admin alert
   * Legacy: Admin alert modal with audio (myTune)
   */
  private handleAdminAlert(alert: AdminAlert): void {
    this.adminAlertSignal.set(alert);

    // Play audio if enabled
    if (alert.playSound && this.audioElement) {
      this.audioElement.src = 'assets/audio/adminAlert.mp3';
      this.audioElement.loop = true;
      this.audioElement.play();
    }

    // Show modal
    // The component will handle the modal display based on adminAlert signal
  }

  /**
   * Load notifications from server
   * Legacy: CheckNewNotification method
   */
  async loadNotifications(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<Notification[]>('/api/notifications')
      );

      this.notificationsSignal.set(response);
      this.updateUnreadCount();
      this.notificationSubject.next(response);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  /**
   * Mark notification as read
   * Legacy: PageMethods.executeNotification(recId)
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`/api/notifications/${notificationId}/mark-read`, {})
      );

      const notifications = this.notificationsSignal();
      const updated = notifications.map((n) =>
        n.id === notificationId
          ? {
              ...n,
              isRead: true,
              status: NotificationStatus.READ,
              readAt: new Date(),
            }
          : n
      );

      this.notificationsSignal.set(updated);
      this.updateUnreadCount();
      this.notificationSubject.next(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all as read
   * Legacy: OpenNotification method
   */
  async markAllAsRead(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post('/api/notifications/mark-all-read', {})
      );

      const notifications = this.notificationsSignal();
      const updated = notifications.map((n) => ({
        ...n,
        isRead: true,
        status: NotificationStatus.READ,
        readAt: new Date(),
      }));

      this.notificationsSignal.set(updated);
      this.updateUnreadCount();
      this.notificationSubject.next(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  /**
   * Delete notification(s)
   * Legacy: PageMethods.deleteNotifications(arryOfB)
   */
  async deleteNotifications(notificationIds: string[]): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post('/api/notifications/delete', { ids: notificationIds })
      );

      const notifications = this.notificationsSignal();
      const updated = notifications.filter(
        (n) => !notificationIds.includes(n.id)
      );

      this.notificationsSignal.set(updated);
      this.updateUnreadCount();
      this.notificationSubject.next(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  }

  /**
   * Open notification panel
   * Legacy: openNav() function
   */
  openPanel(): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      isOpen: true,
    });
  }

  /**
   * Close notification panel
   * Legacy: closeNav() function
   */
  closePanel(): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      isOpen: false,
      showMessageView: false,
      selectedNotification: null,
    });
  }

  /**
   * Toggle notification panel
   */
  togglePanel(): void {
    const state = this.panelStateSignal();
    if (state.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /**
   * Select notification to view details
   * Legacy: Click on .rolenotification
   */
  selectNotification(notification: Notification): void {
    const state = this.panelStateSignal();

    // If it's a task notification, load task details
    if (notification.type === NotificationType.TASK && notification.taskCode) {
      this.loadTaskDetailsForNotification(notification);
    } else {
      // Show message view
      this.panelStateSignal.set({
        ...state,
        selectedNotification: notification,
        showMessageView: true,
      });
    }

    // Mark as read
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }
  }

  /**
   * Load task details for notification
   * Legacy: getTaskDetails(taskcode) + MyMethodResult
   */
  private async loadTaskDetailsForNotification(
    notification: Notification
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`/api/tasks/${notification.taskCode}`)
      );

      // Emit event to open task in tab
      // This should be handled by the main app
      this.newNotificationSubject.next({
        ...notification,
        taskUrl: response.url,
        metadata: response,
      });
    } catch (error) {
      console.error('Failed to load task details:', error);
    }
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(): void {
    const count = this.notificationsSignal().filter((n) => !n.isRead).length;
    this.unreadCountSignal.set(count);
  }

  /**
   * Update panel state
   */
  private updatePanelState(): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      notifications: this.notificationsSignal(),
      unreadCount: this.unreadCountSignal(),
    });
  }

  /**
   * Initialize audio element for notifications
   */
  private initializeAudioElement(): void {
    if (typeof document !== 'undefined') {
      this.audioElement = document.createElement('audio');
      this.audioElement.id = 'notificationAudio';
      this.audioElement.style.display = 'none';
      document.body.appendChild(this.audioElement);
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    if (this.audioElement) {
      this.audioElement.src = 'assets/audio/notification.mp3';
      this.audioElement.play().catch((error) => {
        console.error('Failed to play notification sound:', error);
      });
    }
  }

  /**
   * Show toast notification
   */
  private showToastNotification(notification: Notification): void {
    // This should trigger a toast component
    // Implementation depends on toast library used
    console.log('Toast notification:', notification.title);
  }

  /**
   * Dismiss admin alert
   */
  dismissAdminAlert(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.adminAlertSignal.set(null);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.configSignal.update((current) => ({ ...current, ...config }));
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.isConnected.set(false);
      this.hubConnection = null;
    }
  }

  /**
   * Get notification by ID
   */
  getNotificationById(id: string): Notification | undefined {
    return this.notificationsSignal().find((n) => n.id === id);
  }

  /**
   * Check for task notification by task code
   */
  hasTaskNotification(taskCode: string): boolean {
    return this.notificationsSignal().some(
      (n) => n.type === NotificationType.TASK && n.taskCode === taskCode
    );
  }
}
