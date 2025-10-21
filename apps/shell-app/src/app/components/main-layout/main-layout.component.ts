import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

// Import all 3 libraries
import {
  TopNavComponent,
  NotificationsPanelComponent,
  SettingsModalComponent,
  NotificationService,
  ThemeService,
  UserProfile,
} from 'top-nav-lib';
import {
  MenuBarComponent,
  MenuBarService,
  FavoritesService,
} from 'menu-bar-lib';
import {
  TabManagerComponent,
  TabManagerService,
  TabType,
} from 'tab-management-lib';

import { AuthenticationService } from '../../services/authentication.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopNavComponent,
    NotificationsPanelComponent,
    SettingsModalComponent,
    MenuBarComponent,
    TabManagerComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  // User data
  // User data - FIXED signal access
  readonly currentUser = computed(() => this.authService.currentUser());

  // User profile for top nav
  readonly userProfile = computed<UserProfile | null>(() => {
    const user = this.currentUser();
    if (!user) return null;

    return {
      userName: user.userName ?? '',
      fullName: user.fullName ?? '',
      email: user.email ?? '',
      profileImage: user.profileImage ?? 'assets/images/default-user.png',
      currentBusinessUnit: user.currentBusinessUnit ?? '',
      currentRole: user.currentRole ?? '',
      theme: String(this.themeService.currentTheme()),
    };
  });

  router = inject(Router);

  constructor(
    private authService: AuthenticationService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private menuBarService: MenuBarService,
    private favoritesService: FavoritesService,
    public tabManagerService: TabManagerService
  ) {}

  async ngOnInit(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    // Initialize SignalR for notifications
    await this.initializeNotifications();

    // Load user theme
    await this.loadUserTheme();

    // 🔥 CRITICAL FIX: Load menu for the current user
    await this.loadUserMenu();
  }

  /**
   * Load menu for current user
   */
  private async loadUserMenu(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    try {
      await this.menuBarService.loadMenuForRole(
        user.userName,
        user.currentRole,
        user.currentBusinessUnit
      );

      // Also load favorites
      await this.favoritesService.loadFavorites(
        user.userName,
        user.currentBusinessUnit
      );

      console.log('Menu loaded successfully');
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  }

  /**
   * Initialize SignalR notifications
   */
  private async initializeNotifications(): Promise<void> {
    try {
      await this.notificationService.connectToHub(
        `${environment.baseUrl}/hubs/notification`,
        () => this.authService.getToken() || ''
      );

      await this.notificationService.loadNotifications();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Load user theme
   */
  private async loadUserTheme(): Promise<void> {
    // Theme service will load from localStorage/API
    const theme = this.themeService.currentTheme();
    console.log('Current theme:', theme);
  }

  /**
   * Handle task selected from menu
   */
  onTaskSelected(task: any): void {
    this.tabManagerService.openTab(task.taskCode, task.caption, task.url, {
      icon: task.icon,
      type: TabType.IFRAME,
      metadata: {
        menuCode: task.menuCode,
        description: task.description,
        applicationCode: task.applicationCode,
      },
    });
  }

  /**
   * Handle task favorited
   */
  onTaskFavorited(event: any): void {
    console.log('Task favorited:', event);
  }

  /**
   * Handle notification clicked
   */
  onNotificationClicked(): void {
    this.notificationService.togglePanel();
  }

  /**
   * Handle settings clicked
   */
  onSettingsClicked(): void {
    // Open settings modal
    console.log('Settings clicked');
  }

  /**
   * Handle logout
   */
  onLogout(): void {
    this.authService.logout();
  }
  navigateToDashboard(): void {
    this.router.navigate(['/app']);
  }
}
