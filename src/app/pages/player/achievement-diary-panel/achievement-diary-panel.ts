import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RuneProfileApi, RUNEPROFILE_NOT_LINKED_MESSAGE } from '../../../core/runeprofile-api';
import { AchievementDiaryArea } from '../../../core/runeprofile.models';
import { formatNumber } from '../../../core/format.util';

const TIER_ORDER = ['Easy', 'Medium', 'Hard', 'Elite'];

/**
 * Achievement diary progress, sourced entirely from RuneProfile (WOM has no concept
 * of diaries). Laid out as the area × tier grid players already know from the game's
 * own diary journal, rather than a flat list — RuneProfile only gives per-tier task
 * counts here, not individual task names, so a grid is the most this data supports.
 */
@Component({
  selector: 'app-achievement-diary-panel',
  templateUrl: './achievement-diary-panel.html',
  styleUrl: './achievement-diary-panel.scss',
})
export class AchievementDiaryPanel {
  private readonly runeProfile = inject(RuneProfileApi);

  /** The player's real in-game name (correct spacing/casing) — RuneProfile's lookup is space-sensitive. */
  readonly rsn = input.required<string>();

  readonly areas = signal<AchievementDiaryArea[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notLinked = computed(() => this.error() === RUNEPROFILE_NOT_LINKED_MESSAGE);

  readonly hideCompleted = signal(false);
  readonly tierOrder = TIER_ORDER;

  // Areas sorted alphabetically with tiers normalized to a fixed Easy→Elite order —
  // the API doesn't guarantee either ordering.
  private readonly sortedAreas = computed(() =>
    [...this.areas()]
      .sort((a, b) => a.area.localeCompare(b.area))
      .map((area) => ({
        ...area,
        tiers: TIER_ORDER.map((t) => area.tiers.find((x) => x.tier === t) ?? { tier: t, completed: 0, total: 0 }),
      })),
  );

  readonly visibleAreas = computed(() => {
    if (!this.hideCompleted()) return this.sortedAreas();
    return this.sortedAreas().filter((a) => a.tiers.some((t) => t.completed < t.total));
  });

  readonly totals = computed(() => {
    let completed = 0;
    let total = 0;
    for (const area of this.areas()) {
      for (const t of area.tiers) {
        completed += t.completed;
        total += t.total;
      }
    }
    return { completed, total };
  });

  readonly eliteComplete = computed(() => {
    const areas = this.areas();
    const complete = areas.filter((a) => {
      const elite = a.tiers.find((t) => t.tier === 'Elite');
      return !!elite && elite.total > 0 && elite.completed === elite.total;
    }).length;
    return { complete, total: areas.length };
  });

  readonly formatNumber = formatNumber;

  constructor() {
    effect(() => {
      const name = this.rsn();
      if (!name) return;
      this.fetch(name);
    });
  }

  toggleHideCompleted(): void {
    this.hideCompleted.update((v) => !v);
  }

  private fetch(rsn: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.runeProfile.getAchievementDiaries(rsn).subscribe({
      next: (areas) => {
        this.areas.set(areas);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
