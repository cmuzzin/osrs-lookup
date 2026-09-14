import { Component, computed, inject, signal } from '@angular/core';
import { RuneProfileApi, RUNEPROFILE_NOT_LINKED_MESSAGE } from '../../core/runeprofile-api';
import { Activity } from '../../core/runeprofile.models';
import { SKILL_ORDER, formatNumber, formatRelativeTime, itemIconUrl, metricIcon, skillMeta } from '../../core/format.util';
import { MetricIcon } from '../../shared/metric-icon/metric-icon';

interface FilterOption {
  value: string;
  label: string;
  /** Server-side activityTypes to request; omitted for "All". */
  apiTypes?: string[];
}

const FILTERS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'level_up', label: 'Levels', apiTypes: ['level_up'] },
  { value: 'new_item_obtained', label: 'Items', apiTypes: ['new_item_obtained'] },
  { value: 'valuable_drop', label: 'Valuable Drops', apiTypes: ['valuable_drop'] },
  { value: 'quest_completed', label: 'Quests', apiTypes: ['quest_completed'] },
  { value: 'diary', label: 'Diaries', apiTypes: ['achievement_diary_tier_completed'] },
  {
    value: 'combat_achievements',
    label: 'Combat Achievements',
    apiTypes: ['combat_achievement_tier_completed', 'combat_achievement_tier_reached', 'combat_achievement_task_completed'],
  },
  { value: 'xp_milestone', label: 'Milestones', apiTypes: ['xp_milestone'] },
  { value: 'maxed', label: 'Maxed', apiTypes: ['maxed'] },
];

const DIARY_TIER_NAMES = ['Easy', 'Medium', 'Hard', 'Elite'];

// A handful of skill names RuneProfile/the game itself uses that don't match
// this app's own SKILL_ORDER keys (kept for WOM compatibility elsewhere).
const SKILL_KEY_ALIASES: Record<string, string> = { runecraft: 'runecrafting' };

function skillKey(name: string): string {
  const key = name.toLowerCase();
  return SKILL_KEY_ALIASES[key] ?? key;
}

/** A real skill icon when we recognize the name, a generic star otherwise (never a broken image). */
function skillIcon(name: string): string {
  const key = skillKey(name);
  return SKILL_ORDER.includes(key) ? metricIcon(key) : '⭐';
}

function skillLabel(name: string): string {
  return skillMeta(skillKey(name)).label;
}

interface ActivityDescription {
  icon: string;
  text: string;
}

/**
 * Turns one activity into an icon + one-line description. Not a strict
 * per-type mapping off the API's own published schema — the live API returns
 * more `type` values in practice (e.g. combat_achievement_task_completed)
 * than that schema enumerates, so anything unrecognized still renders
 * reasonably via the generic fallback rather than being dropped.
 */
export function describeActivity(activity: Activity): ActivityDescription {
  const d = activity.data;
  const e = activity.enriched ?? {};

  switch (activity.type) {
    case 'level_up': {
      const name = String(d['name'] ?? '');
      return { icon: skillIcon(name), text: `Reached level ${d['level']} ${skillLabel(name)}` };
    }
    case 'xp_milestone': {
      const name = String(d['name'] ?? '');
      return { icon: skillIcon(name), text: `Reached ${formatNumber(Number(d['xp']))} XP in ${skillLabel(name)}` };
    }
    case 'new_item_obtained':
      return { icon: itemIconUrl(Number(d['itemId'])), text: `Obtained ${e['itemName'] ?? 'a new item'}` };
    case 'valuable_drop':
      return {
        icon: itemIconUrl(Number(d['itemId'])),
        text: `Received ${e['itemName'] ?? 'a valuable drop'} worth ${formatNumber(Number(d['value']))} gp`,
      };
    case 'quest_completed':
      return { icon: '📜', text: `Completed ${e['questName'] ?? 'a quest'}` };
    case 'achievement_diary_tier_completed': {
      const tier = e['tierName'] ?? DIARY_TIER_NAMES[Number(d['tier'])] ?? '';
      const area = e['areaName'];
      return { icon: '📖', text: area ? `Completed the ${tier} ${area} diary` : `Completed a ${tier} diary tier`.trim() };
    }
    case 'combat_achievement_tier_completed':
    case 'combat_achievement_tier_reached':
      return { icon: '⚔️', text: `Reached the ${e['tierName'] ?? ''} combat achievement tier`.replace('  ', ' ').trim() };
    case 'combat_achievement_task_completed':
      return {
        icon: '⚔️',
        text: e['taskName']
          ? `Completed "${e['taskName']}"${e['tierName'] ? ` (${e['tierName']})` : ''}`
          : 'Completed a combat achievement task',
      };
    case 'maxed':
      return { icon: '🏆', text: 'Achieved max level in all skills!' };
    default:
      return { icon: '📌', text: humanizeType(activity.type) };
  }
}

function humanizeType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * A player's recent activity, sourced from RuneProfile (a separate, opt-in
 * tracking service — most WOM-tracked players won't have an account there).
 * Own page rather than a player-page panel, since it's paginated and has its
 * own type filters rather than fitting a compact summary card.
 */
@Component({
  selector: 'app-activity-feed',
  imports: [MetricIcon],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.scss',
})
export class ActivityFeedPage {
  private readonly runeProfile = inject(RuneProfileApi);

  readonly filters = FILTERS;
  readonly filter = signal<string>('all');

  readonly rsnInput = signal('');
  readonly rsn = signal<string | null>(null);

  readonly activities = signal<Activity[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);

  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly notLinked = computed(() => this.error() === RUNEPROFILE_NOT_LINKED_MESSAGE);

  readonly rows = computed(() => this.activities().map((a) => ({ activity: a, ...describeActivity(a) })));

  readonly formatRelativeTime = formatRelativeTime;

  setRsnInput(value: string): void {
    this.rsnInput.set(value);
  }

  search(): void {
    const name = this.rsnInput().trim();
    if (!name) return;
    this.rsn.set(name);
    this.fetch(name, true);
  }

  setFilter(value: string): void {
    if (this.filter() === value) return;
    this.filter.set(value);
    const name = this.rsn();
    if (name) this.fetch(name, true);
  }

  loadMore(): void {
    const name = this.rsn();
    const cursor = this.nextCursor();
    if (!name || !cursor) return;
    this.fetch(name, false, cursor);
  }

  retry(): void {
    const name = this.rsn();
    if (name) this.fetch(name, true);
  }

  private fetch(rsn: string, reset: boolean, cursor?: string): void {
    if (reset) {
      this.loading.set(true);
      this.activities.set([]);
      this.nextCursor.set(null);
    } else {
      this.loadingMore.set(true);
    }
    this.error.set(null);

    const activeFilter = FILTERS.find((f) => f.value === this.filter());
    this.runeProfile.getActivities(rsn, { limit: 20, cursor, activityTypes: activeFilter?.apiTypes }).subscribe({
      next: (res) => {
        this.activities.update((list) => (reset ? res.activities : [...list, ...res.activities]));
        this.nextCursor.set(res.nextCursor);
        this.hasMore.set(res.hasMore);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }
}
