import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchBar } from '../../shared/search-bar/search-bar';
import { ClanHeader } from './clan-header/clan-header';
import { ClanStats } from './clan-stats/clan-stats';
import { ClanLeaderboard } from './clan-leaderboard/clan-leaderboard';
import { ClanGainers } from './clan-gainers/clan-gainers';
import { WomApi } from '../../core/wom-api';
import { GroupDetail } from '../../core/wom.models';

@Component({
  selector: 'app-clan-page',
  imports: [RouterLink, SearchBar, ClanHeader, ClanStats, ClanLeaderboard, ClanGainers],
  templateUrl: './clan.html',
})
export class ClanPage {
  private readonly wom = inject(WomApi);

  // Bound automatically from the :clanId route param via withComponentInputBinding().
  readonly clanId = input<string>('');

  readonly numericId = computed<number | null>(() => {
    const n = Number(this.clanId());
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  readonly group = signal<GroupDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.numericId();
      if (id === null) {
        this.error.set('That is not a valid clan link.');
        this.group.set(null);
        this.loading.set(false);
        return;
      }
      this.fetchGroup(id);
    });
  }

  retry(): void {
    const id = this.numericId();
    if (id !== null) this.fetchGroup(id);
  }

  private fetchGroup(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.group.set(null);
    this.wom.getGroup(id).subscribe({
      next: (g) => {
        this.group.set(g);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
