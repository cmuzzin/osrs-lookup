// Presentation helpers: canonical skill order/metadata, number & label formatting.

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
