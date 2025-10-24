/**
 * Represents a reminder
 * Legacy: Reminder system from right sidebar
 */
export interface Reminder {
  // Core identification
  reminderId: string; // ReminderID in legacy
  businessUnit: string;
  userName: string;

  // Reminder details
  title: string; // ReminderID serves as title in legacy
  message: string;

  // Trigger information
  triggerTime: Date; // When to trigger
  timeZone: string;

  // Status
  isActive: boolean;
  isTriggered: boolean;
  isExpired: boolean;

  // Repeat settings
  repeatInterval?: number; // Minutes to repeat
  repeatCount?: number; // Times to repeat (default: 0 = no repeat)

  // Timestamps
  createdAt: Date;
  triggeredAt?: Date;
  dismissedAt?: Date;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Reminder trigger event
 */
export interface ReminderTriggerEvent {
  reminder: Reminder;
  canRemindLater: boolean;
  remindLaterInterval: number; // Default: 10 minutes
}

/**
 * Reminder configuration
 */
export interface ReminderConfig {
  maxReminders: number; // Default: 10 (from legacy)
  defaultRemindLaterInterval: number; // 10 minutes
  checkInterval: number; // Polling interval (ms)
  showExpiredOnLogin: boolean;
  enableSound: boolean;
  autoCloseAfter?: number; // ms (if set)
}

/**
 * Reminder panel state
 */
export interface ReminderPanelState {
  reminders: Reminder[];
  selectedReminder: Reminder | null;
  isCreatingNew: boolean;
  isEditMode: boolean;
  showCalendar: boolean;
  isOpen: boolean;
}

/**
 * Expired reminders collection
 */
export interface ExpiredReminders {
  reminders: Reminder[];
  count: number;
  oldestExpiredDate: Date;
}
