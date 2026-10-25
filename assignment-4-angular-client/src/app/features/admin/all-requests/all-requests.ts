import { AsyncPipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import {
  PaginatedResponse,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  RequestPriority,
  RequestQuery,
  RequestStatus,
  ServiceRequest,
} from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { RequestService } from '../../../core/services/request.service';
import { toApiError } from '../../../core/utils/api-error';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { RequestTable } from '../../../shared/components/request-table/request-table';

type LoadState =
  | { kind: 'loading'; previous: PaginatedResponse<ServiceRequest> | null }
  | { kind: 'loaded'; result: PaginatedResponse<ServiceRequest> }
  | { kind: 'error'; message: string };

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | '' {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : '';
}

/**
 * Admin list of every request. Filters use a template-driven form with [(ngModel)] bound to
 * signals; the filter state is mirrored into the URL so links such as ?status=Assigned work.
 */
@Component({
  selector: 'app-all-requests',
  imports: [FormsModule, AsyncPipe, RequestTable, Pagination],
  templateUrl: './all-requests.html',
  styleUrl: './all-requests.css',
})
export class AllRequestsPage {
  private readonly requestService = inject(RequestService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly categories$ = inject(CategoryService).getAll().pipe(catchError(() => of([])));
  protected readonly statuses = REQUEST_STATUSES;
  protected readonly priorities = REQUEST_PRIORITIES;
  protected readonly pageSizes = [10, 20, 50];

  private readonly initial = this.route.snapshot.queryParamMap;

  // Two-way bound filter fields.
  protected readonly search = signal(this.initial.get('q') ?? '');
  protected readonly category = signal(this.initial.get('category') ?? '');
  protected readonly status = signal<RequestStatus | ''>(oneOf(this.initial.get('status'), REQUEST_STATUSES));
  protected readonly priority = signal<RequestPriority | ''>(oneOf(this.initial.get('priority'), REQUEST_PRIORITIES));
  protected readonly mineOnly = signal(this.initial.get('assignedTo') === 'me');
  protected readonly limit = signal(Number(this.initial.get('limit')) || 10);
  protected readonly page = signal(Number(this.initial.get('page')) || 1);

  private readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(300), map((s) => s.trim()), distinctUntilChanged()),
    { initialValue: this.search().trim() },
  );

  protected readonly query = computed<RequestQuery>(() => ({
    q: this.debouncedSearch(),
    category: this.category(),
    status: this.status(),
    priority: this.priority(),
    assignedTo: this.mineOnly() ? 'me' : '',
    page: this.page(),
    limit: this.limit(),
  }));

  protected readonly activeFilterCount = computed(
    () =>
      [this.debouncedSearch(), this.category(), this.status(), this.priority(), this.mineOnly() ? 'me' : ''].filter(
        Boolean,
      ).length,
  );

  protected readonly state = signal<LoadState>({ kind: 'loading', previous: null });
  private readonly reloadTick = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Keep the address bar in sync (replaceUrl so the back button is not flooded).
    effect(() => {
      const q = this.query();
      const queryParams = Object.fromEntries(
        Object.entries(q).filter(([key, v]) => v !== '' && v !== undefined && !(key === 'page' && v === 1) && !(key === 'limit' && v === 10)),
      );
      void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
    });

    toObservable(computed(() => ({ query: this.query(), tick: this.reloadTick() })))
      .pipe(
        switchMap(({ query }) =>
          this.requestService.list(query).pipe(
            map((result): LoadState => ({ kind: 'loaded', result })),
            catchError((err) => of<LoadState>({ kind: 'error', message: toApiError(err).message })),
            startWith<LoadState>({ kind: 'loading', previous: this.lastResult() }),
          ),
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((state) => this.state.set(state));
  }

  /** Any filter change goes back to page 1. */
  protected filterChanged(): void {
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.category.set('');
    this.status.set('');
    this.priority.set('');
    this.mineOnly.set(false);
    this.page.set(1);
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
  }

  /** While a new page loads keep showing the previous rows (dimmed) instead of a blank table. */
  protected rows(): PaginatedResponse<ServiceRequest> | null {
    const s = this.state();
    return s.kind === 'loaded' ? s.result : s.kind === 'loading' ? s.previous : null;
  }

  private lastResult(): PaginatedResponse<ServiceRequest> | null {
    return this.rows();
  }
}
