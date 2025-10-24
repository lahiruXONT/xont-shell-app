import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';
export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
    data: { title: 'Login' },
  },
  {
    path: 'session-expired',
    loadComponent: () =>
      import('./components/session-expired/session-expired.component').then(
        (m) => m.SessionExpiredComponent
      ),
    data: { title: 'Session Expired' },
  },
  // {
  //   path: 'unauthorized',
  //   loadComponent: () =>
  //     import('./components/unauthorized/unauthorized.component').then(
  //       (m) => m.UnauthorizedComponent
  //     ),
  //   data: { title: 'Unauthorized Access' },
  // },
  // {
  //   path: 'error',
  //   loadComponent: () =>
  //     import('./components/error/error.component').then(
  //       (m) => m.ErrorComponent
  //     ),
  //   data: { title: 'Error' },
  // },
  // Protected routes
  {
    path: 'app',
    loadComponent: () =>
      import('./components/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      // {
      //   path: 'dashboard',
      //   loadComponent: () =>
      //     import('./components/dashboard/dashboard.component').then(
      //       (m) => m.DashboardComponent
      //     ),
      //   data: {
      //     title: 'Dashboard',
      //     breadcrumb: 'Dashboard',
      //   },
      // },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./components/change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent
          ),
        data: {
          title: 'Change Password',
          breadcrumb: 'Change Password',
        },
      },
      // {
      //   path: 'profile',
      //   loadComponent: () =>
      //     import('./components/profile/profile.component').then(
      //       (m) => m.ProfileComponent
      //     ),
      //   data: {
      //     title: 'My Profile',
      //     breadcrumb: 'Profile',
      //   },
      // },
      // {
      //   path: 'task/:taskCode',
      //   loadComponent: () =>
      //     import('./components/task-container/task-container.component').then(
      //       (m) => m.TaskContainerComponent
      //     ),
      //   canActivate: [permissionGuard],
      //   data: {
      //     reusable: true,
      //   },
      // },
    ],
  },
  // Default routes
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
