import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchBar } from '../../shared/search-bar/search-bar';
import { MetricRow, MetricTable } from '../../shared/metric-table/metric-table';
import { PlayerHeader } from './player-header/player-header';
import { SkillsGrid } from './skills-grid/skills-grid';
import { GainsPanel } from './gains-panel/gains-panel';
import { XpChart } from './xp-chart/xp-chart';
import { WomApi } from '../../core/wom-api';
import { Player } from '../../core/wom.models';
import { metricLabel } from '../../core/format.util';
import { addRecentSearch } from '../../core/recent-searches.util';

@Component({
  selector: 'app-player-page',
  imports: [RouterLink, SearchBar, MetricTable, PlayerHeader, SkillsGrid, GainsPanel, XpChart],
  templateUrl: './player.html',
  styleUrl: './player.scss',
})
export class PlayerPage {
  private readonly wom = inject(WomApi);

  // Bound automatically from the :username route param via withComponentInputBinding().
  readonly username = input<string>('');

  readonly player = signal<Player | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly bossRows = computed<MetricRow[]>(() => {
    const bosses = this.player()?.latestSnapshot?.data.bosses;
    if (!bosses) return [];
    return Object.values(bosses).map((b) => ({
      name: metricLabel(b.metric),
      icon: '👹',
      value: b.kills,
      rank: b.rank,
    }));
  });

  readonly activityRows = computed<MetricRow[]>(() => {
    const activities = this.player()?.latestSnapshot?.data.activities;
    if (!activities) return [];
    return Object.values(activities).map((a) => ({
      name: metricLabel(a.metric),
      icon: '🏆',
      value: a.score,
      rank: a.rank,
    }));
  });

  constructor() {
    effect(() => {
      const name = this.username();
      if (!name) return;
      this.fetchPlayer(name);
    });
  }

  retry(): void {
    const name = this.username();
    if (name) this.fetchPlayer(name);
  }

  private fetchPlayer(name: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.player.set(null);
    this.wom.trackPlayer(name).subscribe({
      next: (p) => {
        this.player.set(p);
        this.loading.set(false);
        addRecentSearch(p.displayName || name);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
