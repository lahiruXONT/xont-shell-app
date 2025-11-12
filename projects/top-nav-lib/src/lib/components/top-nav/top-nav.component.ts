import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User, UserProfile, UserRole } from 'shared-lib';
import { NotificationsPanelComponent } from '../notifications-panel/notifications-panel.component';
import { RoleSelectorComponent } from 'menu-bar-lib';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

/**
 * Top Navigation Bar Component
 * Displays logo, business unit, notifications, user menu, and role selector
 * Legacy: Part of Main.aspx.cs
 */
@Component({
  selector: 'lib-top-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NotificationsPanelComponent,
    RoleSelectorComponent,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss',
})
export class TopNavComponent {
  // Inputs
  @Input() user: User | null = null;
  @Input() showLogo = true;
  @Input() showBusinessUnit = true;
  @Input() showNotifications = true;
  @Input() showUserMenu = true;

  // Outputs
  @Output() logout = new EventEmitter<void>();
  @Output() settingsClicked = new EventEmitter<void>();
  @Output() notificationsClicked = new EventEmitter<void>();
  @Output() versionInfoClicked = new EventEmitter<void>();
  @Output() aboutClicked = new EventEmitter<void>();
  @Output() roleSelectorToggled = new EventEmitter<boolean>();
  @Output() rolesChanged = new EventEmitter<UserRole[]>();
  @Output() logoClicked = new EventEmitter<void>();

  // State
  showUserDropdown = signal<boolean>(false);
  showRoleSelector = signal<boolean>(false);
  showNotificationsPanel = signal<boolean>(false);

  // Computed properties
  userProfile = computed<UserProfile>(() => ({
    userName: this.user?.userName || '',
    fullName: this.user?.fullName || '',
    email: this.user?.email || '',
    profileImage: this.user?.profileImage || 'images/avatars/avatar.png',
    currentBusinessUnit: this.user?.currentBusinessUnit || '',
    currentRole: this.user?.currentRole?.roleName || '',
    theme: this.user?.theme || 'green',
  }));

  hasUnreadNotifications = computed(
    () => (this.user?.unreadNotificationCount ?? 0) > 0
  );

  getNotificationCountDisplay = computed(() => {
    const count = this.user?.unreadNotificationCount || 0;
    return count > 99 ? '99+' : count.toString();
  });

  // Event handlers
  onLogout(): void {
    this.logout.emit();
  }

  openSettings(): void {
    this.settingsClicked.emit();
  }

  openNotifications(): void {
    this.showNotificationsPanel.update((value) => !value);
    if (this.showNotificationsPanel()) {
      this.showUserDropdown.set(false);
      this.showRoleSelector.set(false);
    }
    this.notificationsClicked.emit();
  }

  openVersionInfo(): void {
    this.versionInfoClicked.emit();
  }

  openAbout(): void {
    this.aboutClicked.emit();
  }

  /**
   * Toggle user dropdown menu
   */
  toggleUserDropdown(): void {
    this.showUserDropdown.update((value) => !value);
    if (this.showUserDropdown()) {
      this.showRoleSelector.set(false); // Close role selector
    }
  }

  /**
   * Toggle role selector panel
   */
  toggleRoleSelector(): void {
    this.showRoleSelector.update((value) => !value);
    this.roleSelectorToggled.emit(this.showRoleSelector());
    if (this.showRoleSelector()) {
      this.showUserDropdown.set(false); // Close user dropdown
    }
  }

  /**
   * Close all dropdowns
   */
  closeDropdowns(): void {
    this.showUserDropdown.set(false);
    this.showRoleSelector.set(false);
    this.showNotificationsPanel.set(false);
    this.roleSelectorToggled.emit(false);
  }

  /**
   * Handle avatar image loading error
   */
  onAvatarError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'images/avatars/avatar.png'; // Fallback image
  }

  /**
   * Get user initials for avatar fallback
   */
  getUserInitials(): string {
    const fullName = this.user?.fullName || '';
    const initials = fullName
      .split(' ')
      .map((n) => n[0])
      .join('');
    return initials.toUpperCase();
  }

  onRoleSelectorClick(): void {
    this.toggleRoleSelector();
  }

  onRolesChanged(roles: UserRole[]): void {
    this.rolesChanged.emit(roles);
  }
}
