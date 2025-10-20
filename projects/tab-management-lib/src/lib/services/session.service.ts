import { Injectable, signal } from '@angular/core';
import {
  TabSession,
  SessionState,
  SessionStorageConfig,
} from '../models/session.model';

/**
 * Session Service
 * Handles tab session persistence and restoration (localStorage/sessionStorage)
 * Legacy: Session management in Main.aspx.cs
 */
@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly DEFAULT_CONFIG: SessionStorageConfig = {
    storageKey: 'xont_tab_session',
    storage: 'sessionStorage',
    compress: false,
    encrypt: false,
    autoSave: true,
    saveInterval: 2000,
  };

  private stateSignal = signal<SessionState>({
    currentSession: null,
    previousSessions: [],
    maxSessionHistory: 5,
  });

  private configSignal = signal<SessionStorageConfig>(this.DEFAULT_CONFIG);

  readonly state = this.stateSignal.asReadonly();
  readonly config = this.configSignal.asReadonly();

  constructor() {
    this.loadSession();
  }

  /**
   * Save current session to storage
   */
  saveSession(session: TabSession): void {
    try {
      const data = JSON.stringify(session);
      window[this.configSignal().storage].setItem(
        this.configSignal().storageKey,
        data
      );
    } catch (error) {
      console.error('Failed to save tab session:', error);
    }
  }

  /**
   * Load session from storage
   */
  loadSession(): void {
    try {
      const data = window[this.configSignal().storage].getItem(
        this.configSignal().storageKey
      );
      if (data) {
        const session: TabSession = JSON.parse(data);
        this.stateSignal.set({
          ...this.stateSignal(),
          currentSession: session,
        });
      }
    } catch (error) {
      console.error('Failed to load tab session:', error);
    }
  }

  /**
   * Clear persisted session
   */
  clearSession(): void {
    try {
      window[this.configSignal().storage].removeItem(
        this.configSignal().storageKey
      );
      this.stateSignal.set({ ...this.stateSignal(), currentSession: null });
    } catch (error) {
      console.error('Failed to clear tab session:', error);
    }
  }

  /**
   * Push previous session to history
   */
  pushPrevious(session: TabSession): void {
    const { previousSessions, maxSessionHistory } = this.stateSignal();
    const updatedHistory = [session, ...previousSessions].slice(
      0,
      maxSessionHistory
    );
    this.stateSignal.set({
      ...this.stateSignal(),
      previousSessions: updatedHistory,
    });
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<SessionStorageConfig>): void {
    this.configSignal.update((curr) => ({ ...curr, ...config }));
  }
}
