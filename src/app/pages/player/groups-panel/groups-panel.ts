import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WomApi } from '../../../core/wom-api';
import { GroupMembership } from '../../../core/wom.models';
import { formatNumber, titleCase } from '../../../core/format.util';

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
    this.wom.getGroups(username).subscribe({
      next: (groups) => {
        this.groups.set([...groups].sort((a, b) => b.group.score - a.group.score));
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
