import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiErrorBody } from '../models';

/** Normalised error thrown by every service so components only deal with one shape. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as ApiErrorBody).error?.message === 'string'
  );
}

/** Converts anything thrown by HttpClient into an ApiError using the API error envelope. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) {
    return err;
  }
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return new ApiError(
        'Cannot reach the Smart Campus API. Make sure the Assignment 3 server is running on port 4000.',
        0,
        'NETWORK_ERROR',
      );
    }
    if (isApiErrorBody(err.error)) {
      const { message, status, code, details } = err.error.error;
      // 422 responses carry a list of field messages, e.g. ["title is required"].
      const extra = Array.isArray(details) && details.length ? `: ${details.join('; ')}` : '';
      return new ApiError(`${message}${extra}`, status ?? err.status, code);
    }
    return new ApiError(err.statusText || `Request failed with status ${err.status}`, err.status);
  }
  return new ApiError(err instanceof Error ? err.message : 'Something went wrong.', -1);
}

/** For use with `catchError(handleApiError)` inside service pipelines. */
export function handleApiError(err: unknown): Observable<never> {
  return throwError(() => toApiError(err));
}
