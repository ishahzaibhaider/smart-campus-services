import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, Observable } from 'rxjs';
import { Category, REQUEST_PRIORITIES, RequestPriority } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { RequestService } from '../../../core/services/request.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError, toApiError } from '../../../core/utils/api-error';
import { StatusColorDirective } from '../../../shared/directives/status-color.directive';

const PRIORITY_HINTS: Record<RequestPriority, string> = {
  Low: 'Whenever convenient',
  Medium: 'Within a few days',
  High: 'Affecting classes or work',
  Urgent: 'Safety or exam-critical',
};

/** Reactive form for POST /api/requests; categories come from GET /api/categories. */
@Component({
  selector: 'app-new-request',
  imports: [ReactiveFormsModule, RouterLink, AsyncPipe, StatusColorDirective],
  templateUrl: './new-request.html',
  styleUrl: './new-request.css',
})
export class NewRequestPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly requestService = inject(RequestService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly titleMax = 120;
  protected readonly descriptionMax = 2000;
  protected readonly priorities = REQUEST_PRIORITIES;
  protected readonly priorityHints = PRIORITY_HINTS;

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly categoriesError = signal<string | null>(null);

  /** Rendered with the async pipe; the service caches the response with shareReplay. */
  protected readonly categories$: Observable<Category[]> = inject(CategoryService)
    .getAll()
    .pipe(
      catchError((err) => {
        this.categoriesError.set(toApiError(err).message);
        return EMPTY;
      }),
    );

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(this.titleMax)]],
    category: ['', Validators.required],
    priority: this.fb.control<RequestPriority>('Medium', Validators.required),
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(this.descriptionMax)]],
  });

  protected readonly c = this.form.controls;

  protected showError(name: 'title' | 'category' | 'priority' | 'description'): boolean {
    const control = this.c[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.requestService
      .create({ ...value, title: value.title.trim(), description: value.description.trim() })
      .subscribe({
        next: (created) => {
          this.toast.success(`${created.requestId} submitted. We'll keep you posted.`);
          void this.router.navigate(['/requests', created.requestId]);
        },
        error: (err: ApiError) => {
          this.errorMessage.set(err.message);
          this.submitting.set(false);
        },
      });
  }
}
