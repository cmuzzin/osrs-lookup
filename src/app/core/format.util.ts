// Presentation helpers: canonical skill order/metadata, number & label formatting.

import { SnapshotData } from './wom.models';

export interface SkillMeta {
  key: string;
  label: string;
  icon: string;
}

// Order matches the official OSRS hiscores layout (3 columns x 8 rows, Overall first).
export const SKILL_ORDER: readonly string[] = [
  'overall',
  'attack',
  'defence',
  'strength',
  'hitpoints',
  'ranged',
  'prayer',
  'magic',
  'cooking',
  'woodcutting',
  'fletching',
  'fishing',
  'firemaking',
  'crafting',
  'smithing',
  'mining',
  'herblore',
  'agility',
  'thieving',
  'slayer',
  'farming',
  'runecrafting',
  'hunter',
  'construction',
  'sailing',
];

const SKILL_LABELS: Record<string, string> = {
  overall: 'Overall',
  attack: 'Attack',
  defence: 'Defence',
  strength: 'Strength',
  hitpoints: 'Hitpoints',
  ranged: 'Ranged',
  prayer: 'Prayer',
  magic: 'Magic',
  cooking: 'Cooking',
  woodcutting: 'Woodcutting',
  fletching: 'Fletching',
  fishing: 'Fishing',
  firemaking: 'Firemaking',
  crafting: 'Crafting',
  smithing: 'Smithing',
  mining: 'Mining',
  herblore: 'Herblore',
  agility: 'Agility',
  thieving: 'Thieving',
  slayer: 'Slayer',
  farming: 'Farming',
  runecrafting: 'Runecraft',
  hunter: 'Hunter',
  construction: 'Construction',
  sailing: 'Sailing',
};

const SKILL_ICONS: Record<string, string> = {
  overall: '⭐',
  attack: '⚔️',
  defence: '🛡️',
  strength: '💪',
  hitpoints: '❤️',
  ranged: '🏹',
  prayer: '✨',
  magic: '🔮',
  cooking: '🍳',
  woodcutting: '🪓',
  fletching: '🪶',
  fishing: '🎣',
  firemaking: '🔥',
  crafting: '🧵',
  smithing: '🔨',
  mining: '⛏️',
  herblore: '🧪',
  agility: '🤸',
  thieving: '🕵️',
  slayer: '💀',
  farming: '🌾',
  runecrafting: '🌀',
  hunter: '🐾',
  construction: '🏠',
  sailing: '⛵',
};

export function skillMeta(key: string): SkillMeta {
  return {
    key,
    label: SKILL_LABELS[key] ?? titleCase(key),
    icon: SKILL_ICONS[key] ?? '📊',
  };
}

// Real per-boss sprites (sourced from Wise Old Man's own icon set, so the filenames
// already match WOM's boss metric keys exactly) rather than one generic emoji for
// every boss. `app-metric-icon` renders any icon string starting with '/' as an <img>.
export function bossIconPath(metric: string): string {
  return `/img/bosses/${metric}.png`;
}

// A handful of boss/activity names don't title-case cleanly from their snake_case
// metric keys. Everything else falls back to generic title-casing.
const METRIC_NAME_OVERRIDES: Record<string, string> = {
  chambers_of_xeric: 'Chambers of Xeric',
  chambers_of_xeric_challenge_mode: 'Chambers of Xeric (CM)',
  theatre_of_blood: 'Theatre of Blood',
  theatre_of_blood_hard_mode: 'Theatre of Blood (HM)',
  tombs_of_amascut: 'Tombs of Amascut',
  tombs_of_amascut_expert: 'Tombs of Amascut (Expert)',
  tzkal_zuk: 'TzKal-Zuk',
  tztok_jad: 'TzTok-Jad',
  kril_tsutsaroth: "K'ril Tsutsaroth",
  kreearra: "Kree'Arra",
  vetion: "Vet'ion",
  phosanis_nightmare: "Phosani's Nightmare",
  doom_of_mokhaiotl: 'Doom of Mokhaiotl',
  the_corrupted_gauntlet: 'Corrupted Gauntlet',
  the_gauntlet: 'The Gauntlet',
  the_hueycoatl: 'The Hueycoatl',
  the_leviathan: 'The Leviathan',
  the_royal_titans: 'The Royal Titans',
  the_whisperer: 'The Whisperer',
  kalphite_queen: 'Kalphite Queen',
  king_black_dragon: 'King Black Dragon',
  giant_mole: 'Giant Mole',
  dagannoth_prime: 'Dagannoth Prime',
  dagannoth_rex: 'Dagannoth Rex',
  dagannoth_supreme: 'Dagannoth Supreme',
  clue_scrolls_all: 'Clue Scrolls (All)',
  clue_scrolls_beginner: 'Clue Scrolls (Beginner)',
  clue_scrolls_easy: 'Clue Scrolls (Easy)',
  clue_scrolls_medium: 'Clue Scrolls (Medium)',
  clue_scrolls_hard: 'Clue Scrolls (Hard)',
  clue_scrolls_elite: 'Clue Scrolls (Elite)',
  clue_scrolls_master: 'Clue Scrolls (Master)',
  bounty_hunter_hunter: 'Bounty Hunter (Hunter)',
  bounty_hunter_rogue: 'Bounty Hunter (Rogue)',
  bounty_hunter_legacy_hunter: 'Bounty Hunter Legacy (Hunter)',
  bounty_hunter_legacy_rogue: 'Bounty Hunter Legacy (Rogue)',
  last_man_standing: 'Last Man Standing',
  pvp_arena: 'PvP Arena',
  soul_wars_zeal: 'Soul Wars Zeal',
  guardians_of_the_rift: 'Guardians of the Rift',
  colosseum_glory: 'Colosseum Glory',
  collections_logged: 'Collections Logged',
  league_points: 'League Points',
};

