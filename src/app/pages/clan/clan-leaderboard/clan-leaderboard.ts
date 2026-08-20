import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WomApi } from '../../../core/wom-api';
import { GroupHiscoreEntry } from '../../../core/wom.models';
import { SKILL_ORDER, formatNumber, formatRank, skillMeta } from '../../../core/format.util';

/** All clan members ranked by a skill (level + xp), from WOM's per-group hiscores endpoint. */
@Component({
  selector: 'app-clan-leaderboard',
  imports: [RouterLink],
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

  // The API doesn't guarantee sort order, so sort defensively by xp.
  readonly rows = computed(() =>
    [...this.entries()].sort((a, b) => (b.data.experience ?? 0) - (a.data.experience ?? 0)),
  );

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
