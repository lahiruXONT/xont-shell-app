import { CustomTheme, ThemeName } from './theme.model';

/**
 * User settings (comprehensive)
 * Legacy: Settings modal in Main.aspx
 */
export interface UserSettings {
  // Theme settings
  theme: ThemeName;
  customTheme?: CustomTheme;

  // Font settings
  fontFamily: string;
  fontSize: string;
  fontColor: string;

  // Language settings
  language: string;

  // Profile settings
  profileImage: string;

  // Notification settings
  notificationsEnabled: boolean;
  notificationSound: boolean;

  // Behavior settings
  autoSave: boolean;
  confirmBeforeClose: boolean;

  // Display settings
  dateFormat: string;
  timeFormat: string;
  timezone: string;
}

/**
 * Settings validation result
 */
export interface SettingsValidation {
  isValid: boolean;
  errors: SettingsError[];
}

export interface SettingsError {
  field: string;
  message: string;
}

/**
 * Password change request
 * Legacy: Change password section in settings
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Profile image upload
 * Legacy: imgProUpload file upload control
 */
export interface ProfileImageUpload {
  file: File;
  maxSizeKB: number; // Default: 300KB
  allowedTypes: string[]; // jpg, jpeg, png
}
