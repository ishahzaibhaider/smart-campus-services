/** Envelope used by the API for single resources and lists. */
export interface DataResponse<T> {
  data: T;
}

/** Envelope used by paginated list endpoints. */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Error envelope: { "error": { "status": 409, "message": "...", "code": "INVALID_TRANSITION" } } */
export interface ApiErrorBody {
  error: {
    status: number;
    message: string;
    code?: string;
    details?: unknown;
  };
}
