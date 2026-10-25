import { REQUEST_STATUSES, RequestStatus } from '../models';

/** Submitted -> Assigned -> In Progress -> Resolved -> Closed (one step forward only). */
export const STATUS_FLOW: readonly RequestStatus[] = REQUEST_STATUSES;

export function statusIndex(status: RequestStatus): number {
  return STATUS_FLOW.indexOf(status);
}

/** The only status a request may move to next, or null when it is already Closed. */
export function nextStatus(status: RequestStatus): RequestStatus | null {
  const index = statusIndex(status);
  return index >= 0 && index < STATUS_FLOW.length - 1 ? STATUS_FLOW[index + 1] : null;
}

export function isUnresolved(status: RequestStatus): boolean {
  return status !== 'Resolved' && status !== 'Closed';
}

/** CSS-friendly slug, e.g. "In Progress" -> "in-progress". */
export function statusSlug(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, '-');
}
