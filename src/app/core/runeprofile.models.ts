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
