import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
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
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      // ,
      // {
      //   path: 'dashboard',
      //   loadComponent: () =>
      //     import('./components/dashboard/dashboard.component').then(
      //       (m) => m.DashboardComponent
      //     ),
      // },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
