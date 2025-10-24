import { Tab } from './tab.model';

/**
 * Represents a user's tab session
 * Legacy: Session management in Main.aspx.cs
 */
export interface TabSession {
  sessionId: string; // Session.SessionID
  userId: string; // User.UserName
  businessUnit: string; // User.BusinessUnit
  roleCode: string; // Current role

  // Tab state
  tabs: Tab[]; // All open tabs
  activeTabId: string | null; // Current active tab (like SessionTaskCode)
  minimizedTabs: string[]; // IDs of minimized tabs

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

/**
 * Session state for persistence
 */
export interface SessionState {
  currentSession: TabSession | null;
  previousSessions: TabSession[];
  maxSessionHistory: number;
}

/**
 * Session storage configuration
 */
export interface SessionStorageConfig {
  storageKey: string; // Key for localStorage
  storage: 'localStorage' | 'sessionStorage';
  compress: boolean;
  encrypt: boolean;
  autoSave: boolean;
  saveInterval: number; // ms
}

/**
 * Session recovery options
 */
export interface SessionRecoveryOptions {
  enabled: boolean;
  maxAge: number; // hours
  confirmBeforeRestore: boolean;
}
