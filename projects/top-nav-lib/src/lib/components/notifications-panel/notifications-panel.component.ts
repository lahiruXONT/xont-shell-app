import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { NotificationService } from '../../services/notification.service';

// Models
import {
  Notification,
  NotificationType,
  NotificationPanelState,
} from '../../models/notification.model';

/**
 * Notifications Panel Component (Right Sidebar)
 * Legacy: notificationsideNav from Main.aspx
 *
 * Features:
 * - Slide-in notification panel from right
 * - List of all notifications (Task + Message)
 * - Unread/Read status indication
 * - Select notification to view details
 * - Delete notifications
 * - Open tasks in tabs
 */
@Component({
  selector: 'lib-notifications-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss'],
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  // Services
  private notificationService = inject(NotificationService);

  // Component state
  private destroy$ = new Subject<void>();
  selectedNotifications = signal<Set<string>>(new Set());

  // Outputs (for shell app integration)
  @Output() taskNotificationClicked = new EventEmitter<{
    taskCode: string;
    taskUrl: string;
  }>();
  @Output() messageNotificationClicked = new EventEmitter<Notification>();

  // Service state references
  panelState = this.notificationService.panelState;
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  taskNotifications = this.notificationService.taskNotifications;
  messageNotifications = this.notificationService.messageNotifications;

  // Computed properties
  hasNotifications = computed(() => this.notifications().length > 0);
  hasSelectedNotifications = computed(
    () => this.selectedNotifications().size > 0
  );
  isMessageViewOpen = computed(
    () =>
      this.panelState().showMessageView &&
      this.panelState().selectedNotification !== null
  );

  // Notification type enum for template
  readonly NotificationType = NotificationType;

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Close notifications panel
   * Legacy: closeNav() function
   */
  closePanel(): void {
    this.notificationService.closePanel();
    this.selectedNotifications.set(new Set());
  }

  /**
   * Handle notification click
   * Legacy: Click on .rolenotification
   */
  onNotificationClick(notification: Notification): void {
    if (notification.type === NotificationType.TASK && notification.taskCode) {
      // Task notification - emit event to open task in tab
      this.taskNotificationClicked.emit({
        taskCode: notification.taskCode,
        taskUrl: notification.taskUrl || '',
      });

      // Mark as read
      if (!notification.isRead) {
        this.notificationService.markAsRead(notification.id);
      }

      // Close panel
      this.closePanel();
    } else {
      // Message notification - show message view
      this.notificationService.selectNotification(notification);
    }
  }

  /**
   * Toggle notification selection for deletion
   */
  toggleNotificationSelection(notificationId: string): void {
    this.selectedNotifications.update((selected) => {
      const newSet = new Set(selected);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }

  /**
   * Check if notification is selected
   */
  isSelected(notificationId: string): boolean {
    return this.selectedNotifications().has(notificationId);
  }

  /**
   * Delete selected notifications
   * Legacy: Delete button functionality
   */
  async deleteSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedNotifications());
    if (selectedIds.length === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedIds.length} notification(s)?`
    );

    if (confirmed) {
      await this.notificationService.deleteNotifications(selectedIds);
      this.selectedNotifications.set(new Set());
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const unreadNotifications = this.notifications().filter((n) => !n.isRead);

    for (const notification of unreadNotifications) {
      await this.notificationService.markAsRead(notification.id);
    }
  }

  /**
   * Close message view
   */
  closeMessageView(): void {
    const state = this.panelState();
    this.notificationService['panelStateSignal'].set({
      ...state,
      showMessageView: false,
      selectedNotification: null,
    });
  }

  /**
   * Get notification icon class
   */
  getNotificationIcon(notification: Notification): string {
    return this.notificationService.getNotificationIcon(notification);
  }

  /**
   * Get notification CSS class
   */
  getNotificationClass(notification: Notification): string {
    const classes = ['notification-item'];

    if (!notification.isRead) {
      classes.push('unread');
    }

    if (this.isSelected(notification.id)) {
      classes.push('selected');
    }

    if (notification.type === NotificationType.TASK) {
      classes.push('task-notification');
    } else {
      classes.push('message-notification');
    }

    return classes.join(' ');
  }

  /**
   * Format notification timestamp
   */
  formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }
}
