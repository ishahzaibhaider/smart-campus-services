import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * 1. Attaches `Authorization: Bearer <jwt>` to every call made to our API.
 * 2. On 401 (missing / expired / invalid token) clears the session and sends the user to /login.
 *    Login and register calls are excluded so "wrong password" is shown on the form instead.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const token = auth.token();
  const isApiCall = req.url.startsWith(environment.apiUrl);
  const isAuthForm = /\/auth\/(login|register)$/.test(req.url);

  const authReq =
    token && isApiCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && isApiCall && !isAuthForm) {
        if (auth.isLoggedIn()) {
          toast.info('Your session has expired. Please sign in again.');
        }
        auth.logout({ reason: 'expired' });
      }
      return throwError(() => err);
    }),
  );
};
