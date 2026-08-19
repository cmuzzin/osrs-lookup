import { Component, computed, input } from '@angular/core';
import { Player } from '../../../core/wom.models';
import {
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

  readonly formatNumber = formatNumber;
  readonly formatDate = formatDate;
  readonly formatRelativeTime = formatRelativeTime;
}
