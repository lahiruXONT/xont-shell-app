import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserSession, UserPreferences } from './models/user.model';
import { Notification } from './models/notification.model';
import { ThemeColor } from './models/theme.model';

@Injectable({
  providedIn: 'root',
})
export class TopNavService {
  // Signals for reactive state management
  private userSessionSignal = signal<UserSession | null>(null);
  private isLoadingSignal = signal<boolean>(false);
  private unreadNotificationsCountSignal = signal<number>(0);
  private currentThemeSignal = signal<ThemeColor>('blue');

  // Legacy observable support
  private userSessionSubject = new BehaviorSubject<UserSession | null>(null);
  private unreadNotificationsSubject = new BehaviorSubject<number>(0);

  // Public signal accessors
  readonly userSession = this.userSessionSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly unreadNotificationsCount =
    this.unreadNotificationsCountSignal.asReadonly();
  readonly currentTheme = this.currentThemeSignal.asReadonly();

  // Computed properties
  readonly currentUser = computed(() => this.userSession()?.user || null);
  readonly isAuthenticated = computed(() => !!this.userSession());
  readonly hasUnreadNotifications = computed(
    () => this.unreadNotificationsCount() > 0
  );

  // Public observable accessors
  readonly userSession$ = this.userSessionSubject.asObservable();
  readonly unreadNotifications$ =
    this.unreadNotificationsSubject.asObservable();

  constructor() {
    this.loadFromSession();
  }

  // User session management
  setUserSession(session: UserSession | null): void {
    this.userSessionSignal.set(session);
    this.userSessionSubject.next(session);

    if (session) {
      this.saveToSession(session);
      this.currentThemeSignal.set(session.user.preferences?.theme || 'blue');
    } else {
      this.clearSession();
    }
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    const session = this.userSessionSignal();
    if (session?.user) {
      const updatedUser = {
        ...session.user,
        preferences: {
          ...session.user.preferences,
          ...preferences,
        },
      };

      const updatedSession = {
        ...session,
        user: updatedUser,
      };

      this.setUserSession(updatedSession as UserSession);
    }
  }

  // Theme management
  setCurrentTheme(theme: ThemeColor): void {
    this.currentThemeSignal.set(theme);
    this.updateUserPreferences({ theme });
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeColor): void {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
  }

  // Notification management
  setUnreadNotificationsCount(count: number): void {
    this.unreadNotificationsCountSignal.set(count);
    this.unreadNotificationsSubject.next(count);
  }

  incrementUnreadNotifications(): void {
    this.unreadNotificationsCountSignal.update((count) => count + 1);
    this.unreadNotificationsSubject.next(this.unreadNotificationsCountSignal());
  }

  decrementUnreadNotifications(): void {
    this.unreadNotificationsCountSignal.update((count) =>
      Math.max(0, count - 1)
    );
    this.unreadNotificationsSubject.next(this.unreadNotificationsCountSignal());
  }

  // Loading state
  setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }

  // Session persistence
  private loadFromSession(): void {
    try {
      const sessionData = sessionStorage.getItem('userSession');
      if (sessionData) {
        const session: UserSession = JSON.parse(sessionData);
        this.userSessionSignal.set(session);
        this.userSessionSubject.next(session);
        this.currentThemeSignal.set(session.user.preferences?.theme || 'blue');
        this.applyTheme(this.currentThemeSignal());
      }
    } catch (error) {
      console.warn('Failed to load session from storage:', error);
    }
  }

  private saveToSession(session: UserSession): void {
    try {
      sessionStorage.setItem('userSession', JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save session to storage:', error);
    }
  }

  private clearSession(): void {
    try {
      sessionStorage.removeItem('userSession');
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
  }

  // Logout
  logout(): void {
    this.setUserSession(null);
    this.setUnreadNotificationsCount(0);
    this.setCurrentTheme('blue');
  }

  // Utility methods
  updateLastActivity(): void {
    const session = this.userSessionSignal();
    if (session) {
      const updatedSession = {
        ...session,
        lastActivity: new Date(),
      };
      this.setUserSession(updatedSession);
    }
  }

  isSessionExpired(timeoutMinutes: number = 30): boolean {
    const session = this.userSessionSignal();
    if (!session) return true;

    const now = new Date();
    const lastActivity = new Date(session.lastActivity);
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    return diffMinutes > timeoutMinutes;
  }
}
