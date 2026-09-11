import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RuneProfileApi, RUNEPROFILE_NOT_LINKED_MESSAGE } from '../../../core/runeprofile-api';
import { CombatAchievementTask, CombatAchievementTierName } from '../../../core/runeprofile.models';
import { formatNumber } from '../../../core/format.util';
import { SortIcon } from '../../../shared/sort-icon/sort-icon';
import { compareValues, createSortable } from '../../../shared/sort-state';

type TierFilter = 'all' | CombatAchievementTierName;
type SortKey = 'name' | 'tierId' | 'type' | 'monster' | 'completed';

const TIER_FILTERS: { value: TierFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
  { value: 'Elite', label: 'Elite' },
  { value: 'Master', label: 'Master' },
  { value: 'Grandmaster', label: 'Grandmaster' },
];

interface TierCount {
  completed: number;
  total: number;
}

/**
 * Combat achievement progress, sourced entirely from RuneProfile (WOM has no concept
 * of these). One request (the full task list) supplies everything — totalPoints and
 * tierReached come straight from the response, and the per-tier breakdown is derived
 * client-side rather than making a second call to RuneProfile's lighter summary endpoint.
 */
@Component({
  selector: 'app-combat-achievements-panel',
  imports: [SortIcon],
  templateUrl: './combat-achievements-panel.html',
  styleUrl: './combat-achievements-panel.scss',
})
export class CombatAchievementsPanel {
  private readonly runeProfile = inject(RuneProfileApi);

  /** The player's real in-game name (correct spacing/casing) — RuneProfile's lookup is space-sensitive. */
  readonly rsn = input.required<string>();

  readonly tasks = signal<CombatAchievementTask[]>([]);
  readonly totalPoints = signal(0);
  readonly tierReached = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notLinked = computed(() => this.error() === RUNEPROFILE_NOT_LINKED_MESSAGE);

  readonly search = signal('');
  readonly tierFilter = signal<TierFilter>('all');
  readonly tierFilters = TIER_FILTERS;
  readonly onlyIncomplete = signal(false);

  private readonly sortable = createSortable<SortKey>({ key: 'tierId', direction: 'asc' });
  readonly sort = this.sortable.sort;

  readonly overallCount = computed<TierCount>(() => {
    const tasks = this.tasks();
    return { completed: tasks.filter((t) => t.completed).length, total: tasks.length };
  });

  readonly tierCounts = computed<Record<string, TierCount>>(() => {
    const byTier: Record<string, TierCount> = {};
    for (const t of this.tasks()) {
      const bucket = (byTier[t.tierName] ??= { completed: 0, total: 0 });
      bucket.total++;
      if (t.completed) bucket.completed++;
    }
    return byTier;
  });

  readonly rows = computed(() => {
    const query = this.search().trim().toLowerCase();
    const filter = this.tierFilter();
    let rows = this.tasks();
    if (filter !== 'all') rows = rows.filter((t) => t.tierName === filter);
    if (this.onlyIncomplete()) rows = rows.filter((t) => !t.completed);
    if (query) {
      rows = rows.filter((t) => t.name.toLowerCase().includes(query) || t.monster.toLowerCase().includes(query));
    }
    const { key, direction } = this.sort();
    return [...rows].sort((a, b) => compareValues(direction, sortValue(a, key), sortValue(b, key)));
  });

  readonly formatNumber = formatNumber;

  constructor() {
    effect(() => {
      const name = this.rsn();
      if (!name) return;
      this.fetch(name);
    });
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setTierFilter(filter: TierFilter): void {
    this.tierFilter.set(filter);
  }

  toggleOnlyIncomplete(): void {
    this.onlyIncomplete.update((v) => !v);
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'completed' ? 'desc' : 'asc');
  }

  private fetch(rsn: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.runeProfile.getCombatAchievementTasks(rsn).subscribe({
      next: (res) => {
        this.tasks.set(res.data);
        this.totalPoints.set(res.totalPoints);
        this.tierReached.set(res.tierReached);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}

function sortValue(task: CombatAchievementTask, key: SortKey): number | string {
  if (key === 'completed') return task.completed ? 1 : 0;
  return task[key];
}
