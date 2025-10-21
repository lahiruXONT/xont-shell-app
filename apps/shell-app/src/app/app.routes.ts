import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./components/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      // {
      //   path: '',
      //   redirectTo: 'dashboard',
      //   pathMatch: 'full',
      // },
      // {
      //   path: 'dashboard',
      //   loadComponent: () =>
      //     import('./components/dashboard/dashboard.component').then(
      //       (m) => m.DashboardComponent
      //     ),
      // },
    ],
  },

  // {
  //   path: 'error',
  //   loadComponent: () =>
  //     import('./components/error/error.component').then(
  //       (m) => m.ErrorComponent
  //     ),
  // },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/error',
  },
];
