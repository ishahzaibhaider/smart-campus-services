import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DataResponse, UserRole, UserSummary } from '../models';
import { handleApiError } from '../utils/api-error';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /** GET /api/users?role=admin (admin only) — used to pick an assignee. */
  getByRole(role: UserRole): Observable<UserSummary[]> {
    const params = new HttpParams().set('role', role);
    return this.http.get<DataResponse<UserSummary[]>>(`${environment.apiUrl}/users`, { params }).pipe(
      map((res) => res.data),
      catchError(handleApiError),
    );
  }

  getAdmins(): Observable<UserSummary[]> {
    return this.getByRole('admin');
  }
}
