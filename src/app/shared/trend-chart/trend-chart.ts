import { Component, computed, input, signal } from '@angular/core';
import { TimelineDataPoint } from '../../core/wom.models';
import { formatDate, formatDateTime, formatNumber } from '../../core/format.util';

interface PlotPoint {
  xPct: number;
  yPct: number;
  value: number;
  date: string;
}

/**
 * SVG line/area chart for a newest-first {value, rank, date} series, as returned by
 * WOM's snapshot timeline endpoint. Purely presentational — fetching and the
 * metric/period controls live in the parent (see XpChart, CollectionLogPanel).
 */
let nextGradientId = 0;

@Component({
  selector: 'app-trend-chart',
  templateUrl: './trend-chart.html',
  styleUrl: './trend-chart.scss',
})
export class TrendChart {
  readonly points = input.required<TimelineDataPoint[]>();
  readonly unit = input<string>('');

  // Unique per instance so multiple charts on one page don't collide on the <linearGradient> id.
  readonly gradientId = `trend-chart-fill-${nextGradientId++}`;

  readonly hoverIndex = signal<number | null>(null);

  // Points come back newest-first; the chart is drawn oldest-to-newest, left to right.
  // yPct is padded into [6, 94] rather than the full [0, 100] so a flat series (common
  // over short windows) draws as a visible mid-line instead of collapsing onto the
  // bottom edge, and peaks/troughs in a sloped series aren't clipped by the stroke.
  readonly plotPoints = computed<PlotPoint[]>(() => {
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

  readonly pathD = computed(() => toPath(this.plotPoints()));

  readonly areaD = computed(() => {
    const pts = this.plotPoints();
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
    return i === null ? null : (this.plotPoints()[i] ?? null);
  });

  readonly formatNumber = formatNumber;
  readonly formatDate = formatDate;
  readonly formatDateTime = formatDateTime;

  onHover(event: MouseEvent): void {
    const pts = this.plotPoints();
    if (pts.length === 0) return;
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.hoverIndex.set(Math.round(fraction * (pts.length - 1)));
  }

  clearHover(): void {
    this.hoverIndex.set(null);
  }
}

function toPath(points: PlotPoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPct} ${p.yPct}`).join(' ');
}
