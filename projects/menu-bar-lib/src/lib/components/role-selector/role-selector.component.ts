import { Component, Input, Output, EventEmitter, signal, ElementRef, HostListener } from '@angular/core';
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
  @Input() businessUnits: { code: string; description: string }[] = [];
  @Input() currentBusinessUnit: string | null = null;

  @Output() roleSelected = new EventEmitter<UserRole>();
  @Output() rolesChanged = new EventEmitter<UserRole[]>();
  @Output() businessUnitSelected = new EventEmitter<string>();

  isDropdownOpen = signal<boolean>(false);

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    this.isDropdownOpen.update((value) => !value);
  }

  selectRole(role: UserRole): void {
    this.roleSelected.emit(role);
    this.isDropdownOpen.set(false);
  }

  selectRoles(roles: UserRole[]): void {
    this.rolesChanged.emit(roles);
    this.isDropdownOpen.set(false);
  }

  selectBusinessUnit(buCode: string): void {
    this.businessUnitSelected.emit(buCode);
    this.isDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  trackByRoleCode(index: number, role: UserRole): string {
    return role.roleCode;
  }

  trackByBuCode(index: number, bu: { code: string; description: string }): string {
    return bu.code;
  }
}
