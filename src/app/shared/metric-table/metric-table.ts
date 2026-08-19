import { Component, computed, input, signal } from '@angular/core';
import { formatNumber, formatRank } from '../../core/format.util';

export interface MetricRow {
  name: string;
  icon: string;
  value: number;
  rank: number;
}

@Component({
  selector: 'app-metric-table',
  templateUrl: './metric-table.html',
  styleUrl: './metric-table.scss',
})
export class MetricTable {
  readonly title = input.required<string>();
  readonly valueHeader = input<string>('KC');
  readonly rows = input.required<MetricRow[]>();
  readonly emptyMessage = input<string>('No data available.');

  readonly showUnranked = signal(false);

  readonly ranked = computed(() =>
    this.rows()
      .filter((r) => r.rank > 0)
      .sort((a, b) => b.value - a.value),
  );

  readonly unranked = computed(() =>
    this.rows()
      .filter((r) => r.rank <= 0)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly visible = computed(() =>
    this.showUnranked() ? [...this.ranked(), ...this.unranked()] : this.ranked(),
  );

  readonly formatNumber = formatNumber;
  readonly formatRank = formatRank;

  toggleUnranked(): void {
    this.showUnranked.update((v) => !v);
  }
}
