import { computed, Injectable, signal } from '@angular/core';
import { Notification, Tab, User } from 'shared-lib';
export interface UIState {
  isLoading: boolean;
  isSidebarCollapsed: boolean;
  activeTheme: string;
  sidebarWidth: number;
}
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}
export interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  maxTabs: number;
}
export interface AppState {
  user: User | null;
  ui: UIState;
  notifications: NotificationState;
  tabs: TabState;
}
const initialState: AppState = {
  user: null,
  ui: {
    isLoading: false,
    isSidebarCollapsed: false,
    activeTheme: 'green',
    sidebarWidth: 280,
  },
  notifications: {
    notifications: [],
    unreadCount: 0,
  },
  tabs: {
    tabs: [],
    activeTabId: null,
    maxTabs: 0,
  },
};
@Injectable({ providedIn: 'root' })
export class AppStore {
  // Private state signals
  private readonly state = signal<AppState>(initialState);
  // Public readonly state selectors
  readonly user = computed(() => this.state().user);
  readonly ui = computed(() => this.state().ui);
  readonly notifications = computed(() => this.state().notifications);
  readonly tabs = computed(() => this.state().tabs);
  // Computed values
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly unreadNotifications = computed(
    () => this.notifications().unreadCount
  );
  readonly activeTabs = computed(() =>
    this.tabs().tabs.filter((t) => t.isActive)
  );
  readonly currentTab = computed(() =>
    this.tabs().tabs.find((t) => t.id === this.tabs().activeTabId)
  );
  // User actions
  setUser(user: User | null): void {
    this.state.update((state) => ({ ...state, user }));
    this.persistState();
  }
  // UI actions
  setLoading(isLoading: boolean): void {
    this.state.update((state) => ({
      ...state,
      ui: { ...state.ui, isLoading },
    }));
  }
  toggleSidebar(): void {
    this.state.update((state) => ({
      ...state,
      ui: {
        ...state.ui,
        isSidebarCollapsed: !state.ui.isSidebarCollapsed,
      },
    }));
    this.persistState();
  }
  setSidebarCollapsed(collapsed: boolean): void {
    this.state.update((state) => ({
      ...state,
      ui: { ...state.ui, isSidebarCollapsed: collapsed },
    }));
    this.persistState();
  }
  setTheme(theme: string): void {
    this.state.update((state) => ({
      ...state,
      ui: { ...state.ui, activeTheme: theme },
    }));
    this.persistState();
  }
  // Notification actions
  addNotification(notification: Notification): void {
    this.state.update((state) => {
      const notifications = [
        ...state.notifications.notifications,
        notification,
      ];
      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return {
        ...state,
        notifications: { notifications, unreadCount },
      };
    });
  }
  markNotificationAsRead(id: string): void {
    this.state.update((state) => {
      const notifications = state.notifications.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return {
        ...state,
        notifications: { notifications, unreadCount },
      };
    });
  }
  clearAllNotifications(): void {
    this.state.update((state) => ({
      ...state,
      notifications: { notifications: [], unreadCount: 0 },
    }));
  }
  // Tab actions
  addTab(tab: Tab): void {
    this.state.update((state) => {
      const tabs = [...state.tabs.tabs, tab];

      // Enforce max tabs limit
      if (tabs.length > state.tabs.maxTabs) {
        tabs.shift(); // Remove oldest tab
      }

      return {
        ...state,
        tabs: { ...state.tabs, tabs, activeTabId: tab.id },
      };
    });
    this.persistState();
  }
  closeTab(tabId: string): void {
    this.state.update((state) => {
      const tabs = state.tabs.tabs.filter((t) => t.id !== tabId);
      let activeTabId = state.tabs.activeTabId;

      // If closing active tab, switch to another
      if (activeTabId === tabId && tabs.length > 0) {
        activeTabId = tabs[tabs.length - 1].id;
      } else if (tabs.length === 0) {
        activeTabId = null;
      }

      return {
        ...state,
        tabs: { ...state.tabs, tabs, activeTabId },
      };
    });
    this.persistState();
  }
  setActiveTab(tabId: string): void {
    this.state.update((state) => ({
      ...state,
      tabs: { ...state.tabs, activeTabId: tabId },
    }));
  }
  // State persistence
  private persistState(): void {
    const stateToPersist = {
      user: this.state().user,
      ui: this.state().ui,
      tabs: this.state().tabs.tabs.map((t) => ({
        id: t.id,
        taskCode: t.taskCode,
        title: t.title,
      })),
    };

    try {
      sessionStorage.setItem('app_state', JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }
  loadPersistedState(): void {
    try {
      const saved = sessionStorage.getItem('app_state');
      if (saved) {
        const persistedState = JSON.parse(saved);

        this.state.update((state) => ({
          ...state,
          user: persistedState.user || state.user,
          ui: { ...state.ui, ...persistedState.ui },
        }));
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }
  resetState(): void {
    this.state.set(initialState);
    sessionStorage.removeItem('app_state');
  }
}
