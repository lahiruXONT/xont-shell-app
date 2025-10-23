import { Injectable, signal, computed, inject } from '@angular/core';
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
import { Inject, Optional } from '@angular/core';
import { TOP_NAV_API_URL as API_URL } from '../tokens/api-url.token';

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

  // State signals
  private notificationsSignal = signal<Notification[]>([]);
  private panelStateSignal = signal<NotificationPanelState>({
    isOpen: false,
    unreadCount: 0,
    selectedNotification: null,
    showMessageView: false,
    notifications: [],
  });
  private configSignal = signal<NotificationConfig>(this.DEFAULT_CONFIG);
  private adminAlertSignal = signal<AdminAlert | null>(null);

  // BehaviorSubjects for broadcasting
  private notificationSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private adminAlertSubject = new Subject<AdminAlert>();

  // Public readonly signals
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly panelState = this.panelStateSignal.asReadonly();
  readonly config = this.configSignal.asReadonly();
  readonly adminAlert = this.adminAlertSignal.asReadonly();

  // Computed values
  readonly unreadCount = computed(
    () => this.notificationsSignal().filter((n) => !n.isRead).length
  );

  readonly taskNotifications = computed(() =>
    this.notificationsSignal().filter((n) => n.type === NotificationType.TASK)
  );

  readonly messageNotifications = computed(() =>
    this.notificationsSignal().filter(
      (n) => n.type === NotificationType.MESSAGE
    )
  );

  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiBaseUrl: string
  ) {}

  /**
   * Connect to SignalR hub
   * Legacy: SignalR connection setup in Main.aspx
   */
  async connectToHub(accessToken: string): Promise<void> {
    if (this.hubConnection) {
      await this.disconnectFromHub();
    }

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${this.apiBaseUrl}/hubs/notification`, {
          accessTokenFactory: () => accessToken,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register event handlers
      this.registerSignalRHandlers();

      // Start connection
      await this.hubConnection.start();
      this.isConnected.set(true);
      console.log('SignalR connected');
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.isConnected.set(false);
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnectFromHub(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.isConnected.set(false);
    }
  }

  /**
   * Register SignalR event handlers
   * Legacy: ReceiveNotification, ReceiveAdminAlert handlers
   */
  private registerSignalRHandlers(): void {
    if (!this.hubConnection) return;

    // Receive notification
    this.hubConnection.on('ReceiveNotification', (notification: any) => {
      this.handleIncomingNotification(notification);
    });

    // Receive admin alert
    this.hubConnection.on('ReceiveAdminAlert', (alert: any) => {
      this.handleIncomingAdminAlert(alert);
    });

    // Connection events
    this.hubConnection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
      this.isConnected.set(false);
    });

    this.hubConnection.onreconnected(() => {
      console.log('SignalR reconnected');
      this.isConnected.set(true);
    });

    this.hubConnection.onclose(() => {
      console.log('SignalR disconnected');
      this.isConnected.set(false);
    });
  }

  /**
   * Handle incoming notification from SignalR
   */
  private handleIncomingNotification(notificationData: any): void {
    const notification: Notification = {
      id: notificationData.id || notificationData.recID.toString(),
      recID: notificationData.recID,
      type: notificationData.type,
      priority: notificationData.priority || 'normal',
      title: notificationData.title || notificationData.description,
      message: notificationData.message || notificationData.description,
      icon: notificationData.icon || 'fa-bell',
      status: notificationData.status || NotificationStatus.UNREAD,
      isRead: notificationData.status === NotificationStatus.READ,
      isArchived: notificationData.status === NotificationStatus.ARCHIVED,
      taskCode: notificationData.taskCode,
      taskUrl: notificationData.taskUrl,
      timestamp: new Date(notificationData.timestamp || Date.now()),
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
    };

    // Add to notifications
    const updated = [notification, ...this.notificationsSignal()];
    this.notificationsSignal.set(updated);
    this.updatePanelState();

    // Play sound if enabled
    if (this.configSignal().enableSound) {
      this.playNotificationSound();
    }

    // Broadcast
    this.notificationSubject.next(updated);
    this.updateUnreadCount();
  }

  /**
   * Handle incoming admin alert from SignalR
   * Legacy: Admin alert popup with audio
   */
  private handleIncomingAdminAlert(alertData: any): void {
    const alert: AdminAlert = {
      alertNumber: alertData.alertNumber,
      message: alertData.message,
      alertTime: new Date(alertData.alertTime),
      timeInterval: alertData.timeInterval,
      repeatTimes: alertData.repeatTimes,
      recID: alertData.recID,
      playSound: this.configSignal().enableSound,
    };

    this.adminAlertSignal.set(alert);
    this.adminAlertSubject.next(alert);

    // Play alert sound
    if (alert.playSound) {
      this.playAdminAlertSound();
    }
  }

  /**
   * Load notifications from API
   * Legacy: Load notifications on page load
   */
  async loadNotifications(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<Notification[]>(`${this.apiBaseUrl}/api/notifications`)
      );

      this.notificationsSignal.set(response);
      this.updatePanelState();
      this.updateUnreadCount();
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  /**
   * Mark notification as read
   * Legacy: Update notification status
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(
          `${this.apiBaseUrl}/api/notifications/${notificationId}/read`,
          {}
        )
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
      this.updatePanelState();
      this.updateUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Delete notifications
   * Legacy: Delete selected notifications
   */
  async deleteNotifications(notificationIds: string[]): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiBaseUrl}/api/notifications/delete`,
          notificationIds
        )
      );

      const notifications = this.notificationsSignal();
      const updated = notifications.filter(
        (n) => !notificationIds.includes(n.id)
      );

      this.notificationsSignal.set(updated);
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
    this.panelStateSignal.set({ ...state, isOpen: true });
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

    // Mark as read if unread
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }
  }

  /**
   * Load task details for notification
   */
  private async loadTaskDetailsForNotification(
    notification: Notification
  ): Promise<void> {
    try {
      // Emit event to open task in tab manager
      // The shell app should listen to this and open the task
      console.log('Opening task:', notification.taskCode);
    } catch (error) {
      console.error('Failed to load task details:', error);
    }
  }

  /**
   * Update panel state
   */
  private updatePanelState(): void {
    const state = this.panelStateSignal();
    this.panelStateSignal.set({
      ...state,
      notifications: this.notificationsSignal(),
      unreadCount: this.unreadCount(),
    });
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(): void {
    this.unreadCountSubject.next(this.unreadCount());
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    // Play notification sound
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.play().catch((error) => {
      console.warn('Failed to play notification sound:', error);
    });
  }

  /**
   * Play admin alert sound
   * Legacy: myTune audio element
   */
  private playAdminAlertSound(): void {
    const audio = new Audio('assets/sounds/adminAlert.mp3');
    audio.loop = true;
    audio.play().catch((error) => {
      console.warn('Failed to play admin alert sound:', error);
    });
  }

  /**
   * Dismiss admin alert
   */
  dismissAdminAlert(): void {
    this.adminAlertSignal.set(null);
  }

  /**
   * Get notification icon
   */
  getNotificationIcon(notification: Notification): string {
    switch (notification.type) {
      case NotificationType.TASK:
        return 'fa-tasks';
      case NotificationType.MESSAGE:
        return 'fa-envelope';
      case NotificationType.ADMIN_ALERT:
        return 'fa-exclamation-triangle';
      case NotificationType.SUCCESS:
        return 'fa-check-circle';
      case NotificationType.ERROR:
        return 'fa-times-circle';
      case NotificationType.WARNING:
        return 'fa-exclamation-circle';
      default:
        return 'fa-bell';
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.configSignal.update((current) => ({ ...current, ...config }));
  }
}
