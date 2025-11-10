import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import {
  ThemeService,
  NotificationsPanelComponent,
  SettingsModalComponent,
} from 'top-nav-lib';
import { TabManagerService, TabManagerComponent } from 'tab-management-lib';
import { MenuBarComponent, MenuBarService } from 'menu-bar-lib';
import { TopNavComponent } from 'top-nav-lib';
import { User, MenuTask, MenuConfig, Tab, UserRole } from 'shared-lib';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TopNavComponent,
    MenuBarComponent,
    TabManagerComponent,
    NotificationsPanelComponent,
    SettingsModalComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  // User data - FIXED signal access
  readonly currentUser = computed(() => this.authService.currentUser());

  // Tab management
  readonly activeTab = computed(() => this.tabManagerService.activeTab());

  // Role codes for menu
  selectedRoleCodes = signal<string[]>([]);

  constructor(
    private authService: AuthenticationService,
    private menuBarService: MenuBarService,
    private tabManagerService: TabManagerService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

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
      // Set initial role codes
      this.selectedRoleCodes.set([user.currentRole.roleCode ?? '']);
      await this.menuBarService.loadMenuForRole([
        user.currentRole.roleCode ?? '',
      ]);
      console.log('Menu loaded successfully');
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  }

  /**
   * Handle roles changed from role selector
   */
  async onRolesChanged(roles: any): Promise<void> {
    const roleCodes = roles.map((role: UserRole) => role.roleCode);
    this.selectedRoleCodes.set(roleCodes);

    try {
      await this.menuBarService.loadMenuForRole(roleCodes);
      console.log('Menu reloaded for selected roles');
    } catch (error) {
      console.error('Failed to reload menu:', error);
    }
  }

  /**
   * Handle task selected from menu
   */
  onTaskSelected(task: MenuTask): void {
    this.tabManagerService.openTab(task.taskCode, task.description, task.url, {
      metadata: { menuCode: task.menuCode },
    });
  }

  /**
   * Handle tab changed
   */
  onTabChanged(tab: Tab): void {
    this.router.navigate(['/task', tab.taskCode]);
  }

  /**
   * Handle tab closed
   */
  onTabClosed(tab: Tab): void {
    console.log('Tab closed:', tab);
  }

  /**
   * Handle user logout
   */
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/']);
  }

  onNotificationClicked(): void {
    // TODO: Implement notification panel logic
  }

  onSettingsClicked(): void {
    // TODO: Implement settings modal logic
  }

  onTaskFavorited(event: any): void {
    // TODO: Implement task favorited logic
  }

  /**
   * Get current business unit from user
   */
  currentBusinessUnit() {
    const user = this.currentUser();
    if (!user) return null;

    return user.businessUnits.find(
      (bu) => bu.code === user.currentBusinessUnit
    );
  }

  /**
   * Get current role from user
   */
  currentRole() {
    const user = this.currentUser();
    if (!user) return null;

    return user.roles.find((r) => r.roleCode === user.currentRole.roleCode);
  }
}
