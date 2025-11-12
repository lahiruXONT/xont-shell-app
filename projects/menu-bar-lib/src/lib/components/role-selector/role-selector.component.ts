import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole } from 'shared-lib';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenu } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';

/**
 * Role Selector Component
 * Allows selecting/switching multiple roles with checkboxes
 * Legacy: Role selection from Main.aspx
 */
@Component({
  selector: 'lib-role-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
  ],
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

  @ViewChild('roleMenu') roleMenu!: MatMenu;

  isDropdownOpen = signal<boolean>(false);

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    this.isDropdownOpen.update((value) => !value);
  }

  selectRole(role: UserRole): void {
    this.roleSelected.emit(role);
    this.isDropdownOpen.set(false);
  }

  onRolesSelectionChange(selectedRoles: UserRole[]): void {
    this.rolesChanged.emit(selectedRoles);
    this.isDropdownOpen.set(false);
  }

  handleRoleSelectionChange(event: MatSelectionListChange): void {
    const selectedRoles = event.source.selectedOptions.selected.map(option => option.value);
    this.onRolesSelectionChange(selectedRoles);
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

  trackByBuCode(
    index: number,
    bu: { code: string; description: string }
  ): string {
    return bu.code;
  }

  closeRoleMenu(): void {
    (this.roleMenu as any).close();
  }
}
