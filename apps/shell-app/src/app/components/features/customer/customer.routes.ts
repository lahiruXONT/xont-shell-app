import { Routes } from '@angular/router';

export const customerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  //,
  // {
  //   path: 'list',
  //   loadComponent: () =>
  //     import('./customer-list.component').then((m) => m.CustomerListComponent),
  // },
  // {
  //   path: 'new',
  //   loadComponent: () =>
  //     import('./customer-new.component').then((m) => m.CustomerNewComponent),
  // },
  // ,
  // {
  //   path: 'search',
  //   loadComponent: () =>
  //     import('./customer-search.component').then(
  //       (m) => m.CustomerSearchComponent
  //     ),
  // },
  // {
  //   path: ':id',
  //   loadComponent: () =>
  //     import('./customer-detail.component').then(
  //       (m) => m.CustomerDetailComponent
  //     ),
  // },
];
