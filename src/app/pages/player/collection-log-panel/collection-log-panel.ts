import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { ActivityValue, GainsPeriod, TimelineDataPoint } from '../../../core/wom.models';
import { formatNumber, formatRank } from '../../../core/format.util';
import { TrendChart } from '../../../shared/trend-chart/trend-chart';

const PERIODS: { value: GainsPeriod; label: string }[] = [
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
];

const METRIC = 'collections_logged';

/**
 * Collection Log progress: current unique-item count + hiscores rank, plus a trend
 * chart over time via WOM's snapshot timeline. There's no published "total slots"
 * figure in WOM's metric data (it only defines a hiscores ranking threshold, not a
 * completion target), so this deliberately shows real progress-over-time rather than
 * a fabricated percent-complete bar.
 */
@Component({
  selector: 'app-collection-log-panel',
  imports: [TrendChart],
  templateUrl: './collection-log-panel.html',
  styleUrl: './collection-log-panel.scss',
})
export class CollectionLogPanel {
  private readonly wom = inject(WomApi);

  readonly username = input.required<string>();
  readonly activities = input.required<Record<string, ActivityValue>>();

  readonly current = computed<ActivityValue | null>(() => this.activities()[METRIC] ?? null);

  readonly periods = PERIODS;
  readonly period = signal<GainsPeriod>('month');

  readonly points = signal<TimelineDataPoint[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatNumber = formatNumber;
  readonly formatRank = formatRank;

  constructor() {
    effect(() => {
      const name = this.username();
      const period = this.period();
      if (!name) return;
      this.fetch(name, period);
    });
  }

  setPeriod(period: GainsPeriod): void {
    this.period.set(period);
  }

  private fetch(username: string, period: GainsPeriod): void {
    this.loading.set(true);
    this.error.set(null);
    this.wom.getTimeline(username, METRIC, period).subscribe({
      next: (pts) => {
        this.points.set(pts);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
