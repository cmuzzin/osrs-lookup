import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MAX_SKILL_LEVEL,
  SKILL_ORDER,
  formatDuration,
  formatNumber,
  itemIconUrl,
  levelForXp,
  skillMeta,
  spriteIconUrl,
  wikiImageUrl,
  xpForLevel,
} from '../../core/format.util';
import { ActionItem, SKILL_ACTIONS, SkillAction } from '../../core/skill-actions';
import { WomApi } from '../../core/wom-api';
import { MetricIcon } from '../../shared/metric-icon/metric-icon';
import { SortIcon } from '../../shared/sort-icon/sort-icon';
import { compareValues, createSortable } from '../../shared/sort-state';

/** Action names can repeat across level requirements, so name alone is not a unique row id. */
export const actionKey = (a: { name: string; level: number }): string => `${a.name}|${a.level}`;

interface ActionRow extends SkillAction {
  key: string;
  iconUrl: string | null;
  reachable: boolean;
  /** Actions needed to reach the target. */
  quantity: number;
  /** Hours to reach the target — only where the action has an XP/hour rate. */
  hoursToTarget: number | null;
}

type SortKey = 'name' | 'level' | 'xp' | 'hoursToTarget' | 'quantity';

/** Whether a Current/Target box is being edited as a level or as a raw XP total. */
type InputMode = 'level' | 'xp';

type MembershipFilter = 'all' | 'f2p' | 'members';

/** Optional table columns, toggled from the "Columns" menu. Action and Quantity are always shown. */
type ColumnKey = 'xp' | 'time' | 'members' | 'inputs' | 'outputs';

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'xp', label: 'XP' },
  { key: 'time', label: 'Time' },
  { key: 'members', label: 'Members' },
  { key: 'inputs', label: 'Materials' },
  { key: 'outputs', label: 'Produces' },
];
const DEFAULT_COLUMNS: ColumnKey[] = ['xp', 'inputs', 'outputs'];
const COLUMNS_STORAGE_KEY = 'calculator.columns.v3';

// The in-game XP cap per skill.
const MAX_XP = 200_000_000;

// Reference points for the XP milestone table.
const MILESTONE_LEVELS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99];

/** "36.2 days (869 hrs)" style estimate, for the selected-actions panel. */
function formatDaysHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0 hrs';
  const days = hours / 24;
  const daysLabel = days >= 1 ? `${days.toFixed(1)} days ` : '';
  return `${daysLabel}(${formatNumber(Math.round(hours))} hrs)`;
}

function clampXp(xp: number): number {
  return Math.min(MAX_XP, Math.max(0, Math.floor(xp)));
}

/** "2 × Air rune, 1 × Mind rune" — quantities scaled by `times` (1 for per-action, quantity for totals). */
function formatItems(items: ActionItem[] | undefined, times = 1): string {
  if (!items?.length) return '—';
  return items.map((i) => `${formatNumber(i.quantity * times)} × ${i.name}`).join(', ');
}

// Only skills with per-action data are offered — see skill-actions.ts for why
// combat skills, Farming, and Sailing aren't in it.
const SKILLS = SKILL_ORDER.filter((k) => SKILL_ACTIONS[k]?.length);

