import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WomApi } from '../../../core/wom-api';
import { GroupHiscoreEntry } from '../../../core/wom.models';
import { SKILL_ORDER, formatNumber, formatRank, skillMeta } from '../../../core/format.util';
import { SortIcon } from '../../../shared/sort-icon/sort-icon';
import { compareValues, createSortable } from '../../../shared/sort-state';

type SortKey = 'player' | 'level' | 'experience' | 'rank';

/** All clan members ranked by a skill (level + xp), from WOM's per-group hiscores endpoint. */
@Component({
  selector: 'app-clan-leaderboard',
  imports: [RouterLink, SortIcon],
  templateUrl: './clan-leaderboard.html',
  styleUrl: './clan-leaderboard.scss',
})
export class ClanLeaderboard {
  private readonly wom = inject(WomApi);

  readonly clanId = input.required<number>();

  readonly skillOptions = SKILL_ORDER.map((key) => skillMeta(key));
  readonly metric = signal('overall');

  readonly entries = signal<GroupHiscoreEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly sortable = createSortable<SortKey>({ key: 'experience', direction: 'desc' });
  readonly sort = this.sortable.sort;

  readonly rows = computed(() => {
    const { key, direction } = this.sort();
    return [...this.entries()].sort((a, b) => {
      if (key === 'player') return compareValues(direction, a.player.displayName, b.player.displayName);
      if (key === 'level') return compareValues(direction, a.data.level ?? 0, b.data.level ?? 0);
      if (key === 'rank') return compareValues(direction, a.data.rank ?? 0, b.data.rank ?? 0);
      return compareValues(direction, a.data.experience ?? 0, b.data.experience ?? 0);
    });
  });

  readonly formatNumber = formatNumber;
  readonly formatRank = formatRank;

  constructor() {
    effect(() => {
      const id = this.clanId();
      const metric = this.metric();
      if (!id) return;
      this.fetch(id, metric);
    });
  }

  setMetric(key: string): void {
    this.metric.set(key);
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'player' ? 'asc' : 'desc');
  }

  private fetch(id: number, metric: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.wom.getGroupHiscores(id, metric).subscribe({
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
