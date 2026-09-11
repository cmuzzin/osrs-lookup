// --- RuneProfile public API (https://api.runeprofile.com/v1/docs) ---
// A separate, opt-in player-tracking service (their own RuneLite plugin) —
// unrelated to Wise Old Man. Most WOM-tracked players won't have an account
// here, so a 404 from this API is a normal, expected outcome.

export interface CollectionLogItem {
  id: number;
  name: string;
  /** How many of this item have been obtained; 0 means not yet obtained. */
  quantity: number;
}

export interface CollectionLogPage {
  name: string;
  obtained: number;
  total: number;
  items: CollectionLogItem[];
}

export interface CollectionLogTab {
  name: string;
  obtained: number;
  total: number;
  pages: CollectionLogPage[];
}

export interface CollectionLogResponse {
  obtained: number;
  total: number;
  tabs: CollectionLogTab[];
}

export type QuestType = 'free' | 'members' | 'mini';
export type QuestState = 'not_started' | 'in_progress' | 'finished';

export interface Quest {
  id: number;
  name: string;
  points: number;
  type: QuestType;
  state: QuestState;
}

export interface QuestsResponse {
  data: Quest[];
}

export interface AchievementDiaryTier {
  tier: string; // 'Easy' | 'Medium' | 'Hard' | 'Elite'
  completed: number;
  total: number;
}

export interface AchievementDiaryArea {
  areaId: number;
  area: string;
  tiers: AchievementDiaryTier[];
}

export interface AchievementDiariesResponse {
  data: AchievementDiaryArea[];
}

export type CombatAchievementTierName = 'Easy' | 'Medium' | 'Hard' | 'Elite' | 'Master' | 'Grandmaster';

export interface CombatAchievementTask {
  index: number;
  tierId: number;
  tierName: CombatAchievementTierName;
  name: string;
  description: string;
  type: string; // 'Kill Count' | 'Mechanical' | 'Perfection' | 'Restriction' | 'Speed' | 'Stamina'
  monster: string;
  completed: boolean;
}

export interface CombatAchievementTasksResponse {
  totalPoints: number;
  tierReached: string | null;
  data: CombatAchievementTask[];
}
