import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { GainsPeriod, PlayerRecord, SnapshotData } from '../../../core/wom.models';
import { formatDate, formatNumber, metricLabel, skillMeta } from '../../../core/format.util';

interface RecordRow {
  metric: string;
  icon: string;
  label: string;
  value: number;
  updatedAt: string;
}

const PERIODS: { value: GainsPeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

/**
 * Personal bests: the largest single-period gain WOM has ever recorded for this player,
 * per metric. Distinct from the Gains panel, which only covers the current window ending
 * now — these are historical peaks and can be from years ago.
 */
@Component({
  selector: 'app-records-panel',
  templateUrl: './records-panel.html',
  styleUrl: './records-panel.scss',
})
export class RecordsPanel {
  private readonly wom = inject(WomApi);

  readonly username = input.required<string>();
  readonly snapshot = input.required<SnapshotData>();

  readonly periods = PERIODS;
  readonly period = signal<GainsPeriod>('day');

  readonly records = signal<PlayerRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly rows = computed<RecordRow[]>(() => {
    const data = this.snapshot();
    return [...this.records()]
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .map((r) => {
        const { icon, label } = classify(r.metric, data);
        return { metric: r.metric, icon, label, value: r.value, updatedAt: r.updatedAt };
      });
  });

  readonly formatNumber = formatNumber;
  readonly formatDate = formatDate;

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
    this.wom.getRecords(username, period).subscribe({
      next: (records) => {
        this.records.set(records);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}

function classify(metric: string, data: SnapshotData): { icon: string; label: string } {
  if (metric in data.skills) {
    const meta = skillMeta(metric);
    return { icon: meta.icon, label: meta.label };
  }
  if (metric in data.bosses) return { icon: '👹', label: metricLabel(metric) };
  if (metric in data.activities) return { icon: '🏆', label: metricLabel(metric) };
  if (metric === 'ehp' || metric === 'ehb') return { icon: '⚡', label: metric.toUpperCase() };
  return { icon: '📊', label: metricLabel(metric) };
}
