export interface UserRole {
  roleCode: string;
  description: string;
  isActive: boolean;
  isPriority?: boolean;
  permissions?: string[];
  lastAccessed?: Date;
}

export interface UserRoleSelection {
  role: UserRole;
  timestamp: Date;
  userId: string;
}
