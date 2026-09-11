import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { Competition } from '../../../core/wom.models';
import {
  CompetitionStatus,
  competitionStatus,
  formatDate,
  formatNumber,
  metricIcon,
  metricLabel,
} from '../../../core/format.util';
import { MetricIcon } from '../../../shared/metric-icon/metric-icon';

type Filter = 'all' | CompetitionStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'finished', label: 'Finished' },
];

interface EventRow {
  competition: Competition;
  status: CompetitionStatus;
  icon: string;
  metricLabel: string;
}

/** This clan's events — what Wise Old Man calls competitions (Boss/Skill of the Month, etc). */
@Component({
  selector: 'app-clan-events',
  imports: [MetricIcon],
  templateUrl: './clan-events.html',
  styleUrl: './clan-events.scss',
})
export class ClanEvents {
  private readonly wom = inject(WomApi);

  readonly clanId = input.required<number>();

  readonly filters = FILTERS;
  readonly filter = signal<Filter>('all');

  readonly competitions = signal<Competition[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatDate = formatDate;
  readonly formatNumber = formatNumber;

  // Newest-first, tagged with their live status. Computed once so both the row list
  // and the filter tab counts stay in sync without recomputing status per filter.
  private readonly allRows = computed<EventRow[]>(() =>
    [...this.competitions()]
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
      .map((c) => ({
        competition: c,
        status: competitionStatus(c.startsAt, c.endsAt),
        icon: metricIcon(c.metric),
        metricLabel: metricLabel(c.metric),
      })),
  );

  readonly rows = computed<EventRow[]>(() => {
    const filter = this.filter();
    const all = this.allRows();
    return filter === 'all' ? all : all.filter((r) => r.status === filter);
  });

  readonly counts = computed(() => {
    const all = this.allRows();
    return {
      all: all.length,
      ongoing: all.filter((r) => r.status === 'ongoing').length,
      upcoming: all.filter((r) => r.status === 'upcoming').length,
      finished: all.filter((r) => r.status === 'finished').length,
    };
  });

  constructor() {
    effect(() => {
      const id = this.clanId();
      if (!id) return;
      this.fetch(id);
    });
  }

  setFilter(filter: Filter): void {
    this.filter.set(filter);
  }

  private fetch(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.wom.getGroupCompetitions(id).subscribe({
      next: (competitions) => {
        this.competitions.set(competitions);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
