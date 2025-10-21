import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { environment } from './environments/environment';
import { API_URL as TOP_NAV_API_URL } from '../../../../projects/top-nav-lib/src/public-api';
import { API_URL as MENU_BAR_API_URL } from '../../../../projects/menu-bar-lib/src/public-api';
import { API_URL as TAB_API_URL } from '../../../../projects/tab-management-lib/src/public-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
      withFetch()
    ),
    provideAnimations(),
    // Provide library API URL tokens from app environment
    { provide: TOP_NAV_API_URL, useValue: environment.apiUrl },
    { provide: MENU_BAR_API_URL, useValue: environment.apiUrl },
    { provide: TAB_API_URL, useValue: environment.apiUrl },
  ],
};
