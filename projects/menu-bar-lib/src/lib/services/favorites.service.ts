import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Favorite, FavoritesConfig, FavoritesPanelState } from 'shared-lib';
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
   */
  async loadFavorites(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<Favorite[]>(`${this.apiBaseUrl}/api/favorites`)
      );

      this.favoritesSignal.set(response);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  /**
   * Add favorite
   */
  async addFavorite(
    favorite: Omit<Favorite, 'bookmarkId' | 'createdAt' | 'order'>
  ): Promise<void> {
    try {
      // Check if can add more
      if (!this.canAddMore()) {
        throw new Error('Maximum favorites limit reached');
      }

      // Check for duplicates
      if (!this.configSignal().allowDuplicates) {
        const exists = this.favoritesSignal().some(
          (f) => f.taskCode === favorite.taskCode
        );
        if (exists) {
          throw new Error('This task is already in favorites');
        }
      }

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
   * Update favorite
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
  async reorderFavorites(favoriteIds: string[]): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/api/favorites/reorder`, favoriteIds)
      );

      // Update local order
      const reordered = favoriteIds
        .map((id) => this.favoritesSignal().find((f) => f.bookmarkId === id))
        .filter((f): f is Favorite => f !== undefined);

      this.favoritesSignal.set(reordered);
      this.updatePanelState();
    } catch (error) {
      console.error('Failed to reorder favorites:', error);
      throw error;
    }
  }

  /**
   * Check if task is favorite
   */
  isFavorite(taskCode: string): boolean {
    return this.favoritesSignal().some((f) => f.taskCode === taskCode);
  }

  /**
   * Open favorites panel
   */
  openPanel(): void {
    this.panelStateSignal.update((state) => ({
      ...state,
      isOpen: true,
    }));
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
