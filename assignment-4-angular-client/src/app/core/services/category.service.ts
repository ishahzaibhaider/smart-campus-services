import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, DataResponse } from '../models';
import { handleApiError } from '../utils/api-error';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  /** Categories rarely change, so the first response is cached and replayed to every subscriber. */
  private readonly categories$ = this.http
    .get<DataResponse<Category[]>>(`${environment.apiUrl}/categories`)
    .pipe(
      map((res) => [...res.data].sort((a, b) => a.name.localeCompare(b.name))),
      catchError(handleApiError),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  getAll(): Observable<Category[]> {
    return this.categories$;
  }
}
