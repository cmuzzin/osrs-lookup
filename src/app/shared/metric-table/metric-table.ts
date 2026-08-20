import { Component, computed, input, signal } from '@angular/core';
import { formatNumber, formatRank } from '../../core/format.util';
import { SortIcon } from '../sort-icon/sort-icon';
import { compareValues, createSortable } from '../sort-state';

export interface MetricRow {
  name: string;
  icon: string;
  value: number;
  rank: number;
}

type SortKey = 'name' | 'value' | 'rank';

@Component({
  selector: 'app-metric-table',
  imports: [SortIcon],
  templateUrl: './metric-table.html',
  styleUrl: './metric-table.scss',
})
export class MetricTable {
  readonly title = input.required<string>();
  readonly valueHeader = input<string>('KC');
  readonly rows = input.required<MetricRow[]>();
  readonly emptyMessage = input<string>('No data available.');

  readonly showUnranked = signal(false);

  private readonly sortable = createSortable<SortKey>({ key: 'value', direction: 'desc' });
  readonly sort = this.sortable.sort;

  readonly ranked = computed(() => this.rows().filter((r) => r.rank > 0));
  readonly unranked = computed(() => this.rows().filter((r) => r.rank <= 0));

  readonly visible = computed(() => {
    const base = this.showUnranked() ? [...this.ranked(), ...this.unranked()] : this.ranked();
    const { key, direction } = this.sort();
    return [...base].sort((a, b) => compareValues(direction, a[key], b[key]));
  });

  readonly formatNumber = formatNumber;
  readonly formatRank = formatRank;

  toggleUnranked(): void {
    this.showUnranked.update((v) => !v);
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'name' ? 'asc' : 'desc');
  }
}
