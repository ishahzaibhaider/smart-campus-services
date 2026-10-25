import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Only authenticated users; otherwise redirect to /login and remember where they were going. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Only students (admins are sent to their own dashboard). */
export const studentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isStudent() ? true : inject(Router).parseUrl(auth.homeUrl());
};

/** Login / register pages are only for visitors who are not signed in. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).parseUrl(auth.homeUrl()) : true;
};
