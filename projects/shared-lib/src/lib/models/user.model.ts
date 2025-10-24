import { BusinessUnitDescription } from './business-unit.model';
import { UserRole } from './user-role.model';

/**
 * Represents a user in the system
 * Legacy equivalent: User class in Common.Data
 */
export interface User {
  permissions: string[];
  // Core identification
  userId: string;
  userName: string;
  fullName: string;
  email: string;

  // Profile information
  profileImage?: string; // URL to profile picture
  phoneNumber?: string;

  // User context
  currentBusinessUnit: string; // Current BU
  businessUnits: BusinessUnitDescription[];
  distributorCode?: string; // Distributor code
  roles: UserRole[]; // All user roles
  currentRole: string; // Active role
  defaultRole?: string; // Default role code
  priorityRole?: string; // PRTROLE if exists

  // User settings
  theme: string; // green, blue, red, gray, purple
  fontSize: string; // Font size setting
  fontName: string; // Font family
  fontColor?: string; // Custom font color
  language: string; // Language preference

  // Status flags
  isActive: boolean;
  isPowerUser: boolean;
  isLocked: boolean;

  // Timestamps
  lastLoginDate?: Date;
  passwordChangedDate?: Date;
  createdDate?: Date;
  passwordExpiry?: Date;
  isPasswordExpired: boolean;
  mustChangePassword: boolean;
}

/**
 * User profile for display
 */
export interface UserProfile {
  userName: string;
  fullName: string;
  email: string;
  profileImage: string;
  currentBusinessUnit: string;
  currentRole: string;
  theme: string;
}

/**
 * User preferences/settings
 */
export interface UserPreferences {
  theme: string;
  fontSize: string;
  fontName: string;
  fontColor: string;
  language: string;
  autoSave: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}
