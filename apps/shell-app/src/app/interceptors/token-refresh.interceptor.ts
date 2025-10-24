import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { AuthTokenService } from '../services/auth-token.service';

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const tokenService = inject(AuthTokenService);
  // Skip for auth endpoints
  if (req.url.includes('/auth/')) {
    return next(req);
  }
  // Check if token is expiring soon
  if (tokenService.isTokenExpiringSoon()) {
    // Proactively refresh token before request
    return from(authService.refreshAuthToken()).pipe(
      switchMap((success) => {
        if (success) {
          const newToken = tokenService.getToken();
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          return next(authReq);
        }
        return next(req);
      })
    );
  }
  return next(req);
};
