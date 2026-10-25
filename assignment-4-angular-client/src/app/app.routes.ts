import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard, guestGuard, studentGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

/** Every page is lazy-loaded with loadComponent / loadChildren. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: () => inject(AuthService).homeUrl() },
  {
    path: 'login',
    title: 'Sign in · Smart Campus',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Create account · Smart Campus',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterPage),
  },
  {
    path: 'dashboard',
    title: 'My Requests · Smart Campus',
    canActivate: [authGuard, studentGuard],
    loadComponent: () =>
      import('./features/student/student-dashboard/student-dashboard').then((m) => m.StudentDashboard),
  },
  {
    path: 'requests/new',
    title: 'New Request · Smart Campus',
    canActivate: [authGuard, studentGuard],
    loadComponent: () => import('./features/student/new-request/new-request').then((m) => m.NewRequestPage),
  },
  {
    path: 'requests/:id',
    title: 'Request details · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/requests/request-details/request-details').then((m) => m.RequestDetailsPage),
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '**',
    title: 'Page not found · Smart Campus',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
