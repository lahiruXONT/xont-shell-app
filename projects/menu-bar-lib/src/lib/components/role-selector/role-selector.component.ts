import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole } from '../../models/user-role.model';
@Component({
  selector: 'lib-role-selector',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './role-selector.component.html',
  styleUrl: './role-selector.component.scss',
})
export class RoleSelectorComponent {
  @Input() userRoles: UserRole[] = [];
  @Input() selectedRole: UserRole | null = null;
  @Input() showRoleList = true;

  @Output() roleSelected = new EventEmitter<UserRole>();

  public selectedRoleCodeSignal: WritableSignal<string> = signal('');
  public selectedRoleSignal: WritableSignal<UserRole | null> = signal(null);

  readonly availableRoles = computed(() =>
    this.userRoles.filter((role) => role.isActive)
  );

  constructor() {
    // Initialize signals
    effect(() => {
      if (this.selectedRole) {
        this.selectedRoleSignal.set(this.selectedRole);
        this.selectedRoleCodeSignal.set(this.selectedRole.roleCode);
      } else {
        this.selectedRoleSignal.set(null);
        this.selectedRoleCodeSignal.set('');
      }
    });
  }

  ngOnChanges(): void {
    if (this.selectedRole) {
      this.selectedRoleCodeSignal.set(this.selectedRole.roleCode);
    } else {
      this.selectedRoleCodeSignal.set('');
    }
  }

  onRoleChange(): void {
    const selectedCode = this.selectedRoleCodeSignal();
    const role = this.userRoles.find((r) => r.roleCode === selectedCode);
    if (role) {
      this.roleSelected.emit(role);
    }
  }

  selectRole(role: UserRole): void {
    if (role.isActive) {
      this.selectedRoleCodeSignal.set(role.roleCode);
      this.roleSelected.emit(role);
    }
  }

  trackByRole(index: number, role: UserRole): string {
    return role.roleCode;
  }
}
