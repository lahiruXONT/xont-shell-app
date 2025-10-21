import { InjectionToken } from '@angular/core';

/**
 * Local API_URL token for menu-bar-lib. The shell app should provide this
 * value (use the same backend API URL as other libs).
 */
export const API_URL = new InjectionToken<string>('menu-bar-lib-api-url');
