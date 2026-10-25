import { RequestPriority, RequestStatus } from './request.model';

export interface CategoryCount {
  category: string;
  count: number;
  /** Extra fields the Assignment 3 API includes (optional in the contract). */
  categoryId?: string;
  code?: string;
}

export interface CampusStats {
  total: number;
  byStatus: Record<RequestStatus, number>;
  unresolvedByCategory: CategoryCount[];
  byPriority: Record<RequestPriority, number>;
}
