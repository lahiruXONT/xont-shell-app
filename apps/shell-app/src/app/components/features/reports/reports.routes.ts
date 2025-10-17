import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'sales',
    pathMatch: 'full',
  },
  // ,
  // {
  //   path: 'sales',
  //   loadComponent: () =>
  //     import('./sales-reports.component').then((m) => m.SalesReportsComponent),
  // },
  // {
  //   path: 'activity',
  //   loadComponent: () =>
  //     import('./activity-reports.component').then(
  //       (m) => m.ActivityReportsComponent
  //     ),
  // },
  // {
  //   path: 'custom',
  //   loadComponent: () =>
  //     import('./custom-reports.component').then(
  //       (m) => m.CustomReportsComponent
  //     ),
  // },
];
