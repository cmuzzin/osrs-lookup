import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MAX_SKILL_LEVEL,
  SKILL_ORDER,
  formatDuration,
  formatNumber,
  levelForXp,
  skillMeta,
  xpForLevel,
} from '../../core/format.util';
import { MethodTag, SKILL_TRAINING_METHODS, TrainingMethod } from '../../core/skill-training-methods';
import { WomApi } from '../../core/wom-api';
import { MetricIcon } from '../../shared/metric-icon/metric-icon';
import { SortIcon } from '../../shared/sort-icon/sort-icon';
import { compareValues, createSortable } from '../../shared/sort-state';

interface MethodRow extends TrainingMethod {
  reachable: boolean;
  hoursToTarget: number;
}

type SortKey = 'name' | 'levelReq' | 'xpPerAction' | 'xpPerHour' | 'hoursToTarget';

const ALL_TAGS: MethodTag[] = ['afk', 'profit', 'clicky', 'buyable', 'passive'];
const TAG_LABELS: Record<MethodTag, string> = {
  afk: 'AFK',
  profit: 'Profit',
  clicky: 'Clicky',
  buyable: 'Buyable',
  passive: 'Passive',
};

// Reference points for the XP milestone table.
const MILESTONE_LEVELS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99];

/** "36.2 days (869 hrs)" style estimate, for the selected-method results panel. */
function formatDaysHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0 hrs';
  const days = hours / 24;
  const daysLabel = days >= 1 ? `${days.toFixed(1)} days ` : '';
  return `${daysLabel}(${formatNumber(Math.round(hours))} hrs)`;
}

// 'overall' has no single xp-to-level curve or training methods of its own.
// Combat skills (+ Hitpoints) are left out entirely: combat XP comes from
// whatever you're fighting and is usually trained together across several of
// them at once, so "pick a training method for just Attack" isn't a
// meaningful question the way it is for a skilling skill. Magic keeps its own
// entry — it has real standalone training spells independent of combat.
const EXCLUDED_SKILLS = new Set(['overall', 'attack', 'strength', 'defence', 'ranged', 'hitpoints', 'slayer']);
const SKILLS = SKILL_ORDER.filter((k) => !EXCLUDED_SKILLS.has(k));

