import { InjectionToken } from '@angular/core';

/**
 * InjectionToken for providing the backend API base URL to library consumers.
 * The host application (shell-app) should provide this token with the proper
 * value from its environment (for example: environment.apiUrl).
 */
export const API_URL = new InjectionToken<string>('top-nav-lib-api-url');
