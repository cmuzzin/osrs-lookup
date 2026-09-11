import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WomApi } from '../../../core/wom-api';
import { GroupMembership } from '../../../core/wom.models';
import { ClanRankProgress, clanRankProgress, formatNumber, titleCase } from '../../../core/format.util';

/** WOM-tracked clans/groups this player belongs to. Clan names link to their clan page. */
@Component({
  selector: 'app-groups-panel',
  imports: [RouterLink],
  templateUrl: './groups-panel.html',
  styleUrl: './groups-panel.scss',
})
export class GroupsPanel {
  private readonly wom = inject(WomApi);

  readonly username = input.required<string>();

  readonly groups = signal<GroupMembership[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Keyed by groupId. Undefined = still loading, null = unavailable (e.g. role not in the hierarchy). */
  readonly rankProgress = signal<Record<number, ClanRankProgress | null | undefined>>({});

  readonly formatNumber = formatNumber;
  readonly titleCase = titleCase;

  constructor() {
    effect(() => {
      const name = this.username();
      if (!name) return;
      this.fetch(name);
    });
  }

  private fetch(username: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.rankProgress.set({});
    this.wom.getGroups(username).subscribe({
      next: (groups) => {
        const sorted = [...groups].sort((a, b) => b.group.score - a.group.score);
        this.groups.set(sorted);
        this.loading.set(false);
        for (const m of sorted) this.fetchRankProgress(m);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  /** Fetches the clan's own role hierarchy so we can place this membership's role within it. */
  private fetchRankProgress(membership: GroupMembership): void {
    this.wom.getGroup(membership.groupId).subscribe({
      next: (detail) => {
        const progress = clanRankProgress(detail.roleOrders, membership.role);
        this.rankProgress.update((r) => ({ ...r, [membership.groupId]: progress }));
      },
      error: () => {
        this.rankProgress.update((r) => ({ ...r, [membership.groupId]: null }));
      },
    });
  }
}
