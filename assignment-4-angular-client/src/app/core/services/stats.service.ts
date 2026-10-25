import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CampusStats, DataResponse } from '../models';
import { handleApiError } from '../utils/api-error';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);

  /** GET /api/stats (admin only). */
  getStats(): Observable<CampusStats> {
    return this.http.get<DataResponse<CampusStats>>(`${environment.apiUrl}/stats`).pipe(
      map((res) => res.data),
      catchError(handleApiError),
    );
  }
}
