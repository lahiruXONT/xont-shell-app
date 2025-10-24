/**
 * Active User Task tracking model
 * Legacy: ActiveUserTask class in Common.Data
 */
export interface ActiveUserTask {
  // User identification
  userName: string; // User.UserName
  businessUnit: string; // User.BusinessUnit
  sessionId: string; // Session.SessionID

  // Task identification
  taskCode: string; // Task being executed
  applicationCode?: string; // Application identifier

  // Task properties
  executionType: number; // 0=normal, 1=closing
  exclusivityMode?: string; // Task exclusivity mode
  statusFlag: number; // 1=active, 2=closed

  // User context
  powerUser?: boolean; // Is power user
  workstationId?: string; // Workstation ID

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Task logging options
 */
export interface TaskLogOptions {
  enableLogging: boolean;
  logToServer: boolean; // Call API
  logToConsole: boolean; // Console.log
  logLevel: 'info' | 'warn' | 'error' | 'debug';
}
