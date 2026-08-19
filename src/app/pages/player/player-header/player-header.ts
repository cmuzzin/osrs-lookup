import { Component, computed, input } from '@angular/core';
import { Player } from '../../../core/wom.models';
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
  readonly player = input.required<Player>();

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
}
