import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  MenuGroup,
  MenuTask,
  MenuHierarchy,
  MenuViewMode,
  MenuConfig,
  MenuSearchResult,
  SystemTask,
} from '../models/menu.model';
import { UserRole } from '../models/user-role.model';

/**
 * Menu Bar Service
 * Manages hierarchical menu structure, role switching, search
 * Legacy: Menu loading and management from Main.aspx
 */
@Injectable({
  providedIn: 'root',
})
export class MenuBarService {
  // Default configuration
  private readonly DEFAULT_CONFIG: MenuConfig = {
    showTaskCodes: false,
    viewMode: MenuViewMode.LIST,
    enableSearch: true,
    enableFavorites: true,
    expandAll: false,
    cacheMenus: true,
    cacheDuration: 30, // minutes
  };

  // Menu state using signals
  private menuHierarchySignal = signal<MenuHierarchy | null>(null);
  private currentRoleSignal = signal<UserRole | null>(null);
  private priorityRoleSignal = signal<UserRole | null>(null);
  private configSignal = signal<MenuConfig>(this.DEFAULT_CONFIG);
  private searchQuerySignal = signal<string>('');
  private isCollapsedSignal = signal<boolean>(false);
  private systemTasksSignal = signal<SystemTask[]>([]);

  // Public readonly signals
  readonly menuHierarchy = this.menuHierarchySignal.asReadonly();
  readonly currentRole = this.currentRoleSignal.asReadonly();
  readonly priorityRole = this.priorityRoleSignal.asReadonly();
  readonly config = this.configSignal.asReadonly();
  readonly searchQuery = this.searchQuerySignal.asReadonly();
  readonly isCollapsed = this.isCollapsedSignal.asReadonly();
  readonly systemTasks = this.systemTasksSignal.asReadonly();

  // Computed values
  readonly menuGroups = computed(
    () => this.menuHierarchySignal()?.menuGroups || []
  );

  readonly visibleMenuGroups = computed(() => {
    return this.menuGroups().filter((group) => group.isVisible);
  });

  readonly allTasks = computed(() => {
    const groups = this.menuGroups();
    return groups.flatMap((group) => group.tasks);
  });

  readonly favoriteTaskCodes = computed(() => {
    return this.allTasks()
      .filter((task) => task.isFavorite)
      .map((task) => task.taskCode);
  });

  readonly searchResults = computed(() => {
    const query = this.searchQuerySignal();
    if (!query || query.length < 2) {
      return [];
    }

    const results: MenuSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    this.menuGroups().forEach((group) => {
      group.tasks.forEach((task) => {
        const titleMatch = task.caption.toLowerCase().includes(lowerQuery);
        const codeMatch = task.taskCode.toLowerCase().includes(lowerQuery);
        const descMatch = task.description.toLowerCase().includes(lowerQuery);

        if (titleMatch || codeMatch || descMatch) {
          results.push({
            taskCode: task.taskCode,
            menuCode: task.menuCode,
            caption: task.caption,
            description: task.description,
            path: `${group.description} > ${task.caption}`,
            matchedText: titleMatch
              ? task.caption
              : codeMatch
              ? task.taskCode
              : task.description,
          });
        }
      });
    });

    return results;
  });

  constructor(private http: HttpClient) {}

  /**
   * Load menu for specific role
   * Legacy: GetUserMenu method in UserManager
   */
  async loadMenuForRole(
    userName: string,
    roleCode: string,
    businessUnit: string
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<MenuHierarchy>(
          `/api/menu/user/${userName}/role/${roleCode}`,
          { params: { businessUnit } }
        )
      );

      this.menuHierarchySignal.set(response);
      this.currentRoleSignal.set({
        roleCode: response.roleCode,
        description: response.roleName,
        isPriorityRole: response.isPriorityRole,
        isDefaultRole: response.isDefaultRole,
      } as UserRole);

      // Check for priority role
      if (response.isPriorityRole) {
        this.priorityRoleSignal.set(this.currentRoleSignal());
      }

