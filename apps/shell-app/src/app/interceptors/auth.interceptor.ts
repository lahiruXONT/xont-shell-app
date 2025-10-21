import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const token = authService.getToken();

  const isAuthEndpoint = req.url.includes('/auth/login');

  if (token && !isAuthEndpoint) {
    console.log('[AUTH INTERCEPTOR] Adding Authorization header');
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else if (!token && !isAuthEndpoint) {
    console.warn('[AUTH INTERCEPTOR] No token available for request:', req.url);
  }

  return next(req);
};
