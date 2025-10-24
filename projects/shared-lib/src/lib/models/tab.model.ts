/**
 * Tab Type - defines how content is loaded
 */
export enum TabType {
  IFRAME = 'IFRAME', // Legacy ASPX pages
  ANGULAR = 'ANGULAR', // Angular components
  EXTERNAL = 'EXTERNAL', // External links
}

/**
 * Tab State - lifecycle states
 */
export enum TabState {
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  ERROR = 'ERROR',
  IDLE = 'IDLE',
}

/**
 * Tab model representing a single tab
 * Legacy: Tab li elements in Main.aspx
 */
export interface Tab {
  // Core identification
  id: string; // Unique tab ID (UUID)
  taskCode: string; // Task code from menu
  title: string; // Tab caption
  url: string; // ExecutionScript URL

  // Type and state
  type: TabType;
  state: TabState;

  // Tab state flags
  isActive: boolean; // Currently visible tab
  isPinned: boolean; // Pinned tab (can't be closed easily)
  isDirty: boolean; // Has unsaved changes

  // UI properties
  icon?: string; // Font Awesome icon
  tooltip?: string; // Hover tooltip

  // Metadata
  metadata?: TabMetadata;

  // Timestamps
  createdAt: Date;
  lastAccessedAt: Date;
}

/**
 * Tab metadata
 */
export interface TabMetadata {
  menuCode?: string; // Parent menu code
  description?: string; // Task description
  applicationCode?: string; // Application identifier
  version?: string; // V2 or V3
  exclusivityMode?: boolean; // Exclusivity flag
  canClose?: boolean; // Can be closed
  customData?: any; // Additional custom data
}

/**
 * Tab configuration
 */
export interface TabConfig {
  maxTabs: number; // Default: 5 (legacy limit)
  enablePersistence: boolean; // localStorage persistence
  confirmBeforeClose: boolean; // Confirm dirty tabs
  showToolsMenu: boolean; // Show tab tools
  enableDragDrop: boolean; // Enable drag/drop reordering
}
