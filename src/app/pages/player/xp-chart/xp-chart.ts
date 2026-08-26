import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { GainsPeriod, SkillValue, TimelineDataPoint } from '../../../core/wom.models';
import { SKILL_ORDER, skillMeta } from '../../../core/format.util';
import { TrendChart } from '../../../shared/trend-chart/trend-chart';

const PERIODS: { value: GainsPeriod; label: string }[] = [
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
];

/** Skill picker + period toggle over WOM's snapshot timeline endpoint, rendered by TrendChart. */
@Component({
  selector: 'app-xp-chart',
  imports: [TrendChart],
  templateUrl: './xp-chart.html',
})
export class XpChart {
  private readonly wom = inject(WomApi);

  readonly username = input.required<string>();
  readonly skills = input.required<Record<string, SkillValue>>();

  readonly skillOptions = computed(() =>
    SKILL_ORDER.filter((key) => this.skills()[key]).map((key) => skillMeta(key)),
  );

  readonly periods = PERIODS;
  readonly metric = signal('overall');
  readonly period = signal<GainsPeriod>('week');

  readonly points = signal<TimelineDataPoint[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const name = this.username();
      const metric = this.metric();
      const period = this.period();
      if (!name) return;
      this.fetch(name, metric, period);
    });
  }

  setMetric(key: string): void {
    this.metric.set(key);
  }

  setPeriod(period: GainsPeriod): void {
    this.period.set(period);
  }

  private fetch(username: string, metric: string, period: GainsPeriod): void {
    this.loading.set(true);
    this.error.set(null);
    this.wom.getTimeline(username, metric, period).subscribe({
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
