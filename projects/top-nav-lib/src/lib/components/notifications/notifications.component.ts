import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../notification.service';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'lib-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Output() notificationClicked = new EventEmitter<Notification>();
  @Output() markAllRead = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();

  public showAllSignal = signal<boolean>(false);

  readonly notifications = computed(() => {
    const allNotifications = this.notificationService.notifications();
    return this.showAllSignal()
      ? allNotifications
      : this.notificationService.getUnreadNotifications();
  });

  readonly hasUnread = computed(
    () => this.notificationService.getUnreadCount() > 0
  );
  readonly allCount = computed(() =>
    this.notificationService.getNotificationCount()
  );
  readonly unreadCount = computed(() =>
    this.notificationService.getUnreadCount()
  );

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  onNotificationClick(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
    this.notificationClicked.emit(notification);
  }

  onMarkAllRead(): void {
    this.notificationService.markAllAsRead();
    this.markAllRead.emit();
  }

  onClearAll(): void {
    this.notificationService.clearAllNotifications();
    this.clearAll.emit();
  }

  onToggleView(): void {
    this.showAllSignal.update((show) => !show);
  }

  onClearRead(): void {
    this.notificationService.clearReadNotifications();
  }

  getTypeClass(type: string): string {
    const typeMap: Record<string, string> = {
      info: 'notification-info',
      warning: 'notification-warning',
      error: 'notification-error',
      success: 'notification-success',
    };
    return typeMap[type] || 'notification-info';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  getPriorityIcon(priority: string): string {
    const iconMap: Record<string, string> = {
      high: 'fa-exclamation-circle',
      medium: 'fa-exclamation-triangle',
      low: 'fa-info-circle',
    };
    return iconMap[priority] || 'fa-info-circle';
  }
  trackById(index: number, item: Notification): string {
    return item.id;
  }
}
