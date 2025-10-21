import { InjectionToken } from '@angular/core';

/**
 * Injection token for API base URL
 * Allows consuming apps to configure the backend API URL
 */
export const MENU_BAR_API_URL = new InjectionToken<string>('menu.bar.api.url', {
  providedIn: 'root',
  factory: () => '', // Default value
});
