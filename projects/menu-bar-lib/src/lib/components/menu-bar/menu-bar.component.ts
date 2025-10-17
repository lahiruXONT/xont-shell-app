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
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MenuBarService } from '../../menu-bar.service';
import { RoleSelectorComponent } from '../role-selector/role-selector.component';
import { BusinessUnitSelectorComponent } from '../business-unit-selector/business-unit-selector.component';
import { UserRole } from '../../models/user-role.model';
import { BusinessUnit } from '../../models/business-unit.model';
import { MenuTask, MenuGroup } from '../../models/menu.model';

@Component({
  selector: 'lib-menu-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RoleSelectorComponent,
    BusinessUnitSelectorComponent,
  ],
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss'],
})
export class MenuBarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Input properties
  @Input() userName = '';
  @Input() currentBusinessUnit = '';
  @Input() userRoles: UserRole[] = [];
  @Input() businessUnits: BusinessUnit[] = [];
  @Input() menuGroups: MenuGroup[] = [];
  @Input() collapseSidebar = false;
  @Input() showSearch = true;
  @Input() showRoleSelector = true;
  @Input() showBusinessUnitSelector = true;
  @Input() theme = 'blue';

  // Output events
  @Output() taskSelected = new EventEmitter<MenuTask>();
  @Output() roleChanged = new EventEmitter<UserRole>();
  @Output() businessUnitChanged = new EventEmitter<BusinessUnit>();
  @Output() menuToggled = new EventEmitter<boolean>();
  @Output() searchPerformed = new EventEmitter<string>();

  // Component signals
  public searchTermSignal: WritableSignal<string> = signal('');
  public selectedRoleSignal: WritableSignal<UserRole | null> = signal(null);
  public selectedBusinessUnitSignal: WritableSignal<BusinessUnit | null> =
    signal(null);
  public isGraphicalViewSignal: WritableSignal<boolean> = signal(false);
  public isCollapsedSignal: WritableSignal<boolean> = signal(false);

  // Computed properties using Angular 19 signals
  readonly filteredMenuGroups = computed(() => {
    const searchTerm = this.searchTermSignal().toLowerCase();
    if (!searchTerm) {
      return this.menuGroups;
    }

    return this.menuGroups
      .map((group) => ({
        ...group,
        tasks: group.tasks.filter(
          (task) =>
            task.caption.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.taskCode.toLowerCase().includes(searchTerm)
        ),
      }))
      .filter((group) => group.tasks.length > 0);
  });

  readonly hasSearchResults = computed(() => {
    const searchTerm = this.searchTermSignal();
    return searchTerm && this.filteredMenuGroups().length > 0;
  });

  readonly isSearchActive = computed(() => {
    return this.searchTermSignal().length > 0;
  });

  // Template properties
  searchTerm = '';
  showTaskCodes = false;
  expandedGroups: Set<string> = new Set();

  constructor(private menuBarService: MenuBarService) {
    // Effect to sync internal signals with service
    effect(() => {
      const collapsed = this.collapseSidebar;
      this.isCollapsedSignal.set(collapsed);
      this.menuBarService.setCollapsed(collapsed);
    });
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.initializeDefaults();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Subscribe to service changes
    this.menuBarService.selectedRole$
      .pipe(takeUntil(this.destroy$))
      .subscribe((role: UserRole | null) => {
        this.selectedRoleSignal.set(role);
      });

    this.menuBarService.selectedBusinessUnit$
      .pipe(takeUntil(this.destroy$))
      .subscribe((businessUnit: BusinessUnit | null) => {
        this.selectedBusinessUnitSignal.set(businessUnit);
      });
  }

  private initializeDefaults(): void {
    // Initialize with first available role if none selected
    if (this.userRoles.length > 0 && !this.selectedRoleSignal()) {
      const defaultRole =
        this.userRoles.find((role) => role.roleCode === 'DEFAULT') ||
        this.userRoles[0];
      this.onRoleChanged(defaultRole);
    }

    // Initialize with current business unit if available
    if (this.businessUnits.length > 0 && this.currentBusinessUnit) {
      const currentBU = this.businessUnits.find(
        (bu) => bu.businessUnitCode === this.currentBusinessUnit
      );
      if (currentBU) {
        this.onBusinessUnitChanged(currentBU);
      }
    }
  }

  // Event handlers
  onTaskSelected(task: MenuTask): void {
    console.log('Task selected:', task);
    this.taskSelected.emit(task);
  }

  onRoleChanged(role: UserRole): void {
    this.selectedRoleSignal.set(role);
    this.menuBarService.setSelectedRole(role);
    this.roleChanged.emit(role);
  }

  onBusinessUnitChanged(businessUnit: BusinessUnit): void {
    this.selectedBusinessUnitSignal.set(businessUnit);
    this.menuBarService.setSelectedBusinessUnit(businessUnit);
    this.businessUnitChanged.emit(businessUnit);
  }

  onSearchChanged(searchTerm: string): void {
    this.searchTermSignal.set(searchTerm);
    this.searchPerformed.emit(searchTerm);
  }

  onMenuToggle(): void {
    const newState = !this.isCollapsedSignal();
    this.isCollapsedSignal.set(newState);
    this.menuBarService.toggleCollapse();
    this.menuToggled.emit(newState);
  }

  // Menu group operations
  toggleGroup(menuCode: string): void {
    if (this.expandedGroups.has(menuCode)) {
      this.expandedGroups.delete(menuCode);
    } else {
      this.expandedGroups.add(menuCode);
    }
  }

  isGroupExpanded(menuCode: string): boolean {
    return this.expandedGroups.has(menuCode);
  }

  expandAllGroups(): void {
    this.menuGroups.forEach((group) => {
      this.expandedGroups.add(group.menuCode);
    });
  }

  collapseAllGroups(): void {
    this.expandedGroups.clear();
  }

  // View toggles
  toggleGraphicalView(): void {
    this.isGraphicalViewSignal.update((current) => !current);
  }

  toggleTaskCodes(): void {
    this.showTaskCodes = !this.showTaskCodes;
  }

  // Search operations
  clearSearch(): void {
    this.searchTerm = '';
    this.searchTermSignal.set('');
  }

  // Utility methods
  getTaskIcon(task: MenuTask): string {
    if (task.icon.startsWith('fa-')) {
      return `fa ${task.icon}`;
    }
    return task.icon || 'fa fa-file-o';
  }

  getGroupIcon(group: MenuGroup): string {
    if (group.icon.startsWith('fa-')) {
      return `fa ${group.icon}`;
    }
    return group.icon || 'fa fa-folder';
  }

  trackByMenuGroup(index: number, group: MenuGroup): string {
    return group.menuCode;
  }

  trackByTask(index: number, task: MenuTask): string {
    return task.taskCode;
  }
}
