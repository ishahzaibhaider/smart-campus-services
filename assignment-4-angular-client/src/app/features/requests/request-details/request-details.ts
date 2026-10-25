import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { RequestPriority, ServiceRequest, UserSummary } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { RequestService } from '../../../core/services/request.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { ApiError, toApiError } from '../../../core/utils/api-error';
import { HistoryTimeline } from '../../../shared/components/history-timeline/history-timeline';
import { StatusTracker } from '../../../shared/components/status-tracker/status-tracker';
import { StatusColorDirective } from '../../../shared/directives/status-color.directive';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { AdminActions, AdvanceEvent } from '../admin-actions/admin-actions';

/** Shared details page for students (own requests) and administrators (any request + actions). */
@Component({
  selector: 'app-request-details',
  imports: [DatePipe, RouterLink, TimeAgoPipe, StatusColorDirective, StatusTracker, HistoryTimeline, AdminActions],
  templateUrl: './request-details.html',
  styleUrl: './request-details.css',
})
export class RequestDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestService = inject(RequestService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly request = signal<ServiceRequest | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<ApiError | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly admins = signal<UserSummary[]>([]);

  protected readonly isOwner = computed(() => this.request()?.createdBy?._id === this.auth.currentUser()?.id);
  /** Students may withdraw their own request only while it is still Submitted. */
  protected readonly canStudentDelete = computed(
    () => !this.auth.isAdmin() && this.isOwner() && this.request()?.status === 'Submitted',
  );
  protected readonly backLink = computed(() => (this.auth.isAdmin() ? '/admin/requests' : '/dashboard'));

  constructor() {
    // Re-fetch whenever the :id route parameter changes (switchMap cancels a stale request).
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        distinctUntilChanged(),
        tap(() => {
          this.loading.set(true);
          this.loadError.set(null);
          this.actionError.set(null);
        }),
        switchMap((id) =>
          this.requestService.get(id).pipe(
            catchError((err) => {
              this.loadError.set(toApiError(err));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((request) => {
        this.request.set(request);
        this.loading.set(false);
      });

    if (this.auth.isAdmin()) {
      this.userService
        .getAdmins()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (admins) => this.admins.set(admins),
          error: (err: ApiError) => this.actionError.set(`Could not load administrators: ${err.message}`),
        });
    }
  }

  // ----- Admin actions (events emitted by <app-admin-actions>) -----

  protected onAssign(adminId: string): void {
    const name = this.admins().find((a) => a._id === adminId)?.name ?? 'administrator';
    this.run((id) => this.requestService.assign(id, adminId), `Assigned to ${name}.`);
  }

  protected onAdvance({ status, note }: AdvanceEvent): void {
    this.run((id) => this.requestService.updateStatus(id, status, note), `Status changed to ${status}.`);
  }

  protected onPriorityChange(priority: RequestPriority): void {
    this.run((id) => this.requestService.update(id, { priority }), `Priority set to ${priority}.`);
  }

  protected onDelete(): void {
    const request = this.request();
    if (!request) return;
    const question = this.auth.isAdmin()
      ? `Delete ${request.requestId} permanently? This cannot be undone.`
      : `Withdraw ${request.requestId}? The service team will no longer see it.`;
    if (!confirm(question)) return;

    this.busy.set(true);
    this.actionError.set(null);
    this.requestService
      .delete(request.requestId)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(`${request.requestId} was ${this.auth.isAdmin() ? 'deleted' : 'withdrawn'}.`);
          void this.router.navigateByUrl(this.backLink());
        },
        error: (err: ApiError) => this.actionError.set(err.message),
      });
  }

  /** Runs one mutating call, swaps in the updated request, and surfaces API errors (e.g. 409). */
  private run(call: (id: string) => Observable<ServiceRequest>, successMessage: string): void {
    const current = this.request();
    if (!current || this.busy()) return;
    this.busy.set(true);
    this.actionError.set(null);
    call(current.requestId)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (updated) => {
          this.request.set(updated);
          this.toast.success(successMessage);
        },
        error: (err: ApiError) => {
          const prefix = err.code === 'INVALID_TRANSITION' ? 'Invalid status change: ' : '';
          this.actionError.set(prefix + err.message);
        },
      });
  }
}
