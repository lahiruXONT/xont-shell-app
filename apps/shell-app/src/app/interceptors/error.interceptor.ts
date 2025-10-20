import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthenticationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - logout
        authService.logout();
      } else if (error.status === 403) {
        // Forbidden
        router.navigate(['/error'], {
          queryParams: {
            message: 'You do not have permission to access this resource',
          },
        });
      } else if (error.status === 500) {
        // Server error
        console.error('Server error:', error);
      }

      return throwError(() => error);
    })
  );
};
