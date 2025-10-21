import { InjectionToken } from '@angular/core';

/**
 * Injection token for API base URL
 * Allows consuming apps to configure the backend API URL
 */
export const TOP_NAV_API_URL = new InjectionToken<string>('TOP_NAV_API_URL', {
  providedIn: 'root',
  factory: () => '', // Default value
});
