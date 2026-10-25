import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginCredentials, RegisterPayload } from '../models';
import { handleApiError } from '../utils/api-error';

/**
 * Owns the JWT and the logged-in user. State is exposed as signals so the header,
 * guards and pages react immediately to login / logout.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly tokenSignal = signal<string | null>(readStorage(environment.tokenStorageKey));
  private readonly userSignal = signal<AuthUser | null>(readUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.tokenSignal() && !!this.userSignal());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'admin');
  readonly isStudent = computed(() => this.userSignal()?.role === 'student');

  login(credentials: LoginCredentials): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res) => this.setSession(res)),
      map((res) => res.user),
      catchError(handleApiError),
    );
  }

  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload).pipe(
      tap((res) => this.setSession(res)),
      map((res) => res.user),
      catchError(handleApiError),
    );
  }

  /**
   * Re-validates a stored token on start-up (GET /auth/me). A 401 is handled by the
   * interceptor (logout); any other failure keeps the cached user so the app still loads.
   */
  restoreSession(): Observable<AuthUser | null> {
    if (!this.tokenSignal()) {
      return of(null);
    }
    return this.http.get<{ user: AuthUser }>(`${this.baseUrl}/me`).pipe(
      map((res) => normaliseUser(res.user)),
      tap((user) => {
        this.userSignal.set(user);
        localStorage.setItem(environment.userStorageKey, JSON.stringify(user));
      }),
      catchError(() => of(this.userSignal())),
    );
  }

  /** Landing page for the current role. */
  homeUrl(): string {
    if (!this.isLoggedIn()) {
      return '/login';
    }
    return this.isAdmin() ? '/admin' : '/dashboard';
  }

  logout(options: { redirect?: boolean; reason?: 'expired' } = {}): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(environment.tokenStorageKey);
    localStorage.removeItem(environment.userStorageKey);
    if (options.redirect ?? true) {
      const queryParams = options.reason ? { reason: options.reason } : {};
      void this.router.navigate(['/login'], { queryParams });
    }
  }

  private setSession({ token, user }: AuthResponse): void {
    const normalised = normaliseUser(user);
    localStorage.setItem(environment.tokenStorageKey, token);
    localStorage.setItem(environment.userStorageKey, JSON.stringify(normalised));
    this.tokenSignal.set(token);
    this.userSignal.set(normalised);
  }
}

/** Accept both `id` and `_id` so the client is tolerant of either serialisation. */
function normaliseUser(user: AuthUser & { _id?: string }): AuthUser {
  return { id: user.id ?? user._id ?? '', name: user.name, email: user.email, role: user.role };
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readUser(): AuthUser | null {
  const raw = readStorage(environment.userStorageKey);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
