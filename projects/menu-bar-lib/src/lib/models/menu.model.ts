export interface MenuTask {
  taskCode: string;
  caption: string;
  description: string;
  icon: string;
  executionScript: string;
  taskType: 'FORM' | 'REPORT' | 'DASHBOARD' | 'EXTERNAL';
  applicationCode: string;
  exclusivityMode: 'NONE' | 'USER' | 'SYSTEM';
  menuCode: string;
  parentMenuCode?: string;
  orderIndex: number;
  isActive: boolean;
  isVisible: boolean;
  requiredPermissions?: string[];
  helpFileUrl?: string;
}

export interface MenuGroup {
  menuCode: string;
  menuName: string;
  description: string;
  icon: string;
  tasks: MenuTask[];
  isExpanded: boolean;
  orderIndex: number;
}

export interface MenuStructure {
  roleCode: string;
  businessUnitCode: string;
  menuGroups: MenuGroup[];
  lastUpdated: Date;
}

export interface TaskSelection {
  task: MenuTask;
  timestamp: Date;
  userId: string;
  sessionId: string;
}
