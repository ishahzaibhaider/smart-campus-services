import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminUpdatePayload,
  CreateRequestPayload,
  DataResponse,
  PaginatedResponse,
  RequestQuery,
  RequestStatus,
  ServiceRequest,
  StudentUpdatePayload,
} from '../models';
import { handleApiError } from '../utils/api-error';

/** Wraps every /api/requests endpoint. All methods return cold Observables. */
@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/requests`;

  list(query: RequestQuery = {}): Observable<PaginatedResponse<ServiceRequest>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        params = params.set(key, `${value}`.trim());
      }
    }
    return this.http.get<PaginatedResponse<ServiceRequest>>(this.baseUrl, { params }).pipe(catchError(handleApiError));
  }

  /** `id` may be the Mongo _id or the human readable requestId (e.g. REQ-101). */
  get(id: string): Observable<ServiceRequest> {
    return this.http.get<DataResponse<ServiceRequest>>(`${this.baseUrl}/${encodeURIComponent(id)}`).pipe(
      map((res) => res.data),
      catchError(handleApiError),
    );
  }

  create(payload: CreateRequestPayload): Observable<ServiceRequest> {
    return this.http.post<DataResponse<ServiceRequest>>(this.baseUrl, payload).pipe(
      map((res) => res.data),
      catchError(handleApiError),
    );
  }

  update(id: string, payload: StudentUpdatePayload | AdminUpdatePayload): Observable<ServiceRequest> {
    return this.http.put<DataResponse<ServiceRequest>>(`${this.baseUrl}/${encodeURIComponent(id)}`, payload).pipe(
      map((res) => res.data),
      catchError(handleApiError),
    );
  }

  /** Admin: advance the workflow. An invalid jump returns 409 INVALID_TRANSITION. */
  updateStatus(id: string, status: RequestStatus, note?: string): Observable<ServiceRequest> {
    const body = note?.trim() ? { status, note: note.trim() } : { status };
    return this.http
      .patch<DataResponse<ServiceRequest>>(`${this.baseUrl}/${encodeURIComponent(id)}/status`, body)
      .pipe(
        map((res) => res.data),
        catchError(handleApiError),
      );
  }

  /** Admin: assign to an administrator (Submitted requests move to Assigned automatically). */
  assign(id: string, assignedTo: string): Observable<ServiceRequest> {
    return this.http
      .patch<DataResponse<ServiceRequest>>(`${this.baseUrl}/${encodeURIComponent(id)}/assign`, { assignedTo })
      .pipe(
        map((res) => res.data),
        catchError(handleApiError),
      );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`).pipe(catchError(handleApiError));
  }
}
