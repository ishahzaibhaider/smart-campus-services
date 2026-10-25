import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { REQUEST_PRIORITIES, RequestPriority, RequestStatus, ServiceRequest, UserSummary } from '../../../core/models';
import { nextStatus } from '../../../core/utils/workflow';
import { StatusColorDirective } from '../../../shared/directives/status-color.directive';

export interface AdvanceEvent {
  status: RequestStatus;
  note: string;
}

/**
 * Admin-only panel on the request details page. It is purely presentational:
 * inputs describe the request, outputs tell the parent what the admin wants to do.
 * Form fields use template-driven two-way binding ([(ngModel)]) to writable signals.
 */
@Component({
  selector: 'app-admin-actions',
  imports: [FormsModule, StatusColorDirective],
  templateUrl: './admin-actions.html',
  styleUrl: './admin-actions.css',
})
export class AdminActions {
  readonly request = input.required<ServiceRequest>();
  readonly admins = input<UserSummary[]>([]);
  readonly busy = input(false);

  readonly assign = output<string>();
  readonly advance = output<AdvanceEvent>();
  readonly priorityChange = output<RequestPriority>();
  readonly remove = output<void>();

  protected readonly priorities = REQUEST_PRIORITIES;

  // linkedSignal: local editable copies that reset whenever a fresh request arrives from the API.
  protected readonly selectedAdmin = linkedSignal(() => this.request().assignedTo?._id ?? '');
  protected readonly selectedPriority = linkedSignal(() => this.request().priority);
  protected readonly note = linkedSignal({ source: this.request, computation: () => '' });

  /** Only the next valid status is offered; jumping steps is impossible from the UI. */
  protected readonly next = computed(() => nextStatus(this.request().status));
  protected readonly isFinished = computed(() => ['Resolved', 'Closed'].includes(this.request().status));
  protected readonly assignChanged = computed(
    () => !!this.selectedAdmin() && this.selectedAdmin() !== (this.request().assignedTo?._id ?? ''),
  );

  protected submitAssign(): void {
    if (this.assignChanged()) {
      this.assign.emit(this.selectedAdmin());
    }
  }

  protected submitAdvance(): void {
    const next = this.next();
    if (next) {
      this.advance.emit({ status: next, note: this.note() });
    }
  }

  protected submitPriority(): void {
    if (this.selectedPriority() !== this.request().priority) {
      this.priorityChange.emit(this.selectedPriority());
    }
  }
}
