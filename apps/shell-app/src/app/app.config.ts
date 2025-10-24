import {
  ApplicationConfig,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
  PreloadAllModules,
  RouteReuseStrategy,
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
import { CustomRouteReuseStrategy } from './strategies/custom-route-reuse-strategy';

const apiUrlTokens = [TOP_NAV_API_URL, MENU_BAR_API_URL, TAB_MGMT_API_URL];
const apiUrlProviders = apiUrlTokens.map((token) => ({
  provide: token,
  useFactory: () => inject(RuntimeConfigService).baseUrl,
}));

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withPreloading(PreloadAllModules)
    ),
    {
      provide: RouteReuseStrategy,
      useClass: CustomRouteReuseStrategy,
    },
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
      withFetch()
    ),
    provideAnimations(),
    provideAppInitializer(() => {
      const configService = inject(RuntimeConfigService);
      return configService.initialize();
    }),
    ...apiUrlProviders,
  ],
};
