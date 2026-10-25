import { Routes } from '@angular/router';

/** Lazy-loaded admin area (/admin/**), protected by adminGuard in app.routes.ts. */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    title: 'Admin Dashboard · Smart Campus',
    loadComponent: () => import('./admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
  },
  {
    path: 'requests',
    title: 'All Requests · Smart Campus',
    loadComponent: () => import('./all-requests/all-requests').then((m) => m.AllRequestsPage),
  },
];
