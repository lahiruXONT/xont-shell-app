import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import {
  Notification,
  NotificationType,
} from '../../models/notification.model';

/**
 * Notifications Panel Component
 * Legacy: Notification sidenav from Main.aspx
 */
@Component({
  selector: 'lib-notifications-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-panel.component.html',
  styleUrl: './notifications-panel.component.scss',
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  // Get state from service
  readonly panelState = computed(() => this.notificationService.panelState());
  readonly notifications = computed(() =>
    this.notificationService.notifications()
  );
  readonly unreadCount = computed(() => this.notificationService.unreadCount());

  // Component state
  selectedNotifications = signal<string[]>([]);
  showMessageView = signal<boolean>(false);
  selectedNotification = signal<Notification | null>(null);

  // Enum for template
  readonly NotificationType = NotificationType;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Subscribe to new notifications
    this.notificationService.newNotification$.subscribe((notification) => {
      this.handleNewNotification(notification);
    });
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  /**
   * Handle new notification
   */
  private handleNewNotification(notification: Notification): void {
    // Could show toast here
    console.log('New notification:', notification);
  }

  /**
   * Close panel
   * Legacy: closeNav()
   */
  closePanel(): void {
    this.notificationService.closePanel();
    this.showMessageView.set(false);
    this.selectedNotification.set(null);
  }

  /**
   * Select notification
   * Legacy: Click on .rolenotification
   */
  onNotificationClick(notification: Notification): void {
    this.notificationService.selectNotification(notification);
    this.selectedNotification.set(notification);
    this.showMessageView.set(true);
  }

  /**
   * Toggle notification selection (for bulk delete)
   */
  toggleSelection(notificationId: string): void {
    const selected = this.selectedNotifications();
    if (selected.includes(notificationId)) {
      this.selectedNotifications.set(
        selected.filter((id) => id !== notificationId)
      );
    } else {
      this.selectedNotifications.set([...selected, notificationId]);
    }
  }

  /**
   * Select all notifications
   */
  selectAll(): void {
    const allIds = this.notifications().map((n) => n.id);
    this.selectedNotifications.set(allIds);
  }

  /**
   * Deselect all
   */
  deselectAll(): void {
    this.selectedNotifications.set([]);
  }

  /**
   * Mark selected as read
   * Legacy: OpenNotification
   */
  async markSelectedAsRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
    this.deselectAll();
  }

  /**
   * Delete selected notifications
   * Legacy: PageMethods.deleteNotifications(arryOfB)
   */
  async deleteSelected(): Promise<void> {
    const selected = this.selectedNotifications();
    if (selected.length === 0) return;

    if (confirm(`Delete ${selected.length} notification(s)?`)) {
      await this.notificationService.deleteNotifications(selected);
      this.deselectAll();
    }
  }

  /**
   * Back to list from message view
   */
  backToList(): void {
    this.showMessageView.set(false);
    this.selectedNotification.set(null);
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
      default:
        return 'fa-bell';
    }
  }

  /**
   * Format timestamp
   */
  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
