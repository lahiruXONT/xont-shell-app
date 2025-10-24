import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);
  const taskCode = route.params['taskCode'];
  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }
  // Check if user has permission to access this task
  const hasPermission = user.permissions.includes(taskCode);
  if (!hasPermission) {
    router.navigate(['/unauthorized'], {
      queryParams: {
        message: 'You do not have permission to access this task',
        taskCode: taskCode,
      },
    });
    return false;
  }
  return true;
};
