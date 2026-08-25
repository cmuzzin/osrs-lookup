import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { Player, PlayerNameChange } from '../../../core/wom.models';
import {
  SKILL_ORDER,
  formatDate,
  formatNumber,
  formatRelativeTime,
  playerBuildLabel,
  playerTypeLabel,
} from '../../../core/format.util';

@Component({
  selector: 'app-player-header',
  templateUrl: './player-header.html',
  styleUrl: './player-header.scss',
})
export class PlayerHeader {
  private readonly wom = inject(WomApi);

  readonly player = input.required<Player>();

  readonly nameChanges = signal<PlayerNameChange[]>([]);
  readonly showNameHistory = signal(false);

  // Only 'approved' changes are confirmed history — pending/denied requests aren't real.
  readonly approvedNameChanges = computed(() =>
    [...this.nameChanges()]
      .filter((c) => c.status === 'approved')
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  );

  readonly typeLabel = computed(() => playerTypeLabel(this.player().type));
  readonly buildLabel = computed(() => playerBuildLabel(this.player().build));
  readonly overallRank = computed(
    () => this.player().latestSnapshot?.data.skills['overall']?.rank ?? -1,
  );

  readonly totalSkillCount = SKILL_ORDER.length - 1; // exclude 'overall'

  readonly maxedSkillCount = computed(() => {
    const skills = this.player().latestSnapshot?.data.skills;
    if (!skills) return 0;
    return Object.entries(skills).filter(([key, s]) => key !== 'overall' && s.level >= 99).length;
  });

  // WOM uses -1 as a "not ranked / no data" sentinel for kills, same as it does for rank.
  readonly totalBossKills = computed(() => {
    const bosses = this.player().latestSnapshot?.data.bosses;
    if (!bosses) return 0;
    return Object.values(bosses).reduce((sum, b) => sum + Math.max(0, b.kills), 0);
  });

  readonly formatNumber = formatNumber;
  readonly formatDate = formatDate;
  readonly formatRelativeTime = formatRelativeTime;

  constructor() {
    effect(() => {
      const username = this.player().username;
      if (!username) return;
      this.wom.getNameChanges(username).subscribe({
        next: (changes) => this.nameChanges.set(changes),
        // Name history is a minor supplementary detail — fail silently rather
        // than surface an error for something this non-essential.
        error: () => this.nameChanges.set([]),
      });
    });
  }

  toggleNameHistory(): void {
    this.showNameHistory.update((v) => !v);
  }
}
