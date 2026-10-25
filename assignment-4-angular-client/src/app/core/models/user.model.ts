export type UserRole = 'student' | 'admin';

/** User as returned inside the auth payloads (`id`). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** User document as returned by GET /api/users (`_id`). */
export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  role?: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
