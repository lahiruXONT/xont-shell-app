import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole } from 'shared-lib';

/**
 * Role Selector Component
 * Allows selecting/switching multiple roles with checkboxes
 * Legacy: Role selection from Main.aspx
 */
@Component({
  selector: 'lib-role-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-selector.component.html',
  styleUrl: './role-selector.component.scss',
})
export class RoleSelectorComponent {
  @Input() roles: UserRole[] = [];
  @Input() currentRole: UserRole | null = null;
  @Input() allowMultiple = false;

  @Output() roleSelected = new EventEmitter<UserRole>();
  @Output() rolesChanged = new EventEmitter<UserRole[]>();

  showDropdown = signal<boolean>(false);

  toggleDropdown(): void {
    this.showDropdown.update((show) => !show);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  selectRole(role: UserRole): void {
    if (!this.allowMultiple) {
      this.roleSelected.emit(role);
      this.closeDropdown();
    } else {
      role.isSelected = !role.isSelected;
      const selectedRoles = this.roles.filter((r) => r.isSelected);
      this.rolesChanged.emit(selectedRoles);
    }
  }

  trackByRoleCode(index: number, role: UserRole): string {
    return role.roleCode;
  }
}
