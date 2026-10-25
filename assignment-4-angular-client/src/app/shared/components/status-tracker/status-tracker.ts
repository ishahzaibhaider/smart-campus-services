import { Component, computed, input } from '@angular/core';
import { RequestStatus } from '../../../core/models';
import { STATUS_FLOW, statusIndex } from '../../../core/utils/workflow';

interface Step {
  label: RequestStatus;
  state: 'done' | 'current' | 'upcoming';
}

/** Horizontal stepper: Submitted -> Assigned -> In Progress -> Resolved -> Closed. */
@Component({
  selector: 'app-status-tracker',
  templateUrl: './status-tracker.html',
  styleUrl: './status-tracker.css',
})
export class StatusTracker {
  readonly status = input.required<RequestStatus>();

  protected readonly steps = computed<Step[]>(() => {
    const current = statusIndex(this.status());
    return STATUS_FLOW.map((label, i) => ({
      label,
      state: i < current ? 'done' : i === current ? 'current' : 'upcoming',
    }));
  });

  protected readonly progress = computed(() => (statusIndex(this.status()) / (STATUS_FLOW.length - 1)) * 100);
}
