import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { GlobalStateService } from '../services/global-state.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const globalState = inject(GlobalStateService);

  // Show loading indicator
  globalState.setLoading(true);

  return next(req).pipe(
    finalize(() => {
      // Hide loading indicator
      globalState.setLoading(false);
    })
  );
};
