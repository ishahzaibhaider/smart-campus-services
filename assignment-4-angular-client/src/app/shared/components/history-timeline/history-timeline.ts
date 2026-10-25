import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { HistoryActor, HistoryEntry } from '../../../core/models';
import { StatusColorDirective } from '../../directives/status-color.directive';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

/** Vertical timeline of every status change, newest first. */
@Component({
  selector: 'app-history-timeline',
  imports: [DatePipe, TimeAgoPipe, StatusColorDirective],
  templateUrl: './history-timeline.html',
  styleUrl: './history-timeline.css',
})
export class HistoryTimeline {
  readonly history = input<HistoryEntry[]>([]);

  protected readonly entries = computed(() =>
    [...(this.history() ?? [])].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
  );

  protected actorName(by: HistoryActor | undefined): string {
    if (!by) {
      return 'System';
    }
    if (typeof by === 'string') {
      // A bare ObjectId is not meaningful to people.
      return /^[a-f0-9]{24}$/i.test(by) ? 'Staff' : by;
    }
    return by.name;
  }
}
