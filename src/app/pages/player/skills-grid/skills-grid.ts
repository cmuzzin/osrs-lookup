import { Component, computed, input } from '@angular/core';
import { SkillValue } from '../../../core/wom.models';
import {
  SKILL_ORDER,
  LevelProgress,
  formatNumber,
  formatRank,
  levelProgress,
  skillMeta,
} from '../../../core/format.util';
import { MetricIcon } from '../../../shared/metric-icon/metric-icon';

interface SkillTile {
  key: string;
  label: string;
  icon: string;
  level: number;
  experience: number;
  rank: number;
  /** Omitted for 'overall', which doesn't have a single 1-99 xp curve to progress along. */
  progress: LevelProgress | null;
}

@Component({
  selector: 'app-skills-grid',
  imports: [MetricIcon],
  templateUrl: './skills-grid.html',
  styleUrl: './skills-grid.scss',
})
export class SkillsGrid {
  readonly skills = input.required<Record<string, SkillValue>>();

  readonly tiles = computed<SkillTile[]>(() => {
    const data = this.skills();
    return SKILL_ORDER.filter((key) => data[key]).map((key) => {
      const meta = skillMeta(key);
      const value = data[key];
      const level = value.level ?? 1;
      const experience = value.experience ?? 0;
      return {
        key,
        label: meta.label,
        icon: meta.icon,
        level,
        experience,
        rank: value.rank ?? -1,
        progress: key === 'overall' ? null : levelProgress(experience, level),
      };
    });
  });

  readonly formatNumber = formatNumber;
  readonly formatRank = formatRank;
}
