import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import {
  CampusStats,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  RequestStatus,
  ServiceRequest,
} from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { RequestService } from '../../../core/services/request.service';
import { StatsService } from '../../../core/services/stats.service';
import { ApiError } from '../../../core/utils/api-error';
import { statusSlug } from '../../../core/utils/workflow';
import { RequestTable } from '../../../shared/components/request-table/request-table';
import { StatusColorDirective } from '../../../shared/directives/status-color.directive';

interface DashboardData {
  stats: CampusStats;
  recent: ServiceRequest[];
  assignedToMe: number;
}

/** Admin home: totals, per-status cards, unresolved per category, priority mix and latest requests. */
@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DecimalPipe, PercentPipe, RequestTable, StatusColorDirective],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  private readonly statsService = inject(StatsService);
  private readonly requestService = inject(RequestService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = REQUEST_STATUSES;
  protected readonly priorities = REQUEST_PRIORITIES;
  protected readonly slug = statusSlug;

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(true);

  protected readonly openCount = computed(() => {
    const s = this.data()?.stats.byStatus;
    return s ? s.Submitted + s.Assigned + s['In Progress'] : 0;
  });
  protected readonly maxUnresolved = computed(() =>
    Math.max(1, ...(this.data()?.stats.unresolvedByCategory.map((c) => c.count) ?? [0])),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    // Three independent calls in parallel; forkJoin emits once all of them complete.
    forkJoin({
      stats: this.statsService.getStats(),
      recent: this.requestService.list({ limit: 5 }).pipe(map((res) => res.data)),
      assignedToMe: this.requestService.list({ assignedTo: 'me', limit: 1 }).pipe(map((res) => res.total)),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      });
  }

  protected share(count: number, total: number): number {
    return total > 0 ? count / total : 0;
  }

  protected statusCount(stats: CampusStats, status: RequestStatus): number {
    return stats.byStatus[status] ?? 0;
  }
}