      // Load system tasks
      await this.loadSystemTasks(userName, businessUnit);
    } catch (error) {
      console.error('Failed to load menu:', error);
      throw error;
    }
  }

  /**
   * Switch to different role
   * Legacy: Role switching functionality
   */
  async switchRole(
    userName: string,
    roleCode: string,
    businessUnit: string
  ): Promise<void> {
    await this.loadMenuForRole(userName, roleCode, businessUnit);
  }

  /**
   * Load system tasks (AUTOMENU, AUTODAILY)
   * Legacy: LoadSystemTask method
   */
  private async loadSystemTasks(
    userName: string,
    businessUnit: string
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<SystemTask[]>('/api/menu/system-tasks', {
          params: { userName, businessUnit },
        })
      );

      this.systemTasksSignal.set(response);
    } catch (error) {
      console.error('Failed to load system tasks:', error);
    }
  }

  /**
   * Toggle menu group expansion
   */
  toggleMenuGroup(menuCode: string): void {
    const hierarchy = this.menuHierarchySignal();
    if (!hierarchy) return;

    const updatedGroups = hierarchy.menuGroups.map((group) =>
      group.menuCode === menuCode
        ? { ...group, isExpanded: !group.isExpanded }
        : group
    );

    this.menuHierarchySignal.set({
      ...hierarchy,
      menuGroups: updatedGroups,
    });
  }

  /**
   * Expand all menu groups
   */
  expandAll(): void {
    const hierarchy = this.menuHierarchySignal();
    if (!hierarchy) return;

    const updatedGroups = hierarchy.menuGroups.map((group) => ({
      ...group,
      isExpanded: true,
    }));

    this.menuHierarchySignal.set({
      ...hierarchy,
      menuGroups: updatedGroups,
    });

    this.configSignal.update((config) => ({ ...config, expandAll: true }));
  }

  /**
   * Collapse all menu groups
   */
  collapseAll(): void {
    const hierarchy = this.menuHierarchySignal();
    if (!hierarchy) return;

    const updatedGroups = hierarchy.menuGroups.map((group) => ({
      ...group,
      isExpanded: false,
    }));

    this.menuHierarchySignal.set({
      ...hierarchy,
      menuGroups: updatedGroups,
    });

    this.configSignal.update((config) => ({ ...config, expandAll: false }));
  }

  /**
   * Toggle sidebar collapse
   */
  toggleSidebar(): void {
    this.isCollapsedSignal.update((collapsed) => !collapsed);
  }

  /**
   * Toggle task code display
   */
  toggleTaskCodes(): void {
    this.configSignal.update((config) => ({
      ...config,
      showTaskCodes: !config.showTaskCodes,
    }));
  }

  /**
   * Switch view mode (list/graphical)
   * Legacy: Graphical view toggle (V2002)
   */
  switchViewMode(mode: MenuViewMode): void {
    this.configSignal.update((config) => ({ ...config, viewMode: mode }));
  }

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this.searchQuerySignal.set(query);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchQuerySignal.set('');
  }

  /**
   * Find task by code
   */
  findTaskByCode(taskCode: string): MenuTask | undefined {
    return this.allTasks().find((task) => task.taskCode === taskCode);
  }

  /**
   * Find menu group by code
   */
  findMenuGroupByCode(menuCode: string): MenuGroup | undefined {
    return this.menuGroups().find((group) => group.menuCode === menuCode);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MenuConfig>): void {
    this.configSignal.update((current) => ({ ...current, ...config }));
  }

  /**
   * Check if AUTOMENU tasks should be loaded
   * Legacy: Check for AUTOMENU system tasks
   */
  shouldAutoLoadTasks(): SystemTask[] {
    return this.systemTasksSignal().filter(
      (task) => task.shouldAutoLoad && task.type === 'AUTOMENU'
    );
  }

  /**
   * Check if AUTODAILY tasks should be loaded
   * Legacy: Check for AUTODAILY menu
   */
  async checkDailyMenu(
    userName: string,
    businessUnit: string
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ available: boolean }>('/api/menu/check-daily-menu', {
          params: { userName, businessUnit },
        })
      );

      return response.available;
    } catch (error) {
      console.error('Failed to check daily menu:', error);
      return false;
    }
  }

  /**
   * Update daily menu last execution
   * Legacy: UpdateDailyMenu method
   */
  async updateDailyMenu(menuCode: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post('/api/menu/update-daily-menu', { menuCode })
      );
    } catch (error) {
      console.error('Failed to update daily menu:', error);
    }
  }
}
