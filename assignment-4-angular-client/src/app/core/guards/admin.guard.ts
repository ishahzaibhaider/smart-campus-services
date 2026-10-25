import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

function checkAdmin() {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.isAdmin()) {
    inject(ToastService).error('That area is restricted to service administrators.');
    return router.createUrlTree(['/dashboard']);
  }
  return true;
}

/** Protects the admin area; used as canMatch so the lazy admin bundle is never downloaded by students. */
export const adminGuard: CanActivateFn & CanMatchFn = () => checkAdmin();
