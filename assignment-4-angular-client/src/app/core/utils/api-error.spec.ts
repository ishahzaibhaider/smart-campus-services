import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';

describe('toApiError', () => {
  it('reads the API error envelope', () => {
    const err = toApiError(
      new HttpErrorResponse({
        status: 409,
        error: { error: { status: 409, message: "Cannot move from 'Submitted' to 'Closed'.", code: 'INVALID_TRANSITION' } },
      }),
    );
    expect(err.status).toBe(409);
    expect(err.code).toBe('INVALID_TRANSITION');
    expect(err.message).toContain('Cannot move');
  });

  it('appends validation details', () => {
    const err = toApiError(
      new HttpErrorResponse({
        status: 422,
        error: { error: { status: 422, message: 'Validation failed', details: ['title is required'] } },
      }),
    );
    expect(err.message).toBe('Validation failed: title is required');
  });

  it('explains network failures', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 })).code).toBe('NETWORK_ERROR');
  });
});
