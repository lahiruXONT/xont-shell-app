import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error) => {
      let errorMessage = 'An unknown error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        if (error.status === 401) {
          errorMessage = 'Unauthorized access. Please log in.';
        } else if (error.status === 403) {
          errorMessage =
            'Access forbidden. You do not have permission to access this resource.';
        } else if (error.status === 404) {
          errorMessage = 'Resource not found.';
        } else if (error.status === 500) {
          errorMessage = 'Internal server error. Please try again later.';
        } else {
          errorMessage =
            error.error?.message ||
            `Error Code: ${error.status}\n${error.message}`;
        }
      }

      // Show error notification
      notificationService.addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });

      return throwError(() => new Error(errorMessage));
    })
  );
};
