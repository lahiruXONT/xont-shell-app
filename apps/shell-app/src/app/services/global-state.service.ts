import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GlobalState {
  currentUser: any;
  currentBusinessUnit: string;
  currentRole: string;
  currentTheme: string;
  isLoading: boolean;
  notifications: any[];
  preferences: any;
  configuration: any;
}

export interface AppConfiguration {
  apiBaseUrl: string;
  enableDebugMode: boolean;
  maxTabs: number;
  sessionTimeout: number;
  features: {
    notifications: boolean;
    compareMode: boolean;
    darkMode: boolean;
    multiLanguage: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  // State signals
  private currentUserSignal = signal<any>(null);
  private currentBusinessUnitSignal = signal<string>('');
  private currentRoleSignal = signal<string>('');
  private currentThemeSignal = signal<string>('blue');
  private isLoadingSignal = signal<boolean>(false);
  private notificationsSignal = signal<any[]>([]);
  private preferencesSignal = signal<any>({});
  private configurationSignal = signal<AppConfiguration | null>(null);

  // Legacy observables for backward compatibility
  private currentUserSubject = new BehaviorSubject<any>(null);
  private currentBusinessUnitSubject = new BehaviorSubject<string>('');
  private currentThemeSubject = new BehaviorSubject<string>('blue');

  // Public signal accessors
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly currentBusinessUnit = this.currentBusinessUnitSignal.asReadonly();
  readonly currentRole = this.currentRoleSignal.asReadonly();
  readonly currentTheme = this.currentThemeSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly preferences = this.preferencesSignal.asReadonly();
  readonly configuration = this.configurationSignal.asReadonly();

  // Computed properties
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    return user?.fullName || user?.userName || 'User';
  });
  readonly hasNotifications = computed(() => this.notifications().length > 0);

  // Public observable accessors
  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly currentBusinessUnit$ =
    this.currentBusinessUnitSubject.asObservable();
  readonly currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {}

  // Initialization
  async initialize(): Promise<void> {
    try {
      // Load saved state from storage
      this.loadStateFromStorage();

      // Load default configuration
      const defaultConfig: AppConfiguration = {
        apiBaseUrl: '/api',
        enableDebugMode: false,
        maxTabs: 10,
        sessionTimeout: 30,
        features: {
          notifications: true,
          compareMode: true,
          darkMode: true,
          multiLanguage: false,
        },
      };

      this.configurationSignal.set(defaultConfig);
    } catch (error) {
      console.error('Failed to initialize global state:', error);
      throw error;
    }
  }

  // User management
  setCurrentUser(user: any): void {
    this.currentUserSignal.set(user);
    this.currentUserSubject.next(user);
    this.saveStateToStorage();
  }

  setCurrentBusinessUnit(businessUnit: string): void {
    this.currentBusinessUnitSignal.set(businessUnit);
    this.currentBusinessUnitSubject.next(businessUnit);
    this.saveStateToStorage();
  }

  setCurrentRole(role: string): void {
    this.currentRoleSignal.set(role);
    this.saveStateToStorage();
  }

  // Theme management
  setCurrentTheme(theme: string): void {
    this.currentThemeSignal.set(theme);
    this.currentThemeSubject.next(theme);
    this.saveStateToStorage();
  }

  // Loading state
  setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }

  // Notifications
  addNotification(notification: any): void {
    this.notificationsSignal.update((notifications) => [
      notification,
      ...notifications,
    ]);
  }

  removeNotification(id: string): void {
    this.notificationsSignal.update((notifications) =>
      notifications.filter((n) => n.id !== id)
    );
  }

  clearNotifications(): void {
    this.notificationsSignal.set([]);
  }

  // Preferences
  updatePreferences(preferences: any): void {
    this.preferencesSignal.update((current) => ({
      ...current,
      ...preferences,
    }));
    this.saveStateToStorage();
  }

  // Configuration
  async loadConfiguration(): Promise<AppConfiguration | null> {
    try {
      // In a real app, this would load from an API
      // For now, return the current configuration
      return this.configuration();
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }

  updateConfiguration(config: Partial<AppConfiguration>): void {
    const currentConfig = this.configuration();
    if (currentConfig) {
      this.configurationSignal.set({
        ...currentConfig,
        ...config,
      });
    }
  }

  // State persistence
  private saveStateToStorage(): void {
    try {
      const state: Partial<GlobalState> = {
        currentUser: this.currentUser(),
        currentBusinessUnit: this.currentBusinessUnit(),
        currentRole: this.currentRole(),
        currentTheme: this.currentTheme(),
        preferences: this.preferences(),
      };

      localStorage.setItem('globalState', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save state to storage:', error);
    }
  }

  private loadStateFromStorage(): void {
    try {
      const savedState = localStorage.getItem('globalState');
      if (savedState) {
        const state: Partial<GlobalState> = JSON.parse(savedState);

        if (state.currentUser) this.setCurrentUser(state.currentUser);
        if (state.currentBusinessUnit)
          this.setCurrentBusinessUnit(state.currentBusinessUnit);
        if (state.currentRole) this.setCurrentRole(state.currentRole);
        if (state.currentTheme) this.setCurrentTheme(state.currentTheme);
        if (state.preferences) this.preferencesSignal.set(state.preferences);
      }
    } catch (error) {
      console.warn('Failed to load state from storage:', error);
    }
  }

  // Cleanup
  reset(): void {
    this.currentUserSignal.set(null);
    this.currentBusinessUnitSignal.set('');
    this.currentRoleSignal.set('');
    this.currentThemeSignal.set('blue');
    this.isLoadingSignal.set(false);
    this.notificationsSignal.set([]);
    this.preferencesSignal.set({});

    // Update observables
    this.currentUserSubject.next(null);
    this.currentBusinessUnitSubject.next('');
    this.currentThemeSubject.next('blue');

    // Clear storage
    try {
      localStorage.removeItem('globalState');
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  // Utility methods
  getState(): GlobalState {
    return {
      currentUser: this.currentUser(),
      currentBusinessUnit: this.currentBusinessUnit(),
      currentRole: this.currentRole(),
      currentTheme: this.currentTheme(),
      isLoading: this.isLoading(),
      notifications: this.notifications(),
      preferences: this.preferences(),
      configuration: this.configuration(),
    };
  }
}
