import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Favorite,
  FavoritesConfig,
  FavoritesPanelState,
} from '../models/favorite.model';
import { Inject, Optional } from '@angular/core';
import { MENU_BAR_API_URL as API_URL } from '../tokens/api-url.token';

/**
 * Favorites Service
 * Manages user bookmarks/favorites
 * Legacy: Bookmark management from Main.aspx
 */
@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly DEFAULT_CONFIG: FavoritesConfig = {
    maxFavorites: 10,
    allowDuplicates: false,
    showInSidebar: true,
    enableReorder: true,
  };

  // State signals
  private favoritesSignal = signal<Favorite[]>([]);
  private panelStateSignal = signal<FavoritesPanelState>({
    favorites: [],
    isOpen: false,
    isEditing: false,
    selectedFavorite: null,
  });
  private configSignal = signal<FavoritesConfig>(this.DEFAULT_CONFIG);

  // Public readonly signals
  readonly favorites = this.favoritesSignal.asReadonly();
  readonly panelState = this.panelStateSignal.asReadonly();
  readonly config = this.configSignal.asReadonly();

  // Computed values
  readonly favoriteCount = computed(() => this.favoritesSignal().length);
  readonly canAddMore = computed(
    () => this.favoriteCount() < this.configSignal().maxFavorites
  );

  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiBaseUrl: string
  ) {}

  /**
   * Load user favorites
   * Legacy: Load bookmarks from database
   */
  async loadFavorites(userName: string, businessUnit: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<Favorite[]>(`${this.apiBaseUrl}/api/favorites`, {
          params: { userName, businessUnit },
        })
      );

      this.favoritesSignal.set(response);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  /**
   * Add favorite
   * Legacy: SaveBookmark method
   */
  async addFavorite(
    favorite: Omit<Favorite, 'bookmarkId' | 'createdAt' | 'order'>
  ): Promise<void> {
    if (!this.canAddMore()) {
      throw new Error(
        `Maximum ${this.configSignal().maxFavorites} favorites reached`
      );
    }

    // Check for duplicates
    if (!this.configSignal().allowDuplicates) {
      const exists = this.favoritesSignal().some(
        (f) => f.taskCode === favorite.taskCode
      );
      if (exists) {
        throw new Error('This task is already bookmarked');
      }
    }

    try {
      const response = await firstValueFrom(
        this.http.post<Favorite>(`${this.apiBaseUrl}/api/favorites`, favorite)
      );

      const updated = [...this.favoritesSignal(), response];
      this.favoritesSignal.set(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  }

  /**
   * Remove favorite
   * Legacy: DeleteBookmark method
   */
  async removeFavorite(bookmarkId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiBaseUrl}/api/favorites/${bookmarkId}`)
      );

      const updated = this.favoritesSignal().filter(
        (f) => f.bookmarkId !== bookmarkId
      );
      this.favoritesSignal.set(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  }

  /**
   * Update favorite name
   */
  async updateFavorite(
    bookmarkId: string,
    updates: Partial<Favorite>
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.put<Favorite>(
          `${this.apiBaseUrl}/api/favorites/${bookmarkId}`,
          updates
        )
      );

      const updated = this.favoritesSignal().map((f) =>
        f.bookmarkId === bookmarkId ? response : f
      );

      this.favoritesSignal.set(updated);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to update favorite:', error);
      throw error;
    }
  }

  /**
   * Reorder favorites
   */
  async reorderFavorites(fromIndex: number, toIndex: number): Promise<void> {
    const favorites = [...this.favoritesSignal()];
    const [moved] = favorites.splice(fromIndex, 1);
    favorites.splice(toIndex, 0, moved);

    // Update order property
    const reordered = favorites.map((f, index) => ({ ...f, order: index }));

    this.favoritesSignal.set(reordered);

    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/api/favorites/reorder`, {
          favorites: reordered,
        })
      );
    } catch (error) {
      console.error('Failed to reorder favorites:', error);
    }
  }

  /**
   * Check if task is favorited
   */
  isFavorite(taskCode: string): boolean {
    return this.favoritesSignal().some((f) => f.taskCode === taskCode);
  }

  /**
   * Toggle favorites panel
   */
  togglePanel(): void {
    this.panelStateSignal.update((state) => ({
      ...state,
      isOpen: !state.isOpen,
    }));
  }

  /**
   * Open favorites panel
   */
  openPanel(): void {
    this.panelStateSignal.update((state) => ({ ...state, isOpen: true }));
  }

  /**
   * Close favorites panel
   */
  closePanel(): void {
    this.panelStateSignal.update((state) => ({
      ...state,
      isOpen: false,
      isEditing: false,
      selectedFavorite: null,
    }));
  }

  /**
   * Select favorite for editing
   */
  selectFavorite(favorite: Favorite): void {
    this.panelStateSignal.update((state) => ({
      ...state,
      selectedFavorite: favorite,
      isEditing: true,
    }));
  }

  /**
   * Update panel state
   */
  private updatePanelState(): void {
    this.panelStateSignal.update((state) => ({
      ...state,
      favorites: this.favoritesSignal(),
    }));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FavoritesConfig>): void {
    this.configSignal.update((current) => ({ ...current, ...config }));
  }
}
