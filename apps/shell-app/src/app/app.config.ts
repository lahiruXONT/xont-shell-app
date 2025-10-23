import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
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

// Import library API URL tokens
import { TOP_NAV_API_URL } from 'top-nav-lib';
import { MENU_BAR_API_URL } from 'menu-bar-lib';
import { TAB_MGMT_API_URL } from 'tab-management-lib';
import { RuntimeConfigService } from './services/runtime-config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
      withFetch()
    ),
    provideAnimations(),

    {
      provide: TOP_NAV_API_URL,
      useFactory: (config: RuntimeConfigService) => config.baseUrl,
      deps: [RuntimeConfigService],
    },
    {
      provide: MENU_BAR_API_URL,
      useFactory: (config: RuntimeConfigService) => config.baseUrl,
      deps: [RuntimeConfigService],
    },
    {
      provide: TAB_MGMT_API_URL,
      useFactory: (config: RuntimeConfigService) => config.baseUrl,
      deps: [RuntimeConfigService],
    },
  ],
};
