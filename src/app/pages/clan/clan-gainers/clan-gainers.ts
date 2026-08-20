import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WomApi } from '../../../core/wom-api';
import { GainsPeriod, GroupGainedEntry } from '../../../core/wom.models';
import { formatNumber, formatSignedNumber } from '../../../core/format.util';

const PERIODS: { value: GainsPeriod; label: string }[] = [
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
];

/** All members' XP gained in the clan for a period, from WOM's per-group gained endpoint. */
@Component({
  selector: 'app-clan-gainers',
  imports: [RouterLink],
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

  readonly rows = computed(() => [...this.entries()].sort((a, b) => b.data.gained - a.data.gained));

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
