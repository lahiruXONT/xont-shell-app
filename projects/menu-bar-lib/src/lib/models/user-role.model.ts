/**
 * User Role model
 * Legacy: UserRole class in Domain
 */
export interface UserRole {
  roleCode: string; // Role code (e.g., 'ADMIN', 'PRTROLE001')
  description: string; // Role name/description
  isActive: boolean;
  isPriorityRole: boolean; // Is this a PRTROLE
  isDefaultRole: boolean; // Is default role for user
  isSelected: boolean; // Selected in multi-role checkbox
  permissions: string[]; // Permission codes
  menuAccess: string[]; // Menu codes accessible
}

/**
 * Role permission details
 */
export interface RolePermission {
  permissionCode: string;
  description: string;
  permissionType: 'READ' | 'WRITE' | 'DELETE' | 'EXECUTE';
}

/**
 * Role selector state
 */
export interface RoleSelectorState {
  availableRoles: UserRole[];
  selectedRoles: UserRole[];
  priorityRole: UserRole | null;
  defaultRole: UserRole | null;
  currentRole: UserRole | null;
  isMultiSelect: boolean;
}
