import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification, NotificationSummary } from './models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSignal = signal<Notification[]>([]);
  private notificationSummarySignal = signal<NotificationSummary>({
    total: 0,
    unread: 0,
    byPriority: { high: 0, medium: 0, low: 0 },
    byType: { info: 0, warning: 0, error: 0, success: 0 },
  });

  // Legacy observable support
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private notificationSummarySubject = new BehaviorSubject<NotificationSummary>(
    {
      total: 0,
      unread: 0,
      byPriority: { high: 0, medium: 0, low: 0 },
      byType: { info: 0, warning: 0, error: 0, success: 0 },
    }
  );

  // Public signal accessors
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly notificationSummary = this.notificationSummarySignal.asReadonly();

  // Computed properties
  readonly unreadNotifications = computed(() =>
    this.notifications().filter((n) => !n.isRead)
  );

  // Public observable accessors
  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly notificationSummary$ =
    this.notificationSummarySubject.asObservable();

  constructor() {
    this.initializeNotifications();
  }

  private initializeNotifications(): void {
    // Load notifications from storage or initialize with default data
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const notifications: Notification[] = JSON.parse(savedNotifications);
        this.notificationsSignal.set(notifications);
        this.updateSummary();
      } catch (error) {
        console.warn('Failed to load notifications from storage:', error);
      }
    }
  }

  // Add a new notification
  addNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ): Notification {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
      isRead: false,
    };

    const currentNotifications = this.notificationsSignal();
    const updatedNotifications = [newNotification, ...currentNotifications];
    this.notificationsSignal.set(updatedNotifications);
    this.notificationsSubject.next(updatedNotifications);

    this.updateSummary();

    // Save to storage
    this.saveToStorage();

    return newNotification;
  }

  // Update notification status
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSignal();
    const updatedNotifications = currentNotifications.map((notification) =>
      notification.id === notificationId
        ? { ...notification, isRead: true, readAt: new Date() }
        : notification
    );

    this.notificationsSignal.set(updatedNotifications);
    this.notificationsSubject.next(updatedNotifications);
    this.updateSummary();
    this.saveToStorage();
  }

  markAllAsRead(): void {
    const currentNotifications = this.notificationsSignal();
    const updatedNotifications = currentNotifications.map((notification) => ({
      ...notification,
      isRead: true,
      readAt: new Date(),
    }));

    this.notificationsSignal.set(updatedNotifications);
    this.notificationsSubject.next(updatedNotifications);
    this.updateSummary();
    this.saveToStorage();
  }

  // Remove notifications
  removeNotification(notificationId: string): void {
    const currentNotifications = this.notificationsSignal();
    const updatedNotifications = currentNotifications.filter(
      (n) => n.id !== notificationId
    );

    this.notificationsSignal.set(updatedNotifications);
    this.notificationsSubject.next(updatedNotifications);
    this.updateSummary();
    this.saveToStorage();
  }

  clearAllNotifications(): void {
    this.notificationsSignal.set([]);
    this.notificationsSubject.next([]);
    this.updateSummary();
    this.saveToStorage();
  }

  clearReadNotifications(): void {
    const currentNotifications = this.notificationsSignal();
    const updatedNotifications = currentNotifications.filter((n) => !n.isRead);

    this.notificationsSignal.set(updatedNotifications);
    this.notificationsSubject.next(updatedNotifications);
    this.updateSummary();
    this.saveToStorage();
  }

  // Update summary
  private updateSummary(): void {
    const notifications = this.notificationsSignal();
    const summary: NotificationSummary = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      byPriority: {
        high: notifications.filter((n) => n.priority === 'high').length,
        medium: notifications.filter((n) => n.priority === 'medium').length,
        low: notifications.filter((n) => n.priority === 'low').length,
      },
      byType: {
        info: notifications.filter((n) => n.type === 'info').length,
        warning: notifications.filter((n) => n.type === 'warning').length,
        error: notifications.filter((n) => n.type === 'error').length,
        success: notifications.filter((n) => n.type === 'success').length,
      },
    };

    this.notificationSummarySignal.set(summary);
    this.notificationSummarySubject.next(summary);
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        'notifications',
        JSON.stringify(this.notificationsSignal())
      );
    } catch (error) {
      console.warn('Failed to save notifications to storage:', error);
    }
  }

  // Get notifications by criteria
  getNotificationsByType(type: string): Notification[] {
    return this.notificationsSignal().filter((n) => n.type === type);
  }

  getNotificationsByPriority(priority: string): Notification[] {
    return this.notificationsSignal().filter((n) => n.priority === priority);
  }

  getUnreadNotifications(): Notification[] {
    return this.notificationsSignal().filter((n) => !n.isRead);
  }

  // Notification count methods
  getNotificationCount(): number {
    return this.notificationsSignal().length;
  }

  getUnreadCount(): number {
    return this.notificationSummary().unread;
  }
}
