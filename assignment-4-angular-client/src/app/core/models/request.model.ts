import { Category } from './category.model';
import { UserSummary } from './user.model';

export const REQUEST_STATUSES = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

/** `by` may come back populated, as a plain id, or as a display name. */
export type HistoryActor = string | Pick<UserSummary, '_id' | 'name'> | null;

export interface HistoryEntry {
  status: RequestStatus;
  note?: string;
  by?: HistoryActor;
  at: string;
}

export interface ServiceRequest {
  _id: string;
  requestId: string;
  title: string;
  requesterName: string;
  category: Category;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

/** Query string accepted by GET /api/requests. Empty values are not sent. */
export interface RequestQuery {
  status?: RequestStatus | '';
  category?: string;
  priority?: RequestPriority | '';
  /** Free-text search over title, description, requestId and requester name. */
  q?: string;
  /** Admin only: an admin user id, or 'me'. */
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateRequestPayload {
  title: string;
  category: string;
  description: string;
  priority: RequestPriority;
}

/** Fields a student may change while the request is still Submitted. */
export type StudentUpdatePayload = Partial<CreateRequestPayload>;

/** Fields an administrator may change through PUT /api/requests/:id. */
export interface AdminUpdatePayload {
  priority?: RequestPriority;
  assignedTo?: string | null;
  status?: RequestStatus;
  note?: string;
}