/**
 * XP calculator: pick a skill, enter current/target level, and compare training
 * methods by time-to-goal, tags, XP/action, and materials needed. Every skill
 * offered here has real method data (see skill-training-methods.ts). State is
 * mirrored into the URL (skill/from/to) so a configuration can be shared via a
 * link, and "Import from hiscores" prefills current XP from a real WOM lookup.
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
  readonly allTags = ALL_TAGS;
  readonly tagLabels = TAG_LABELS;
  readonly milestones = MILESTONE_LEVELS.map((level) => ({ level, xp: xpForLevel(level) }));

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly womApi: WomApi,
  ) {
    const params = this.activatedRoute.snapshot.queryParamMap;
    const initialSkill = params.get('skill');
    const initialFrom = Number(params.get('from'));
    const initialTo = Number(params.get('to'));

    if (initialSkill && SKILLS.includes(initialSkill)) {
      this.selectedSkill.set(initialSkill);
    }
    if (Number.isFinite(initialFrom) && initialFrom >= 1 && initialFrom <= MAX_SKILL_LEVEL) {
      this.currentXp.set(xpForLevel(initialFrom));
    }
    if (Number.isFinite(initialTo) && initialTo >= 1 && initialTo <= MAX_SKILL_LEVEL) {
      this.targetLevel.set(initialTo);
    }

    // Keep the URL in sync with the current selection so it can be shared as a link.
    // Skipped while prerendering, where a navigation would bake a redirect page into the output.
    effect(() => {
      const skill = this.selectedSkill();
      const from = this.currentLevel();
      const to = this.targetLevel();
      if (!this.isBrowser) return;
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { skill, from, to },
        replaceUrl: true,
      });
    });
  }

  readonly selectedSkill = signal<string>('woodcutting');
  readonly currentXp = signal<number>(0);
  readonly targetLevel = signal<number>(99);
  readonly activeTags = signal<Set<MethodTag>>(new Set());
  readonly showLocked = signal<boolean>(true);
  readonly selectedMethodName = signal<string | null>(null);

  readonly hiscoresUsername = signal<string>('');
  readonly hiscoresLoading = signal<boolean>(false);
  readonly hiscoresError = signal<string | null>(null);

  readonly copied = signal<boolean>(false);

  readonly currentLevel = computed(() => levelForXp(this.currentXp()));
  readonly targetXp = computed(() => xpForLevel(this.targetLevel()));
  readonly xpNeeded = computed(() => Math.max(0, this.targetXp() - this.currentXp()));

  private readonly sortable = createSortable<SortKey>({ key: 'xpPerHour', direction: 'desc' });
  readonly sort = this.sortable.sort;

  /** Every method for the selected skill, with reachability/time-to-goal attached — unfiltered by tags. */
  private readonly allRows = computed<MethodRow[]>(() => {
    const methods = SKILL_TRAINING_METHODS[this.selectedSkill()] ?? [];
    const level = this.currentLevel();
    const needed = this.xpNeeded();
    return methods.map((m) => ({
      ...m,
      reachable: level >= m.levelReq,
      hoursToTarget: needed / m.xpPerHour,
    }));
  });

  /** Table view: tag-filtered, locked-hidden-if-toggled, sorted. */
  readonly rows = computed<MethodRow[]>(() => {
    const tags = this.activeTags();
    const showLocked = this.showLocked();
    let rows = this.allRows();
    if (tags.size > 0) {
      rows = rows.filter((r) => [...tags].every((t) => r.tags?.includes(t)));
    }
    if (!showLocked) {
      rows = rows.filter((r) => r.reachable);
    }
    const { key, direction } = this.sort();
    return [...rows].sort((a, b) => compareValues(direction, a[key] ?? -1, b[key] ?? -1));
  });

  readonly selectedMethod = computed<MethodRow | null>(() => {
    const name = this.selectedMethodName();
    if (!name) return null;
    return this.allRows().find((r) => r.name === name) ?? null;
  });

  readonly actionsNeeded = computed<number | null>(() => {
    const method = this.selectedMethod();
    if (!method?.xpPerAction) return null;
    return Math.ceil(this.xpNeeded() / method.xpPerAction);
  });

  readonly formatNumber = formatNumber;
  readonly formatDuration = formatDuration;
  readonly formatDaysHours = formatDaysHours;

  selectSkill(key: string): void {
    this.selectedSkill.set(key);
    this.selectedMethodName.set(null);
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

  /** Back to defaults — current XP 0, target level 99. Leaves the selected skill as-is. */
  reset(): void {
    this.currentXp.set(0);
    this.targetLevel.set(this.maxLevel);
    this.selectedMethodName.set(null);
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'name' ? 'asc' : 'desc');
  }

  toggleTag(tag: MethodTag): void {
    const next = new Set(this.activeTags());
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    this.activeTags.set(next);
  }

  toggleShowLocked(): void {
    this.showLocked.update((v) => !v);
  }

  selectMethod(name: string): void {
    this.selectedMethodName.set(this.selectedMethodName() === name ? null : name);
  }

  setHiscoresUsername(value: string): void {
    this.hiscoresUsername.set(value);
  }

  /** Prefills Current XP for the selected skill from a real Wise Old Man hiscores lookup. */
  importFromHiscores(): void {
    const username = this.hiscoresUsername().trim();
    if (!username) return;
    this.hiscoresLoading.set(true);
    this.hiscoresError.set(null);
    this.womApi.trackPlayer(username).subscribe({
      next: (player) => {
        this.hiscoresLoading.set(false);
        const skillData = player.latestSnapshot?.data.skills[this.selectedSkill()];
        if (!skillData || skillData.experience < 0) {
          this.hiscoresError.set(`No ${skillMeta(this.selectedSkill()).label} data found for that player.`);
          return;
        }
        this.currentXp.set(skillData.experience);
      },
      error: (err: Error) => {
        this.hiscoresLoading.set(false);
        this.hiscoresError.set(err.message);
      },
    });
  }

  /** Copies the current shareable URL (skill/from/to already synced into it) to the clipboard. */
  async share(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser — silently ignore, the
      // URL is already correct and shareable by hand from the address bar.
    }
  }
}
