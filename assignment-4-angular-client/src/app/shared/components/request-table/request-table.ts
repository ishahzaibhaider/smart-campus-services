import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ServiceRequest } from '../../../core/models';
import { StatusColorDirective } from '../../directives/status-color.directive';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

/** Table of service requests reused by the student dashboard and the admin "All requests" page. */
@Component({
  selector: 'app-request-table',
  imports: [DatePipe, RouterLink, StatusColorDirective, TimeAgoPipe],
  templateUrl: './request-table.html',
  styleUrl: './request-table.css',
})
export class RequestTable {
  private readonly router = inject(Router);

  readonly requests = input.required<ServiceRequest[]>();
  /** Admin view adds requester and assignee columns. */
  readonly adminView = input(false);

  protected open(request: ServiceRequest): void {
    void this.router.navigate(['/requests', request.requestId]);
  }
}
