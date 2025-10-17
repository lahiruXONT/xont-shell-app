import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import all the library components
import {
  MenuBarComponent,
  UserRole,
  BusinessUnit,
  MenuGroup,
} from 'menu-bar-lib';
import { TopNavComponent } from 'top-nav-lib';
import { TabManagerComponent } from 'tab-management-lib';

import { GlobalStateService } from '../../services/global-state.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MenuBarComponent,
    TopNavComponent,
    TabManagerComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() currentUser: any = null;
  @Output() userLogout = new EventEmitter<void>();
  @Output() themeChanged = new EventEmitter<string>();
  @Output() businessUnitChanged = new EventEmitter<string>();

  // Component signals
  private userRolesSignal = signal<UserRole[]>([]);
  private businessUnitsSignal = signal<BusinessUnit[]>([]);
  private menuGroupsSignal = signal<MenuGroup[]>([]);
  private isMenuCollapsedSignal = signal<boolean>(false);

  // Computed properties
  readonly currentTheme = computed(() => this.globalState.currentTheme());
  readonly currentBusinessUnit = computed(() =>
    this.globalState.currentBusinessUnit()
  );
  readonly userDisplayName = computed(() => this.globalState.userDisplayName());

  // Template properties
  readonly appTitle = 'VENTURA CRM';
  readonly appLogo = 'assets/img/ventura-logo.png';

  constructor(
    private globalState: GlobalStateService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Load user roles
      const roles = await this.dataService.getUserRoles();
      this.userRolesSignal.set(roles);

      // Load business units
      const businessUnits = await this.dataService.getBusinessUnits();
      this.businessUnitsSignal.set(businessUnits);

      // Load menu structure
      const menuGroups = await this.dataService.getMenuStructure();
      this.menuGroupsSignal.set(menuGroups);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  private setupSubscriptions(): void {
    // Subscribe to global state changes
    this.globalState.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme) => {
        // Theme is already applied in app component
      });
  }

  // Menu bar event handlers
  onTaskSelected(task: any): void {
    console.log('Task selected:', task);

    // Create a new tab for the selected task
    // This would typically integrate with the tab manager service
    // For now, we'll just log it
  }

  onRoleChanged(role: UserRole): void {
    console.log('Role changed:', role);
    this.globalState.setCurrentRole(role.roleCode);

    // Reload menu structure for new role
    this.loadMenuForRole(role.roleCode);
  }

  onBusinessUnitChanged(businessUnit: BusinessUnit): void {
    console.log('Business unit changed:', businessUnit);
    this.globalState.setCurrentBusinessUnit(businessUnit.businessUnitCode);
    this.businessUnitChanged.emit(businessUnit.businessUnitCode);
  }
  onBusinessUnitChangedNav(businessUnitCode: string): void {
    console.log('Business unit changed:', businessUnitCode);
    this.globalState.setCurrentBusinessUnit(businessUnitCode);
    this.businessUnitChanged.emit(businessUnitCode);
  }

  onMenuToggled(collapsed: boolean): void {
    this.isMenuCollapsedSignal.set(collapsed);
  }

  // Top navigation event handlers
  onLogout(): void {
    this.userLogout.emit();
  }

  onProfileClicked(user: any): void {
    console.log('Profile clicked:', user);
    // Navigate to profile page or show profile modal
  }

  onSettingsClicked(): void {
    console.log('Settings clicked');
    // Navigate to settings page or show settings modal
  }

  onThemeChanged(theme: string): void {
    this.globalState.setCurrentTheme(theme);
    this.themeChanged.emit(theme);
  }

  // Tab management event handlers
  onTabCreated(tab: any): void {
    console.log('Tab created:', tab);
  }

  onTabClosed(tab: any): void {
    console.log('Tab closed:', tab);
  }

  onTabActivated(tab: any): void {
    console.log('Tab activated:', tab);
  }

  onFullscreenToggled(isFullscreen: boolean): void {
    console.log('Fullscreen toggled:', isFullscreen);

    // Apply fullscreen styles to layout
    if (isFullscreen) {
      document.body.classList.add('fullscreen-mode');
    } else {
      document.body.classList.remove('fullscreen-mode');
    }
  }

  // Private methods
  private async loadMenuForRole(roleCode: string): Promise<void> {
    try {
      const menuGroups = await this.dataService.getMenuStructureForRole(
        roleCode
      );
      this.menuGroupsSignal.set(menuGroups);
    } catch (error) {
      console.error('Failed to load menu for role:', error);
    }
  }

  // Getters for template
  get userRoles(): UserRole[] {
    return this.userRolesSignal();
  }

  get businessUnits(): BusinessUnit[] {
    return this.businessUnitsSignal();
  }

  get menuGroups(): MenuGroup[] {
    return this.menuGroupsSignal();
  }

  get isMenuCollapsed(): boolean {
    return this.isMenuCollapsedSignal();
  }
}
