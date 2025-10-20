import { Injectable, signal, computed } from '@angular/core';

export interface AppState {
  isLoading: boolean;
  isSidebarCollapsed: boolean;
  activeTheme: string;
  notifications: any[];
  unreadNotifications: number;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  // State signals
  private isLoadingSignal = signal<boolean>(false);
  private isSidebarCollapsedSignal = signal<boolean>(false);
  private activeThemeSignal = signal<string>('green');
  private notificationsSignal = signal<any[]>([]);

  // Public readonly signals
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isSidebarCollapsed = this.isSidebarCollapsedSignal.asReadonly();
  readonly activeTheme = this.activeThemeSignal.asReadonly();
  readonly notifications = this.notificationsSignal.asReadonly();

  // Computed
  readonly unreadNotifications = computed(
    () => this.notificationsSignal().filter((n) => !n.isRead).length
  );

  // Actions
  setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsedSignal.update((collapsed) => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsedSignal.set(collapsed);
  }

  setTheme(theme: string): void {
    this.activeThemeSignal.set(theme);
    localStorage.setItem('userTheme', theme);
  }

  addNotification(notification: any): void {
    this.notificationsSignal.update((notifications) => [
      notification,
      ...notifications,
    ]);
  }

  markNotificationAsRead(notificationId: string): void {
    this.notificationsSignal.update((notifications) =>
      notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  }

  clearNotifications(): void {
    this.notificationsSignal.set([]);
  }
}
