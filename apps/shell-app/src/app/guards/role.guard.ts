import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as Array<string>;
  const currentUser = authService.currentUser();

  if (!requiredRoles || !currentUser) {
    return true;
  }

  const hasRole = requiredRoles.some((role) => currentUser.role === role);

  if (!hasRole) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
