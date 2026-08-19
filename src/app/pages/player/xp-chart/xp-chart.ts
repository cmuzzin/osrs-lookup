import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { GainsPeriod, SkillValue, TimelineDataPoint } from '../../../core/wom.models';
import {
  SKILL_ORDER,
  formatDate,
  formatDateTime,
  formatNumber,
  skillMeta,
} from '../../../core/format.util';

interface ChartPoint {
  xPct: number;
  yPct: number;
  value: number;
  date: string;
}

const PERIODS: { value: GainsPeriod; label: string }[] = [
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
];

/** SVG line chart of a single skill's XP over time, backed by WOM's snapshot timeline endpoint. */
@Component({
  selector: 'app-xp-chart',
  templateUrl: './xp-chart.html',
  styleUrl: './xp-chart.scss',
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
  readonly hoverIndex = signal<number | null>(null);

  // Points come back newest-first; the chart is drawn oldest-to-newest, left to right.
  // yPct is padded into [6, 94] rather than the full [0, 100] so a flat series (common
  // over short windows) draws as a visible mid-line instead of collapsing onto the
  // bottom edge, and peaks/troughs in a sloped series aren't clipped by the stroke.
  readonly chartPoints = computed<ChartPoint[]>(() => {
    const raw = [...this.points()].reverse();
    if (raw.length === 0) return [];
    const values = raw.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const n = raw.length;
    return raw.map((p, i) => ({
      xPct: n === 1 ? 50 : (i / (n - 1)) * 100,
      yPct: span === 0 ? 50 : 94 - ((p.value - min) / span) * 88,
      value: p.value,
      date: p.date,
    }));
  });

  readonly pathD = computed(() => toPath(this.chartPoints()));

  readonly areaD = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${toPath(pts)} L ${last.xPct} 100 L ${first.xPct} 100 Z`;
  });

  readonly minValue = computed(() => {
    const pts = this.points();
    return pts.length ? Math.min(...pts.map((p) => p.value)) : 0;
  });

  readonly maxValue = computed(() => {
    const pts = this.points();
    return pts.length ? Math.max(...pts.map((p) => p.value)) : 0;
  });

  // points() is newest-first, so index 0 is the end of the period and the last entry is the start.
  readonly gained = computed(() => {
    const pts = this.points();
    return pts.length < 2 ? 0 : pts[0].value - pts[pts.length - 1].value;
  });

  readonly startDate = computed(() => this.points().at(-1)?.date ?? null);
  readonly endDate = computed(() => this.points()[0]?.date ?? null);

  readonly hoverPoint = computed(() => {
    const i = this.hoverIndex();
    return i === null ? null : (this.chartPoints()[i] ?? null);
  });

  readonly formatNumber = formatNumber;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;

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

  onHover(event: MouseEvent): void {
    const pts = this.chartPoints();
    if (pts.length === 0) return;
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.hoverIndex.set(Math.round(fraction * (pts.length - 1)));
  }

  clearHover(): void {
    this.hoverIndex.set(null);
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

function toPath(points: ChartPoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPct} ${p.yPct}`).join(' ');
}
