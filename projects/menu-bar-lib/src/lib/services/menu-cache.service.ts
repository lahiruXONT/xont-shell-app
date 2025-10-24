import { Injectable } from '@angular/core';
import { MenuHierarchy } from 'shared-lib';

/**
 * Menu Cache Service
 * Caches menu hierarchies to improve performance
 * Legacy: Menu caching functionality
 */
@Injectable({
  providedIn: 'root',
})
export class MenuCacheService {
  private cache = new Map<string, CachedMenu>();
  private readonly defaultDuration = 30; // minutes

  /**
   * Get cached menu
   */
  get(key: string): MenuHierarchy | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.menu;
  }

  /**
   * Set cache
   */
  set(key: string, menu: MenuHierarchy, duration?: number): void {
    const expiresAt =
      Date.now() + (duration || this.defaultDuration) * 60 * 1000;
    this.cache.set(key, {
      menu,
      expiresAt,
      cachedAt: Date.now(),
    });
  }

  /**
   * Clear specific cache
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key
   */
  generateKey(
    userName: string,
    roleCode: string,
    businessUnit: string
  ): string {
    return `${userName}:${roleCode}:${businessUnit}`;
  }
}

interface CachedMenu {
  menu: MenuHierarchy;
  expiresAt: number;
  cachedAt: number;
}
