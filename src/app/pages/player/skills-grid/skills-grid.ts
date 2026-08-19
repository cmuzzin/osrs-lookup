import { Component, computed, input } from '@angular/core';
import { SkillValue } from '../../../core/wom.models';
import { SKILL_ORDER, formatNumber, formatRank, skillMeta } from '../../../core/format.util';

interface SkillTile {
  key: string;
  label: string;
  icon: string;
  level: number;
  experience: number;
  rank: number;
}

@Component({
  selector: 'app-skills-grid',
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
      return {
        key,
        label: meta.label,
        icon: meta.icon,
        level: value.level ?? 1,
        experience: value.experience ?? 0,
        rank: value.rank ?? -1,
      };
    });
  });

  readonly formatNumber = formatNumber;
  readonly formatRank = formatRank;
}
