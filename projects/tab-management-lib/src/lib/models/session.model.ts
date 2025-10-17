export interface UserSession {
  sessionId: string;
  userId: string;
  userName: string;
  businessUnit: string;
  role: string;
  loginTime: Date;
  lastActivity: Date;
  isActive: boolean;
  tabs: SessionTab[];
  preferences: SessionPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionTab {
  tabId: string;
  taskCode: string;
  title: string;
  url: string;
  isActive: boolean;
  state: string;
  createdAt: Date;
  lastAccessedAt: Date;
  order: number;
}

export interface SessionPreferences {
  maxTabs: number;
  tabPersistence: boolean;
  tabCloseConfirmation: boolean;
  autoSaveInterval: number;
  theme: string;
}

export interface SessionStorage {
  save(session: UserSession): Promise<boolean>;
  load(sessionId: string): Promise<UserSession | null>;
  remove(sessionId: string): Promise<boolean>;
  cleanup(olderThanDays: number): Promise<number>;
}
