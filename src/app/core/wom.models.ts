// Data shapes for the Wise Old Man public API (v2).
// Docs: https://docs.wiseoldman.net/

export type PlayerType = 'unknown' | 'regular' | 'ironman' | 'hardcore' | 'ultimate';

export type PlayerBuild =
  | 'main'
  | 'f2p'
  | 'lvl3'
  | 'zerker'
  | 'def1'
  | 'hp10'
  | '1def'
  | '10hp'
  | 'f2p_lvl3';

export interface SkillValue {
  metric: string;
  experience: number;
  rank: number;
  level: number;
  ehp?: number;
}

export interface BossValue {
  metric: string;
  kills: number;
  rank: number;
  ehb?: number;
}

export interface ActivityValue {
  metric: string;
  score: number;
  rank: number;
}

export interface ComputedValue {
  metric: string;
  value: number;
  rank: number;
}

export interface SnapshotData {
  skills: Record<string, SkillValue>;
  bosses: Record<string, BossValue>;
  activities: Record<string, ActivityValue>;
  computed: Record<string, ComputedValue>;
}

export interface Snapshot {
  id: number;
  playerId: number;
  createdAt: string;
  importedAt: string | null;
  data: SnapshotData;
}

export interface Player {
  id: number;
  username: string;
  displayName: string;
  type: PlayerType;
  build: PlayerBuild | string;
  country: string | null;
  status: string;
  patron: boolean;
  exp: number;
  ehp: number;
  ehb: number;
  ttm: number;
  tt200m: number;
  combatLevel: number;
  registeredAt: string;
  updatedAt: string | null;
  lastChangedAt: string | null;
  lastImportedAt: string | null;
  latestSnapshot: Snapshot | null;
}

// --- Gains endpoint ---

export interface GainedMeasure {
  start: number;
  end: number;
  gained: number;
}

export interface SkillGains {
  metric: string;
  experience: GainedMeasure;
  rank: GainedMeasure;
  level: GainedMeasure;
  ehp?: GainedMeasure;
}

export interface BossGains {
  metric: string;
  kills: GainedMeasure;
  rank: GainedMeasure;
  ehb?: GainedMeasure;
}

export interface ActivityGains {
  metric: string;
  score: GainedMeasure;
  rank: GainedMeasure;
}

export interface ComputedGains {
  metric: string;
  value: GainedMeasure;
  rank: GainedMeasure;
}

export interface PlayerGains {
  startsAt: string;
  endsAt: string;
  data: {
    skills: Record<string, SkillGains>;
    bosses: Record<string, BossGains>;
    activities: Record<string, ActivityGains>;
    computed: Record<string, ComputedGains>;
  };
}

export type GainsPeriod = 'day' | 'week' | 'month' | 'year';

// --- Snapshot timeline endpoint (single metric, newest first) ---

export interface TimelineDataPoint {
  value: number;
  rank: number;
  date: string;
}

// --- Records endpoint (all-time best gain within a single period, per metric) ---

export interface PlayerRecord {
  period: GainsPeriod;
  metric: string;
  value: number;
  updatedAt: string;
}

// --- Groups endpoint ---

export interface Group {
  id: number;
  name: string;
  clanChat: string | null;
  description: string | null;
  homeworld: number | null;
  verified: boolean;
  patron: boolean;
  score: number;
  memberCount: number;
}

/** A player's own membership row, as returned from /players/:username/groups. */
export interface GroupMembership {
  playerId: number;
  groupId: number;
  role: string;
  group: Group;
}

// --- Group detail endpoint (/groups/:id) ---

export interface SocialLinks {
  website: string | null;
  discord: string | null;
  twitter: string | null;
  youtube: string | null;
  twitch: string | null;
}

export interface RoleOrder {
  groupId: number;
  role: string;
  index: number;
}

/** A member row within a group's own roster, as returned from /groups/:id. */
export interface GroupMember {
  playerId: number;
  groupId: number;
  role: string;
  player: Player;
}

export interface GroupDetail extends Group {
  socialLinks: SocialLinks;
  roleOrders: RoleOrder[];
  memberships: GroupMember[];
}

// --- Group hiscores / gained / statistics endpoints ---

export interface GroupHiscoreEntry {
  player: Player;
  data: {
    type: string;
    rank: number;
    level?: number;
    experience?: number;
    kills?: number;
    score?: number;
    value?: number;
  };
}

export interface GroupGainedEntry {
  player: Player;
  startDate: string;
  endDate: string;
  data: {
    gained: number;
    start: number;
    end: number;
  };
}

export interface GroupStatistics {
  maxedCombatCount: number;
  maxedTotalCount: number;
  maxed200msCount: number;
  averageStats: Snapshot;
}

export interface WomApiError {
  message: string;
}
