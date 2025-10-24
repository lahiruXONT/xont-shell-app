import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { NotificationService } from '../../services/notification.service';
import { ReminderService } from '../../services/reminder.service';
import { SettingsService } from '../../services/settings.service';

// Models
import { User, UserProfile } from 'shared-lib';

/**
 * Top Navigation Bar Component
 * Legacy: Header section from Main.aspx
 *
 * Features:
 * - User profile display with avatar
 * - Business unit display
 * - Notifications bell with unread count
 * - User role selector
 * - Settings access
 * - About/Version info
 * - Logout
 */
@Component({
  selector: 'lib-top-nav',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss'],
})
export class TopNavComponent implements OnInit, OnDestroy {
  // Services
  private notificationService = inject(NotificationService);
  private reminderService = inject(ReminderService);
  private settingsService = inject(SettingsService);

  // Inputs
  @Input() user: User | null = null;
  @Input() showLogo = true;
  @Input() showBusinessUnit = true;
  @Input() showNotifications = true;
  @Input() showUserMenu = true;

  // Outputs
  @Output() logoutClicked = new EventEmitter<void>();
  @Output() settingsClicked = new EventEmitter<void>();
  @Output() versionInfoClicked = new EventEmitter<void>();
  @Output() aboutClicked = new EventEmitter<void>();
  @Output() roleChanged = new EventEmitter<string>();
  @Output() roleSelectorClicked = new EventEmitter<void>();

  // Component state
  private destroy$ = new Subject<void>();
  showUserDropdown = signal<boolean>(false);
  showRoleSelector = signal<boolean>(false);

  // Computed properties
  unreadNotificationCount = computed(() =>
    this.notificationService.unreadCount()
  );

  userProfile = computed<UserProfile>(() => ({
    userName: this.user?.userName || '',
    fullName: this.user?.fullName || '',
    email: this.user?.email || '',
    profileImage: this.user?.profileImage || 'images/avatars/avatar.png',
    currentBusinessUnit: this.user?.currentBusinessUnit || '',
    currentRole: this.user?.currentRole || '',
    theme: this.user?.theme || 'green',
  }));

  hasUnreadNotifications = computed(() => this.unreadNotificationCount() > 0);

  ngOnInit(): void {
    // Initialize notification service
    if (this.showNotifications) {
      this.initializeNotifications();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize notifications (SignalR connection)
   */
  private async initializeNotifications(): Promise<void> {
    try {
      // Load existing notifications
      await this.notificationService.loadNotifications();

      // Connect to SignalR hub (if configured)
      // Hub URL should be provided by the consuming app
      // await this.notificationService.connectToHub(hubUrl, accessToken);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Toggle user dropdown menu
   */
  toggleUserDropdown(): void {
    this.showUserDropdown.update((value) => !value);
    if (this.showUserDropdown()) {
      this.showRoleSelector.set(false);
    }
  }

  /**
   * Toggle role selector
   */
  toggleRoleSelector(): void {
    this.showRoleSelector.update((value) => !value);
    if (this.showRoleSelector()) {
      this.showUserDropdown.set(false);
    }
  }

  /**
   * Close all dropdowns
   */
  closeDropdowns(): void {
    this.showUserDropdown.set(false);
    this.showRoleSelector.set(false);
  }

  /**
   * Open notifications panel
   * Legacy: openNav() function
   */
  openNotifications(): void {
    this.notificationService.openPanel();
    this.closeDropdowns();
  }

  /**
   * Open settings modal
   */
  openSettings(): void {
    this.settingsService.openModal('theme');
    this.settingsClicked.emit();
    this.closeDropdowns();
  }

  /**
   * Open version info
   */
  openVersionInfo(): void {
    this.versionInfoClicked.emit();
    this.closeDropdowns();
  }

  /**
   * Open about modal
   */
  openAbout(): void {
    this.aboutClicked.emit();
    this.closeDropdowns();
  }

  /**
   * Handle logout click
   * Legacy: logout LinkButton
   */
  onLogout(): void {
    // Check if there are open tabs
    // This should be handled by the shell app
    this.logoutClicked.emit();
    this.closeDropdowns();
  }

  /**
   * Handle role change
   */
  onRoleChange(roleCode: string): void {
    this.roleChanged.emit(roleCode);
    this.closeDropdowns();
  }

  /**
   * Get notification count display
   */
  getNotificationCountDisplay(): string {
    const count = this.unreadNotificationCount();
    return count > 99 ? '99+' : count.toString();
  }

  /**
   * Get user initials for avatar fallback
   */
  getUserInitials(): string {
    const fullName = this.user?.fullName || '';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  }

  /**
   * Handle avatar image error
   */
  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'images/avatars/avatar.png';
  }
  onRoleSelectorClick(): void {
    this.roleSelectorClicked.emit();
  }
}
