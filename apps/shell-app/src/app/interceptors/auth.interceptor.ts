import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const token = authService.getToken();

  if (token && !req.url.includes('/auth/')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
