import { InjectionToken } from '@angular/core';

export const TOP_NAV_API_URL = new InjectionToken<string>('top.nav.api.url', {
  providedIn: 'root',
  factory: () => '',
});
