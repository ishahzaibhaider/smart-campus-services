import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { PaginatedResponse, REQUEST_STATUSES, RequestQuery, RequestStatus, ServiceRequest } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { RequestService } from '../../../core/services/request.service';
import { toApiError } from '../../../core/utils/api-error';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { RequestTable } from '../../../shared/components/request-table/request-table';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'loaded'; result: PaginatedResponse<ServiceRequest> }
  | { kind: 'error'; message: string };

/** Student home: "My Requests" with status tabs, search and pagination. */
@Component({
  selector: 'app-student-dashboard',
  imports: [FormsModule, RouterLink, RequestTable, Pagination],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
})
export class StudentDashboard {
  private readonly requestService = inject(RequestService);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = REQUEST_STATUSES;
  protected readonly pageSize = 8;

  // Filter state (two-way bound in the template).
  protected readonly status = signal<RequestStatus | ''>('');
  protected readonly search = signal('');
  protected readonly page = signal(1);
  private readonly reloadTick = signal(0);

  private readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(300), map((s) => s.trim()), distinctUntilChanged()),
    { initialValue: '' },
  );

  private readonly query = computed<RequestQuery & { tick: number }>(() => ({
    status: this.status(),
    q: this.debouncedSearch(),
    page: this.page(),
    limit: this.pageSize,
    tick: this.reloadTick(),
  }));

  protected readonly state = signal<LoadState>({ kind: 'loading' });
  protected readonly firstName = computed(() => this.auth.currentUser()?.name.split(' ')[0] ?? '');
  protected readonly hasFilters = computed(() => !!this.status() || !!this.debouncedSearch());

  constructor() {
    // Every change of the query cancels the previous HTTP call (switchMap) and loads the new page.
    toObservable(this.query)
      .pipe(
        switchMap(({ tick: _tick, ...query }) =>
          this.requestService.list(query).pipe(
            map((result): LoadState => ({ kind: 'loaded', result })),
            catchError((err) => of<LoadState>({ kind: 'error', message: toApiError(err).message })),
            startWith<LoadState>({ kind: 'loading' }),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((state) => this.state.set(state));
  }

  protected setStatus(status: RequestStatus | ''): void {
    this.status.set(status);
    this.page.set(1);
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.status.set('');
    this.search.set('');
    this.page.set(1);
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
  }
}
