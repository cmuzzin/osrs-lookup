import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RuneProfileApi, RUNEPROFILE_NOT_LINKED_MESSAGE } from '../../../core/runeprofile-api';
import { Quest, QuestState } from '../../../core/runeprofile.models';
import { formatNumber } from '../../../core/format.util';
import { SortIcon } from '../../../shared/sort-icon/sort-icon';
import { compareValues, createSortable } from '../../../shared/sort-state';

type StateFilter = 'all' | QuestState;
type SortKey = 'name' | 'type' | 'points' | 'state';

const STATE_FILTERS: { value: StateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'finished', label: 'Finished' },
];

const TYPE_LABELS: Record<string, string> = { free: 'Free', members: 'Members', mini: 'Mini' };
const STATE_LABELS: Record<QuestState, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  finished: 'Finished',
};

/**
 * Quest completion progress, sourced entirely from RuneProfile — WOM has no concept
 * of quests at all, so unlike the other panels there's no native-data fallback here.
 * Most players won't have a RuneProfile account; that 404 is shown as a plain,
 * un-alarming note rather than a red error, same treatment as an empty clan list.
 */
@Component({
  selector: 'app-quests-panel',
  imports: [SortIcon],
  templateUrl: './quests-panel.html',
  styleUrl: './quests-panel.scss',
})
export class QuestsPanel {
  private readonly runeProfile = inject(RuneProfileApi);

  /** The player's real in-game name (correct spacing/casing) — RuneProfile's lookup is space-sensitive. */
  readonly rsn = input.required<string>();

  readonly quests = signal<Quest[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notLinked = computed(() => this.error() === RUNEPROFILE_NOT_LINKED_MESSAGE);

  readonly search = signal('');
  readonly stateFilter = signal<StateFilter>('all');
  readonly stateFilters = STATE_FILTERS;
  readonly typeLabels = TYPE_LABELS;
  readonly stateLabels = STATE_LABELS;

  private readonly sortable = createSortable<SortKey>({ key: 'name', direction: 'asc' });
  readonly sort = this.sortable.sort;

  readonly totalPoints = computed(() => this.quests().reduce((sum, q) => sum + q.points, 0));
  readonly earnedPoints = computed(() =>
    this.quests()
      .filter((q) => q.state === 'finished')
      .reduce((sum, q) => sum + q.points, 0),
  );
  readonly pointsPct = computed(() => {
    const total = this.totalPoints();
    return total > 0 ? (this.earnedPoints() / total) * 100 : 0;
  });

  readonly counts = computed(() => {
    const qs = this.quests();
    return {
      all: qs.length,
      not_started: qs.filter((q) => q.state === 'not_started').length,
      in_progress: qs.filter((q) => q.state === 'in_progress').length,
      finished: qs.filter((q) => q.state === 'finished').length,
    };
  });

  readonly rows = computed(() => {
    const query = this.search().trim().toLowerCase();
    const filter = this.stateFilter();
    let rows = this.quests();
    if (filter !== 'all') rows = rows.filter((q) => q.state === filter);
    if (query) rows = rows.filter((q) => q.name.toLowerCase().includes(query));
    const { key, direction } = this.sort();
    return [...rows].sort((a, b) => compareValues(direction, a[key], b[key]));
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

  setStateFilter(filter: StateFilter): void {
    this.stateFilter.set(filter);
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'name' ? 'asc' : 'desc');
  }

  private fetch(rsn: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.runeProfile.getQuests(rsn).subscribe({
      next: (quests) => {
        this.quests.set(quests);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