/**
 * XP calculator, laid out like the 07.gg skill calculators: a skill list on the
 * side, Current/Target boxes that each take either a level or an XP total, and
 * one filterable table of every action for the skill with how many of it reach
 * the target. Optional columns (XP, time, members, materials) are
 * toggled from a "Columns" menu and remembered per browser; ticking rows opens
 * a breakdown of those actions, including total materials, below the table.
 *
 * State is mirrored into the URL (skill/from/to) so a configuration can be
 * shared via a link. "Lookup your account" pulls every skill's XP from a real
 * WOM lookup, so switching skills afterwards keeps Current XP in sync.
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
  readonly maxXp = MAX_XP;
  readonly columns = COLUMNS;
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
      this.targetXp.set(xpForLevel(initialTo));
    }

    if (this.isBrowser) {
      try {
        const saved = JSON.parse(localStorage.getItem(COLUMNS_STORAGE_KEY) ?? 'null');
        if (Array.isArray(saved)) {
          this.visibleColumns.set(new Set(saved.filter((k) => COLUMNS.some((c) => c.key === k))));
        }
      } catch {
        // Storage can be unavailable (private mode, blocked site data) — keep the defaults.
      }
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
  readonly targetXp = signal<number>(xpForLevel(MAX_SKILL_LEVEL));
  readonly currentMode = signal<InputMode>('level');
  readonly targetMode = signal<InputMode>('level');

  readonly filterText = signal<string>('');
  readonly membership = signal<MembershipFilter>('all');
  readonly showLocked = signal<boolean>(true);
  readonly visibleColumns = signal<Set<ColumnKey>>(new Set(DEFAULT_COLUMNS));
  readonly checkedKeys = signal<Set<string>>(new Set());

  readonly hiscoresUsername = signal<string>('');
  readonly hiscoresLoading = signal<boolean>(false);
  readonly hiscoresError = signal<string | null>(null);
  /** The looked-up player's name and XP per skill, so switching skills keeps Current XP in sync. */
  readonly lookedUp = signal<{ name: string; xp: Record<string, number> } | null>(null);

  readonly copied = signal<boolean>(false);

  readonly skill = computed(() => skillMeta(this.selectedSkill()));
  readonly currentLevel = computed(() => levelForXp(this.currentXp()));
  readonly targetLevel = computed(() => levelForXp(this.targetXp()));
  readonly xpNeeded = computed(() => Math.max(0, this.targetXp() - this.currentXp()));
  /** How far Current XP is toward Target XP, 0-100. */
  readonly progressPct = computed(() => {
    const target = this.targetXp();
    if (target <= 0) return 100;
    return Math.min(100, (this.currentXp() / target) * 100);
  });

  private readonly sortable = createSortable<SortKey>({ key: 'level', direction: 'asc' });
  readonly sort = this.sortable.sort;

  /** Every action for the selected skill, with reachability/quantity/time attached — unfiltered. */
  private readonly allRows = computed<ActionRow[]>(() => {
    const actions = SKILL_ACTIONS[this.selectedSkill()] ?? [];
    const level = this.currentLevel();
    const needed = this.xpNeeded();
    return actions.map((a) => ({
      ...a,
      key: actionKey(a),
      iconUrl: a.icon
        ? itemIconUrl(a.icon)
        : a.sprite
          ? spriteIconUrl(a.sprite)
          : a.image
            ? wikiImageUrl(a.image)
            : null,
      reachable: level >= a.level,
      quantity: Math.ceil(needed / a.xp),
      hoursToTarget: a.xpPerHour ? needed / a.xpPerHour : null,
    }));
  });

  /** Table view: text-filtered, membership-filtered, locked-hidden-if-toggled, sorted. */
  readonly rows = computed<ActionRow[]>(() => {
    const query = this.filterText().trim().toLowerCase();
    const membership = this.membership();
    const showLocked = this.showLocked();
    let rows = this.allRows();
    if (query) {
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(query) || r.inputs?.some((i) => i.name.toLowerCase().includes(query)),
      );
    }
    if (membership !== 'all') {
      rows = rows.filter((r) => !!r.members === (membership === 'members'));
    }
    if (!showLocked) {
      rows = rows.filter((r) => r.reachable);
    }
    const { key, direction } = this.sort();
    return [...rows].sort(
      (a, b) => compareValues(direction, a[key] ?? -1, b[key] ?? -1) || a.name.localeCompare(b.name),
    );
  });

  /** Ticked actions, in level order, for the breakdown panel. */
  readonly checkedRows = computed<ActionRow[]>(() => {
    const keys = this.checkedKeys();
    return this.allRows().filter((r) => keys.has(r.key));
  });

  readonly allVisibleChecked = computed(() => {
    const rows = this.rows();
    const keys = this.checkedKeys();
    return rows.length > 0 && rows.every((r) => keys.has(r.key));
  });

  readonly formatNumber = formatNumber;
  readonly formatDuration = formatDuration;
  readonly formatDaysHours = formatDaysHours;
  readonly formatItems = formatItems;

  selectSkill(key: string): void {
    this.selectedSkill.set(key);
    this.checkedKeys.set(new Set());
    this.filterText.set('');
    const xp = this.lookedUp()?.xp[key];
    if (xp !== undefined) {
      this.currentXp.set(xp);
    }
  }

  setCurrentMode(mode: InputMode): void {
    this.currentMode.set(mode);
  }

  setTargetMode(mode: InputMode): void {
    this.targetMode.set(mode);
  }

  setCurrentXp(value: string): void {
    const n = Number(value);
    this.currentXp.set(Number.isFinite(n) ? clampXp(n) : 0);
  }

  setCurrentLevel(value: string): void {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= this.maxLevel) {
      this.currentXp.set(xpForLevel(n));
    }
  }

  setTargetXp(value: string): void {
    const n = Number(value);
    this.targetXp.set(Number.isFinite(n) ? clampXp(n) : 0);
  }

  setTargetLevel(value: string): void {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= this.maxLevel) {
      this.targetXp.set(xpForLevel(n));
    }
  }

  /** Back to defaults — current XP 0, target level 99. Leaves the selected skill as-is. */
  reset(): void {
    this.currentXp.set(0);
    this.targetXp.set(xpForLevel(this.maxLevel));
    this.checkedKeys.set(new Set());
  }

  setFilterText(value: string): void {
    this.filterText.set(value);
  }

  setMembership(value: MembershipFilter): void {
    this.membership.set(value);
  }

  toggleSort(key: SortKey): void {
    this.sortable.toggleSort(key, key === 'name' || key === 'level' ? 'asc' : 'desc');
  }

  toggleShowLocked(): void {
    this.showLocked.update((v) => !v);
  }

  isColumnVisible(key: ColumnKey): boolean {
    return this.visibleColumns().has(key);
  }

  toggleColumn(key: ColumnKey): void {
    const next = new Set(this.visibleColumns());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.visibleColumns.set(next);
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // Non-essential preference — fine to lose it if storage is blocked.
    }
  }

  toggleChecked(key: string): void {
    const next = new Set(this.checkedKeys());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.checkedKeys.set(next);
  }

  /** Header checkbox: tick every visible row, or clear them all if they're already ticked. */
  toggleAllChecked(): void {
    const next = new Set(this.checkedKeys());
    const keys = this.rows().map((r) => r.key);
    if (this.allVisibleChecked()) {
      keys.forEach((k) => next.delete(k));
    } else {
      keys.forEach((k) => next.add(k));
    }
    this.checkedKeys.set(next);
  }

  clearChecked(): void {
    this.checkedKeys.set(new Set());
  }

  setHiscoresUsername(value: string): void {
    this.hiscoresUsername.set(value);
  }

  /** Pulls every skill's XP from a real Wise Old Man lookup and fills Current XP for the selected skill. */
  importFromHiscores(): void {
    const username = this.hiscoresUsername().trim();
    if (!username) return;
    this.hiscoresLoading.set(true);
    this.hiscoresError.set(null);
    this.womApi.trackPlayer(username).subscribe({
      next: (player) => {
        this.hiscoresLoading.set(false);
        const skills = player.latestSnapshot?.data.skills;
        if (!skills) {
          this.hiscoresError.set('No hiscores data found for that player.');
          return;
        }
        const xp: Record<string, number> = {};
        for (const [key, data] of Object.entries(skills)) {
          if (data.experience >= 0) xp[key] = data.experience;
        }
        this.lookedUp.set({ name: player.displayName, xp });
        const current = xp[this.selectedSkill()];
        if (current === undefined) {
          this.hiscoresError.set(`${player.displayName} isn't ranked in ${this.skill().label}.`);
          return;
        }
        this.currentXp.set(current);
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
