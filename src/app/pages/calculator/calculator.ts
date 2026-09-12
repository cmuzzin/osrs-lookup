import { Component, computed, signal } from '@angular/core';
import {
  MAX_SKILL_LEVEL,
  SKILL_ORDER,
  formatDuration,
  formatNumber,
  levelForXp,
  skillMeta,
  xpForLevel,
} from '../../core/format.util';
import { SKILL_TRAINING_METHODS, TrainingMethod } from '../../core/skill-training-methods';
import { MetricIcon } from '../../shared/metric-icon/metric-icon';
import { SortIcon } from '../../shared/sort-icon/sort-icon';
import { compareValues, createSortable } from '../../shared/sort-state';

interface MethodRow extends TrainingMethod {
  reachable: boolean;
  hoursToTarget: number;
}

type SortKey = 'name' | 'levelReq' | 'xpPerHour' | 'hoursToTarget';

// 'overall' has no single xp-to-level curve or training methods of its own.
const SKILLS = SKILL_ORDER.filter((k) => k !== 'overall');

/**
 * XP calculator: pick a skill, enter current/target level, and compare training
 * methods by time-to-goal. Only a couple of skills have real method data so far
 * (see skill-training-methods.ts) — the rest show as "coming soon" rather than
 * an empty table, since more are being added incrementally.
 */
@Component({
  selector: 'app-calculator',
  imports: [MetricIcon, SortIcon],
  templateUrl: './calculator.html',
  styleUrl: './calculator.scss',
})
export class Calculator {
  readonly skills = SKILLS.map((key) => skillMeta(key));
  readonly maxLevel = MAX_SKILL_LEVEL;

  readonly selectedSkill = signal<string>('woodcutting');
  readonly currentXp = signal<number>(0);
  readonly targetLevel = signal<number>(99);

  readonly currentLevel = computed(() => levelForXp(this.currentXp()));
  readonly targetXp = computed(() => xpForLevel(this.targetLevel()));
  readonly xpNeeded = computed(() => Math.max(0, this.targetXp() - this.currentXp()));

  readonly hasData = computed(() => this.isAvailable(this.selectedSkill()));

  private readonly sortable = createSortable<SortKey>({ key: 'xpPerHour', direction: 'desc' });
  readonly sort = this.sortable.sort;

  readonly rows = computed<MethodRow[]>(() => {
    const methods = SKILL_TRAINING_METHODS[this.selectedSkill()] ?? [];
    const level = this.currentLevel();
    const needed = this.xpNeeded();
    const rows = methods.map((m) => ({
      ...m,
      reachable: level >= m.levelReq,
      hoursToTarget: needed / m.xpPerHour,
    }));
    const { key, direction } = this.sort();
    return [...rows].sort((a, b) => compareValues(direction, a[key], b[key]));
  });

  readonly formatNumber = formatNumber;
  readonly formatDuration = formatDuration;

  isAvailable(key: string): boolean {
    return !!SKILL_TRAINING_METHODS[key];
  }

  selectSkill(key: string): void {
    if (!this.isAvailable(key)) return;
    this.selectedSkill.set(key);
  }

  setCurrentXp(value: string): void {
    const n = Number(value);
    this.currentXp.set(Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);
  }

  setCurrentLevel(value: string): void {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= this.maxLevel) {
      this.currentXp.set(xpForLevel(n));
    }
  }

  setTargetLevel(value: string): void {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= this.maxLevel) {
      this.targetLevel.set(n);
    }
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'name' ? 'asc' : 'desc');
  }
}
