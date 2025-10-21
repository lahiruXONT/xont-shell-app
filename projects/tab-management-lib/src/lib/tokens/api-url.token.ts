import { InjectionToken } from '@angular/core';

/**
 * Injection token for API base URL
 */
export const TAB_MGMT_API_URL = new InjectionToken<string>('tab.mgmt.api.url', {
  providedIn: 'root',
  factory: () => '', // Default value
});
