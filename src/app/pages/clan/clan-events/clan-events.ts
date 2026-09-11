import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { Competition } from '../../../core/wom.models';
import {
  CompetitionStatus,
  CompetitionWinner,
  competitionStatus,
  competitionWinner,
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

// Winners are fetched eagerly (one extra request per finished event, each cached
// by WomApi) so they show up without a click. Capped so a clan with a long history
// of events doesn't fire off an unbounded burst of requests on page load.
const MAX_EAGER_WINNER_FETCHES = 40;

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

  /** Keyed by competition id. Undefined = not fetched (still loading or not eligible), null = fetched but no real winner. */
  readonly winners = signal<Record<number, CompetitionWinner | null | undefined>>({});
  private readonly requestedWinners = new Set<number>();

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
    this.winners.set({});
    this.requestedWinners.clear();
    this.wom.getGroupCompetitions(id).subscribe({
      next: (competitions) => {
        this.competitions.set(competitions);
        this.loading.set(false);
        this.fetchWinners();
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  /** Only finished events have a real winner — ongoing/upcoming ones haven't concluded. */
  private fetchWinners(): void {
    const finished = this.allRows()
      .filter((r) => r.status === 'finished')
      .slice(0, MAX_EAGER_WINNER_FETCHES);

    for (const row of finished) {
      const id = row.competition.id;
      if (this.requestedWinners.has(id)) continue;
      this.requestedWinners.add(id);

      this.wom.getCompetition(id).subscribe({
        next: (detail) => {
          this.winners.update((w) => ({ ...w, [id]: competitionWinner(detail) }));
        },
        error: () => {
          this.winners.update((w) => ({ ...w, [id]: null }));
        },
      });
    }
  }
}
