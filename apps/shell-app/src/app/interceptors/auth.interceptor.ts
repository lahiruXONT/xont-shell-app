import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { from } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { AuthTokenService } from '../services/auth-token.service';
let isRefreshing = false;
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const tokenService = inject(AuthTokenService);
  const router = inject(Router);
  if (req.url.includes('/auth/login')) {
    return next(req);
  }
  // Get current token
  const token = tokenService.getToken();
  // Clone request with auth header
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Only try to refresh if not already refreshing
        if (!isRefreshing && !req.url.includes('/auth/refresh')) {
          isRefreshing = true;
          return from(authService.refreshAuthToken()).pipe(
            switchMap((success) => {
              isRefreshing = false;
              if (success) {
                // Retry original request with new token
                const newToken = tokenService.getToken();
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                });
                return next(retryReq);
              } else {
                // Refresh failed, logout user
                authService.logout();
                router.navigate(['/session-expired']);
                return throwError(() => error);
              }
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authService.logout();
              router.navigate(['/session-expired']);
              return throwError(() => refreshError);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
