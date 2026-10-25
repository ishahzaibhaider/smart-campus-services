import { computed, Directive, input } from '@angular/core';
import { statusSlug } from '../../core/utils/workflow';

/**
 * Custom attribute directive: turns any element into a coloured badge for a request
 * status or priority. Usage: <span [appStatusColor]="request.status">{{ request.status }}</span>
 *                            <span appStatusColor="High" kind="priority">High</span>
 */
@Directive({
  selector: '[appStatusColor]',
  host: {
    '[class]': 'hostClass()',
    '[attr.title]': 'tooltip()',
  },
})
export class StatusColorDirective {
  readonly appStatusColor = input.required<string>();
  readonly kind = input<'status' | 'priority'>('status');

  protected readonly hostClass = computed(
    () => `badge badge-${this.kind()} ${this.kind()}-${statusSlug(this.appStatusColor() ?? '')}`,
  );
  protected readonly tooltip = computed(() =>
    this.kind() === 'status' ? `Status: ${this.appStatusColor()}` : `Priority: ${this.appStatusColor()}`,
  );
}
