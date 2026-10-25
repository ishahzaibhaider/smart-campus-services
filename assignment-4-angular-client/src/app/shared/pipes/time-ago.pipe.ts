import { Pipe, PipeTransform } from '@angular/core';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
 * Custom pipe: turns an ISO date into relative text, e.g. "3 hours ago", "yesterday".
 * Usage: {{ request.updatedAt | timeAgo }}
 */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, now: Date = new Date()): string {
    if (!value) {
      return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
    if (Math.abs(seconds) < 45) {
      return 'just now';
    }
    for (const [unit, size] of UNITS) {
      if (Math.abs(seconds) >= size || unit === 'minute') {
        return formatter.format(Math.round(seconds / size), unit);
      }
    }
    return '';
  }
}
