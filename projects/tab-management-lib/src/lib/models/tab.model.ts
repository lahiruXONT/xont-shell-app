export enum TabType {
  IFRAME = 'IFRAME',
  ANGULAR = 'ANGULAR',
  EXTERNAL = 'EXTERNAL',
}

export enum TabState {
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  ERROR = 'ERROR',
  IDLE = 'IDLE',
}

export interface Tab {
  id: string;
  taskCode: string;
  title: string;
  url: string;
  type: TabType;
  state: TabState;
  isActive: boolean;
  isPinned: boolean;
  isDirty: boolean;
  icon?: string;
  tooltip?: string;
  metadata?: TabMetadata;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface TabMetadata {
  menuCode?: string;
  description?: string;
  applicationCode?: string;
  version?: string; // V2 or V3
  exclusivityMode?: boolean;
  canClose?: boolean;
  customData?: any;
}

export interface TabConfig {
  maxTabs: number;
  enablePersistence: boolean;
  confirmBeforeClose: boolean;
  showToolsMenu: boolean;
  enableDragDrop: boolean;
}
