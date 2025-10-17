import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthenticationService } from '../services/authentication.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const currentUser = authService.currentUser();

  if (currentUser?.token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${currentUser.token}`,
        'X-User-ID': currentUser.userId,
        'X-Business-Unit': currentUser.businessUnit || '',
      },
    });
    return next(authReq);
  }

  return next(req);
};
