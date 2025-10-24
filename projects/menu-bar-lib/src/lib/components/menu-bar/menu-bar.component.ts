import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Services
import { MenuBarService } from '../../services/menu-bar.service';
import { FavoritesService } from '../../services/favorites.service';

// Models
import {
  MenuTask,
  MenuGroup,
  MenuViewMode,
  MenuSearchResult,
} from 'shared-lib';

/**
 * Menu Bar Component
 * Complete sidebar with hierarchical menu, search, favorites
 * Legacy: Sidebar navigation from Main.aspx
 */
@Component({
  selector: 'lib-menu-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss',
})
export class MenuBarComponent implements OnInit {
  // Inputs
  @Input() userName!: string;
  @Input() businessUnit!: string;
  @Input() roleCode!: string;

  // Outputs
  @Output() taskSelected = new EventEmitter<MenuTask>();
  @Output() taskFavorited = new EventEmitter<{
    task: MenuTask;
    isFavorite: boolean;
  }>();

  // Get service state
  readonly menuGroups = computed(() => this.menuBarService.visibleMenuGroups());
  readonly searchQuery = computed(() => this.menuBarService.searchQuery());
  readonly searchResults = computed(() => this.menuBarService.searchResults());
  readonly config = computed(() => this.menuBarService.config());
  readonly isCollapsed = computed(() => this.menuBarService.isCollapsed());
  readonly currentRole = computed(() => this.menuBarService.currentRole());

  // Local state
  searchText = signal<string>('');
  showSearch = signal<boolean>(false);

  // Enums for template
  readonly MenuViewMode = MenuViewMode;

  constructor(
    public menuBarService: MenuBarService,
    public favoritesService: FavoritesService
  ) {}

  async ngOnInit(): Promise<void> {
    // Auto-load menu if all params provided
    if (this.userName && this.roleCode && this.businessUnit) {
      await this.loadMenu();
    }
  }

  /**
   * Load menu for current role
   */
  async loadMenu(): Promise<void> {
    try {
      await this.menuBarService.loadMenuForRole(this.roleCode);

      await this.favoritesService.loadFavorites();
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  }

  /**
   * Toggle menu group expansion
   */
  toggleGroup(menuCode: string): void {
    this.menuBarService.toggleMenuGroup(menuCode);
  }

  /**
   * Expand all groups
   */
  expandAll(): void {
    this.menuBarService.expandAll();
  }

  /**
   * Collapse all groups
   */
  collapseAll(): void {
    this.menuBarService.collapseAll();
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.menuBarService.toggleSidebar();
  }

  /**
   * Toggle task codes
   */
  toggleTaskCodes(): void {
    this.menuBarService.toggleTaskCodes();
  }

  /**
   * Switch view mode
   */
  switchViewMode(mode: MenuViewMode): void {
    this.menuBarService.switchViewMode(mode);
  }

  /**
   * Handle task click
   */
  onTaskClick(task: MenuTask): void {
    this.taskSelected.emit(task);
  }

  /**
   * Toggle task favorite
   */
  async toggleFavorite(task: MenuTask, event: Event): Promise<void> {
    event.stopPropagation();

    const isFavorite = this.favoritesService.isFavorite(task.taskCode);

    try {
      if (isFavorite) {
        const favorite = this.favoritesService
          .favorites()
          .find((f) => f.taskCode === task.taskCode);
        if (favorite) {
          await this.favoritesService.removeFavorite(favorite.bookmarkId);
        }
      } else {
        await this.favoritesService.addFavorite({
          userName: this.userName,
          businessUnit: this.businessUnit,
          taskCode: task.taskCode,
          bookmarkName: task.caption,
          path: task.url,
          icon: task.icon,
          description: task.description,
          menuCode: task.menuCode,
        });
      }

      this.taskFavorited.emit({ task, isFavorite: !isFavorite });
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      alert(error.message || 'Failed to update favorite');
    }
  }

  /**
   * Handle search
   */
  onSearch(): void {
    this.menuBarService.setSearchQuery(this.searchText());
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchText.set('');
    this.menuBarService.clearSearch();
  }

  /**
   * Toggle search box
   */
  toggleSearch(): void {
    this.showSearch.update((show) => !show);
    if (!this.showSearch()) {
      this.clearSearch();
    }
  }

  /**
   * Check if task is favorite
   */
  isFavorite(taskCode: string): boolean {
    return this.favoritesService.isFavorite(taskCode);
  }

  /**
   * Track by for menu groups
   */
  trackByMenuCode(index: number, group: MenuGroup): string {
    return group.menuCode;
  }

  /**
   * Track by for tasks
   */
  trackByTaskCode(index: number, task: MenuTask): string {
    return task.taskCode;
  }

  /**
   * Track by for search results
   */
  trackBySearchResult(index: number, result: MenuSearchResult): string {
    return result.taskCode;
  }
}
