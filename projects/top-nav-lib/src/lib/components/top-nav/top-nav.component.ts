import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TopNavService } from '../../top-nav.service';
import { NotificationService } from '../../notification.service';
import { ThemeService } from '../../theme.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { UserDropdownComponent } from '../user-dropdown/user-dropdown.component';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { User, UserSession } from '../../models/user.model';
import { ThemeColor } from '../../models/theme.model';

@Component({
  selector: 'lib-top-nav',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotificationsComponent,
    UserDropdownComponent,
    SettingsModalComponent,
  ],
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss'],
})
export class TopNavComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Input properties
  @Input() userName = '';
  @Input() currentBusinessUnit = '';
  @Input() profileImageSrc = 'assets/img/avatars/avatar.png';
  @Input() showNotifications = true;
  @Input() showUserMenu = true;
  @Input() showSettings = true;
  @Input() showBusinessUnitInfo = true;
  @Input() appTitle = 'VENTURA CRM';
  @Input() appLogo = 'assets/img/logo.png';

  // Output events
  @Output() logout = new EventEmitter<void>();
  @Output() businessUnitChanged = new EventEmitter<string>();
  @Output() menuToggled = new EventEmitter<boolean>();
  @Output() profileClicked = new EventEmitter<User>();
  @Output() settingsClicked = new EventEmitter<void>();

  // Component signals
  public showNotificationsPanelSignal = signal<boolean>(false);
  public showUserDropdownSignal = signal<boolean>(false);
  public showSettingsModalSignal = signal<boolean>(false);
  private isMenuCollapsedSignal = signal<boolean>(false);

  // Computed properties
  readonly currentUser = computed(() => this.topNavService.currentUser());
  readonly unreadNotificationsCount = computed(
    () => this.notificationService.notificationSummary().unread
  );
  readonly hasUnreadNotifications = computed(
    () => this.unreadNotificationsCount() > 0
  );
  readonly currentTheme = computed(() => this.themeService.currentTheme());

  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    return user?.fullName || user?.userName || this.userName || 'User';
  });

  readonly userProfileImage = computed(() => {
    const user = this.currentUser();
    return user?.profilePicture || this.profileImageSrc;
  });

  // Template properties
  currentTime = new Date();
  private timeInterval?: any;

  constructor(
    private topNavService: TopNavService,
    private notificationService: NotificationService,
    private themeService: ThemeService
  ) {
    // Effect to track user activity
    effect(() => {
      if (this.topNavService.isAuthenticated()) {
        this.topNavService.updateLastActivity();
      }
    });
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.startClock();
    this.setupClickOutsideHandlers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private setupSubscriptions(): void {
    // Subscribe to service changes if needed for backward compatibility
    this.topNavService.userSession$
      .pipe(takeUntil(this.destroy$))
      .subscribe((session) => {
        // Handle session changes if needed
      });
  }

  private startClock(): void {
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  private setupClickOutsideHandlers(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      // Close notifications panel if clicked outside
      if (
        this.showNotificationsPanelSignal() &&
        !target.closest('.notifications-panel') &&
        !target.closest('.notifications-trigger')
      ) {
        this.showNotificationsPanelSignal.set(false);
      }

      // Close user dropdown if clicked outside
      if (
        this.showUserDropdownSignal() &&
        !target.closest('.user-dropdown') &&
        !target.closest('.user-trigger')
      ) {
        this.showUserDropdownSignal.set(false);
      }
    });
  }

  // Event handlers
  onMenuToggle(): void {
    this.isMenuCollapsedSignal.update((collapsed) => !collapsed);
    this.menuToggled.emit(this.isMenuCollapsedSignal());
  }

  onNotificationsToggle(): void {
    this.showNotificationsPanelSignal.update((show) => !show);
    this.showUserDropdownSignal.set(false); // Close other panels
  }

  onUserMenuToggle(): void {
    this.showUserDropdownSignal.update((show) => !show);
    this.showNotificationsPanelSignal.set(false); // Close other panels
  }

  onSettingsClick(): void {
    this.showSettingsModalSignal.set(true);
    this.settingsClicked.emit();
  }

  onProfileClick(): void {
    const user = this.currentUser();
    if (user) {
      this.profileClicked.emit(user);
    }
  }

  onLogout(): void {
    this.topNavService.logout();
    this.logout.emit();
  }

  onBusinessUnitChange(businessUnit: string): void {
    this.businessUnitChanged.emit(businessUnit);
  }

  onThemeChange(theme: ThemeColor): void {
    this.themeService.setTheme(theme);
    this.topNavService.updateUserPreferences({ theme });
  }

  // Modal handlers
  onSettingsModalClose(): void {
    this.showSettingsModalSignal.set(false);
  }

  onSettingsModalSave(settings: any): void {
    // Handle settings save
    this.topNavService.updateUserPreferences(settings);
    this.showSettingsModalSignal.set(false);
  }

  // Notification handlers
  onNotificationClick(notification: any): void {
    this.notificationService.markAsRead(notification.id);

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }

  onMarkAllNotificationsRead(): void {
    this.notificationService.markAllAsRead();
  }

  onClearAllNotifications(): void {
    this.notificationService.clearAllNotifications();
  }

  // Utility methods
  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getNotificationBadgeClass(): string {
    const count = this.unreadNotificationsCount();
    if (count === 0) return 'badge-none';
    if (count < 10) return 'badge-normal';
    return 'badge-high';
  }

  getThemeClass(): string {
    return `theme-${this.currentTheme()}`;
  }
  setDefaultImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/avatars/default.png';
  }
}
