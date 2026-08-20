import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WomApi } from '../../../core/wom-api';
import { GainsPeriod, GroupGainedEntry } from '../../../core/wom.models';
import { formatNumber, formatSignedNumber } from '../../../core/format.util';
import { SortIcon } from '../../../shared/sort-icon/sort-icon';
import { compareValues, createSortable } from '../../../shared/sort-state';

type SortKey = 'player' | 'gained';

const PERIODS: { value: GainsPeriod; label: string }[] = [
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
];

/** All members' XP gained in the clan for a period, from WOM's per-group gained endpoint. */
@Component({
  selector: 'app-clan-gainers',
  imports: [RouterLink, SortIcon],
  templateUrl: './clan-gainers.html',
  styleUrl: './clan-gainers.scss',
})
export class ClanGainers {
  private readonly wom = inject(WomApi);

  readonly clanId = input.required<number>();

  readonly periods = PERIODS;
  readonly period = signal<GainsPeriod>('week');

  readonly entries = signal<GroupGainedEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly sortable = createSortable<SortKey>({ key: 'gained', direction: 'desc' });
  readonly sort = this.sortable.sort;

  readonly rows = computed(() => {
    const { key, direction } = this.sort();
    return [...this.entries()].sort((a, b) =>
      key === 'player'
        ? compareValues(direction, a.player.displayName, b.player.displayName)
        : compareValues(direction, a.data.gained, b.data.gained),
    );
  });

  // Independent of the current sort order, unlike checking rows()[0] — that only
  // reflects "the biggest gainer" when sorted by gained descending.
  readonly hasGains = computed(() => this.entries().some((e) => e.data.gained > 0));

  readonly formatSignedNumber = formatSignedNumber;
  readonly formatNumber = formatNumber;

  constructor() {
    effect(() => {
      const id = this.clanId();
      const period = this.period();
      if (!id) return;
      this.fetch(id, period);
    });
  }

  setPeriod(period: GainsPeriod): void {
    this.period.set(period);
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'player' ? 'asc' : 'desc');
  }

  private fetch(id: number, period: GainsPeriod): void {
    this.loading.set(true);
    this.error.set(null);
    this.wom.getGroupGained(id, 'overall', period).subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
