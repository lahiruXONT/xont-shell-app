/**
 * Notification types from legacy system
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system',
  TASK = 'T', // Legacy: T = Task notification
  MESSAGE = 'message', // Legacy: Other = Message notification
  ADMIN_ALERT = 'admin', // Legacy: Admin alerts
  LICENSE = 'license', // Legacy: License expiry alerts
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification status
 */
export enum NotificationStatus {
  UNREAD = 1,
  READ = 2,
  ARCHIVED = 3,
}

/**
 * Represents a single notification
 * Legacy equivalent: Notification data from repNotifications repeater
 */
export interface Notification {
  // Core identification
  id: string; // RecID in legacy
  recID: number; // Database ID

  // Notification details
  type: NotificationType; // T or message
  priority: NotificationPriority;
  title: string;
  message: string; // Description in legacy
  icon?: string;

  // Status
  status: NotificationStatus; // 1=unread, 2=read, 3=archived
  isRead: boolean;
  isArchived: boolean;

  // Task-related (if type = 'T')
  taskCode?: string; // For task notifications
  taskUrl?: string; // URL to open task
  taskType?: string; // Task type
  userName?: string; // Related user

  // Timestamps
  timestamp: Date;
  readAt?: Date;
  expiresAt?: Date;

  // Actions
  actionUrl?: string;
  actionText?: string;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Admin alert configuration
 * Legacy: Admin alert popup with audio
 */
export interface AdminAlert {
  alertNumber: number;
  message: string;
  alertTime: Date;
  timeInterval: number; // Seconds
  repeatTimes: number;
  recID: number;
  playSound: boolean; // Legacy: myTune audio element
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  maxNotifications: number;
  autoMarkRead: boolean;
  autoMarkReadDelay: number;
  showToast: boolean;
  toastDuration: number;
  enableSound: boolean;
  groupByType: boolean;
  enableAdminAlerts: boolean;
}

/**
 * Notification panel state
 */
export interface NotificationPanelState {
  isOpen: boolean;
  unreadCount: number;
  selectedNotification: Notification | null;
  showMessageView: boolean; // Legacy: notification message section
  notifications: Notification[];
}
