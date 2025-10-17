export interface Tab {
  id: string;
  taskCode: string;
  title: string;
  url: string;
  description: string;
  taskType: 'FORM' | 'REPORT' | 'DASHBOARD' | 'EXTERNAL';
  userName: string;
  applicationCode: string;
  exclusivityMode: 'NONE' | 'USER' | 'SYSTEM';
  state: TabState;
  isActive: boolean;
  isClosable: boolean;
  isComparable: boolean;
  hasUnsavedChanges: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata: Record<string, any>;
  icon?: string;
  order?: number;
}

export enum TabState {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  SAVING = 'saving',
  SAVED = 'saved',
}

export interface TabConfig {
  maxTabs: number;
  defaultTabTitle: string;
  enableTabReordering: boolean;
  enableTabPersistence: boolean;
  tabCloseConfirmation: boolean;
  homeTabClosable: boolean;
  enableCompareMode: boolean;
  enableFullscreen: boolean;
}

export type CompareMode = 'none' | 'horizontal' | 'vertical' | 'grid';

export interface TabAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  enabled: boolean;
  visible: boolean;
}

export interface TabTools {
  showHomeButton: boolean;
  showFullscreenButton: boolean;
  showCompareButton: boolean;
  showToolsDropdown: boolean;
  showPrintButton: boolean;
  showMailButton: boolean;
  showFavoritesButton: boolean;
  showNotesButton: boolean;
  showHelpButton: boolean;
  customActions?: TabAction[];
}

export interface TabSession {
  sessionId: string;
  userId: string;
  tabs: Tab[];
  activeTabId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
