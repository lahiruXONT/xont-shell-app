/**
 * Menu Group - Represents a collapsible menu section
 * Legacy: UserMenu class in Domain
 */
export interface MenuGroup {
  menuCode: string; // MenuCode (e.g., 'CUSTOMER')
  description: string; // Menu caption/description
  icon: string; // Font awesome icon class
  order: number; // Display order
  isExpanded: boolean; // Expanded/collapsed state
  isVisible: boolean; // Visibility based on role
  tasks: MenuTask[]; // Child tasks
  roleCode?: string; // Associated role code
}

/**
 * Menu Task - Individual task within a menu group
 * Legacy: UserTask class in Domain
 */
export interface MenuTask {
  taskCode: string; // Task code (e.g., 'TASK001')
  menuCode: string; // Parent menu code
  caption: string; // Task caption
  description: string; // Task description
  icon: string; // Font awesome icon
  url: string; // ExecutionScript path
  taskType: string; // Task type identifier
  applicationCode: string; // Application code
  exclusivityMode: number; // 0=none, 1=BU level, 2=territory level
  executionType: number; // 0=normal, 1=closing
  order: number; // Display order
  isVisible: boolean; // Visibility flag
  isFavorite: boolean; // Is bookmarked
}

/**
 * Menu hierarchy representing full menu structure
 * Legacy: Full menu system loaded from DB
 */
export interface MenuHierarchy {
  roleCode: string;
  roleName: string;
  isPriorityRole: boolean; // Is this a PRTROLE
  isDefaultRole: boolean; // Is default role
  menuGroups: MenuGroup[];
  totalTasks: number;
}

/**
 * Menu view mode
 */
export enum MenuViewMode {
  LIST = 'list', // Classic list view
  GRAPHICAL = 'graphical', // Graphical icon view (V2002)
}

/**
 * Menu search result
 */
export interface MenuSearchResult {
  taskCode: string;
  menuCode: string;
  caption: string;
  description: string;
  path: string; // "Menu > Task" breadcrumb
  matchedText: string; // Highlighted match
}

/**
 * Menu configuration
 */
export interface MenuConfig {
  showTaskCodes: boolean; // Show/hide task codes
  viewMode: MenuViewMode;
  enableSearch: boolean;
  enableFavorites: boolean;
  expandAll: boolean;
  cacheMenus: boolean;
  cacheDuration: number; // minutes
}

/**
 * System task for auto-loading
 * Legacy: AUTOMENU, AUTODAILY
 */
export interface SystemTask {
  taskCode: string;
  type: 'AUTOMENU' | 'AUTODAILY';
  shouldAutoLoad: boolean;
  lastExecuted?: Date;
}
