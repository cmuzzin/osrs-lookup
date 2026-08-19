import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { GroupStatistics } from '../../../core/wom.models';
import { formatNumber } from '../../../core/format.util';

/** Clan-wide aggregate stats: maxed-account counts and average member levels/xp. */
@Component({
  selector: 'app-clan-stats',
  templateUrl: './clan-stats.html',
  styleUrl: './clan-stats.scss',
})
export class ClanStats {
  private readonly wom = inject(WomApi);

  readonly clanId = input.required<number>();

  readonly stats = signal<GroupStatistics | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly averageLevel = computed(() => this.stats()?.averageStats.data.skills['overall']?.level ?? 0);
  readonly averageXp = computed(() => this.stats()?.averageStats.data.skills['overall']?.experience ?? 0);

  readonly formatNumber = formatNumber;

  constructor() {
    effect(() => {
      const id = this.clanId();
      if (!id) return;
      this.fetch(id);
    });
  }

  private fetch(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.wom.getGroupStatistics(id).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
