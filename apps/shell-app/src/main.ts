import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './app/environments/environment';

// Provide a runtime global fallback for libraries that still rely on a
// window-level value. This is safe and idempotent: the DI-provided tokens
// are still the primary source. Keep this so getApiBase() returns a valid
// backend URL even if a library's InjectionToken wasn't wired yet.
if (typeof window !== 'undefined') {
  (window as any).__XONT_API_URL__ = environment.apiUrl;
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
