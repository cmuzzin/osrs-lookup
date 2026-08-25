import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { PlayerAchievement, SnapshotData } from '../../../core/wom.models';
import { classifyMetric, formatDate } from '../../../core/format.util';
import { SortIcon } from '../../../shared/sort-icon/sort-icon';
import { compareValues, createSortable } from '../../../shared/sort-state';

interface AchievementRow {
  name: string;
  icon: string;
  createdAt: string;
}

type SortKey = 'name' | 'createdAt';

/**
 * Career-highlights timeline: every milestone WOM has recorded for this player
 * (99s, boss KC thresholds, XP thresholds, etc), with the date each was reached.
 */
@Component({
  selector: 'app-achievements-panel',
  imports: [SortIcon],
  templateUrl: './achievements-panel.html',
  styleUrl: './achievements-panel.scss',
})
export class AchievementsPanel {
  private readonly wom = inject(WomApi);

  readonly username = input.required<string>();
  readonly snapshot = input.required<SnapshotData>();

  readonly achievements = signal<PlayerAchievement[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly sortable = createSortable<SortKey>({ key: 'createdAt', direction: 'desc' });
  readonly sort = this.sortable.sort;

  readonly rows = computed<AchievementRow[]>(() => {
    const data = this.snapshot();
    const mapped = this.achievements().map((a) => ({
      name: a.name,
      icon: classifyMetric(a.metric, data).icon,
      createdAt: a.createdAt,
    }));
    const { key, direction } = this.sort();
    return mapped.sort((a, b) => compareValues(direction, a[key], b[key]));
  });

  readonly formatDate = formatDate;

  constructor() {
    effect(() => {
      const name = this.username();
      if (!name) return;
      this.fetch(name);
    });
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'name' ? 'asc' : 'desc');
  }

  private fetch(username: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.wom.getAchievements(username).subscribe({
      next: (achievements) => {
        this.achievements.set(achievements);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
