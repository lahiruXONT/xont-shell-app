/**
 * Favorite/Bookmark model
 * Legacy: User favorites/bookmarks system
 */
export interface Favorite {
  bookmarkId: string; // Unique bookmark ID
  userName: string;
  businessUnit: string;
  taskCode: string; // Task code
  bookmarkName: string; // Custom bookmark name
  path: string; // ExecutionScript path
  icon: string;
  description: string;
  menuCode: string; // Parent menu
  createdAt: Date;
  order: number; // Display order
}

/**
 * Favorites configuration
 */
export interface FavoritesConfig {
  maxFavorites: number; // Default: 10 (from legacy)
  allowDuplicates: boolean;
  showInSidebar: boolean;
  enableReorder: boolean;
}

/**
 * Favorites panel state
 */
export interface FavoritesPanelState {
  favorites: Favorite[];
  isOpen: boolean;
  isEditing: boolean;
  selectedFavorite: Favorite | null;
}
