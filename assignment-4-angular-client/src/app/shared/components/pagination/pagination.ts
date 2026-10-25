import { Component, computed, input, output } from '@angular/core';

/** Presentational pager: parent owns the page number, this emits (pageChange). */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly total = input(0);
  readonly limit = input(10);
  readonly pageChange = output<number>();

  protected readonly from = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1));
  protected readonly to = computed(() => Math.min(this.page() * this.limit(), this.total()));

  /** Compact page list such as 1 … 4 5 6 … 12 */
  protected readonly pages = computed<(number | null)[]>(() => {
    const total = Math.max(this.totalPages(), 1);
    const current = this.page();
    const wanted = new Set([1, total, current - 1, current, current + 1]);
    const result: (number | null)[] = [];
    let prev = 0;
    for (let p = 1; p <= total; p++) {
      if (!wanted.has(p)) continue;
      if (p - prev > 1) result.push(null);
      result.push(p);
      prev = p;
    }
    return result;
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}
