/**
 * Tab types supported - mirrors legacy ExecutionType
 */
export enum TabType {
  IFRAME = 'iframe', // Legacy: ExecutionScript loading
  ROUTE = 'route', // Angular internal routes
  EXTERNAL = 'external', // External URL
}

/**
 * Tab loading states
 */
export enum TabState {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  IDLE = 'idle',
  MINIMIZED = 'minimized', // Legacy: Tab minimize feature
}

/**
 * Represents a single tab - mirrors legacy Tab structure
 * Legacy equivalent: Dynamic tabs in Main.aspx
 */
export interface Tab {
  // Core identification
  id: string; // Unique tab identifier (like tabcontent1, tabcontent2)
  taskCode: string; // Task code from menu (TASK001, etc.)
  title: string; // Tab caption/description
  icon: string; // Font awesome icon
  url: string; // ExecutionScript path or route
  type: TabType; // iframe/route/external
  state: TabState; // Current loading state

  // Tab behavior flags
  isActive: boolean; // Currently active tab
  isPinned: boolean; // Pinned tabs stay open
  isMinimized: boolean; // Legacy: minimize feature
  isMaximized: boolean; // Legacy: maximize feature

  // Ordering and positioning
  order: number; // Tab order (for sorting)

  // Timestamps
  createdAt: Date;
  lastAccessedAt: Date;

  // Additional metadata
  metadata?: {
    applicationCode?: string; // Legacy: Application code tracking
    exclusivityMode?: string; // Legacy: Task exclusivity mode
    hasUnsavedChanges?: boolean;
    sessionId?: string; // Session identifier
    executionType?: number; // Legacy: 0 or 1
    [key: string]: any;
  };

  // Error handling
  error?: string;
}

/**
 * Tab configuration options
 */
export interface TabConfig {
  maxTabs: number; // Maximum allowed tabs (default: 15)
  allowDuplicates: boolean; // Allow same task in multiple tabs
  persistTabs: boolean; // Save tabs to session/localStorage
  enableMinimize: boolean; // Enable minimize feature (legacy)
  enableMaximize: boolean; // Enable maximize feature (legacy)
  enableFullscreen: boolean; // Fullscreen mode
  defaultTabType: TabType;
  enableSorting: boolean; // Enable drag-drop tab reordering
  autoCloseOnError: boolean;
}

/**
 * Tab event data for notifications
 */
export interface TabEvent {
  type:
    | 'opened'
    | 'closed'
    | 'activated'
    | 'updated'
    | 'minimized'
    | 'maximized'
    | 'sorted';
  tab: Tab;
  timestamp: Date;
  previousState?: any;
}

/**
 * Tab DOM reference mapping
 * Legacy: Maps to tabcontent1, tabcontent2, etc.
 */
export interface TabDOMRef {
  tabId: string;
  headerElement?: HTMLElement;
  contentElement?: HTMLElement;
  iframeElement?: HTMLIFrameElement;
}