export function titleCase(snake: string): string {
  return snake
    .split('_')
    .map((word) => (word.length ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export function metricLabel(key: string): string {
  return METRIC_NAME_OVERRIDES[key] ?? titleCase(key);
}

/**
 * Icon + label for an arbitrary metric key (skill, boss, activity, or computed),
 * disambiguated using a player's own snapshot data since the key alone doesn't
 * say which category it belongs to (e.g. records/achievements only give the key).
 */
export function classifyMetric(metric: string, data: SnapshotData): { icon: string; label: string } {
  if (metric in data.skills) {
    const meta = skillMeta(metric);
    return { icon: meta.icon, label: meta.label };
  }
  if (metric in data.bosses) return { icon: bossIconPath(metric), label: metricLabel(metric) };
  if (metric in data.activities) return { icon: '🏆', label: metricLabel(metric) };
  if (metric === 'ehp' || metric === 'ehb') return { icon: '⚡', label: metric.toUpperCase() };
  return { icon: '📊', label: metricLabel(metric) };
}

// The classic RuneScape XP curve: xp needed for `level` is the sum, over every level
// below it, of floor(level + 300 * 2^(level/7)), divided by 4 and floored. Levels are
// cheap enough (max 99) to just sum directly rather than keep a static lookup table.
export const MAX_SKILL_LEVEL = 99;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let points = 0;
  for (let lvl = 1; lvl < level; lvl++) {
    points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
  }
  return Math.floor(points / 4);
}

export interface LevelProgress {
  /** 0-100, how far into the current level the player's xp is. */
  progressPct: number;
  /** XP still needed to reach the next level; 0 once maxed. */
  xpToNextLevel: number;
  isMaxed: boolean;
}

/** Progress toward the next level, for a skill's current level + xp (both as reported by WOM). */
export function levelProgress(experience: number, level: number): LevelProgress {
  const xp = Math.max(0, experience ?? 0);
  const lvl = Math.max(1, Math.min(level ?? 1, MAX_SKILL_LEVEL));
  if (lvl >= MAX_SKILL_LEVEL) {
    return { progressPct: 100, xpToNextLevel: 0, isMaxed: true };
  }
  const currentLevelXp = xpForLevel(lvl);
  const nextLevelXp = xpForLevel(lvl + 1);
  const span = nextLevelXp - currentLevelXp;
  const into = Math.max(0, xp - currentLevelXp);
  const progressPct = span > 0 ? Math.min(100, (into / span) * 100) : 100;
  return { progressPct, xpToNextLevel: Math.max(0, nextLevelXp - xp), isMaxed: false };
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || value < 0) return '—';
  return value.toLocaleString('en-US');
}

export function formatRank(rank: number | null | undefined): string {
  if (rank === null || rank === undefined || rank <= 0) return 'Unranked';
  return `#${rank.toLocaleString('en-US')}`;
}

export function formatSignedNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('en-US')}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return '—';
  const diffMs = Date.now() - date;
  const diffSec = Math.round(diffMs / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSec) >= secondsInUnit) {
      return rtf.format(-Math.round(diffSec / secondsInUnit), unit);
    }
  }
  return 'just now';
}

const TYPE_LABELS: Record<string, string> = {
  unknown: 'Unknown',
  regular: 'Regular',
  ironman: 'Ironman',
  hardcore: 'Hardcore Ironman',
  ultimate: 'Ultimate Ironman',
};

export function playerTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? titleCase(type);
}

const BUILD_LABELS: Record<string, string> = {
  main: 'Main',
  f2p: 'Free-to-Play',
  lvl3: 'Level 3 Skiller',
  zerker: 'Zerker (1 Def)',
  def1: '1 Defence',
  hp10: '10 HP',
  '1def': '1 Defence',
  '10hp': '10 HP',
  f2p_lvl3: 'F2P Level 3',
};

export function playerBuildLabel(build: string): string {
  return BUILD_LABELS[build] ?? titleCase(build);
}
