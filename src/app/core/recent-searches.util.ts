const STORAGE_KEY = 'osrs-lookup:recent-searches';
const MAX_ENTRIES = 8;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function getRecentSearches(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(username: string): void {
  if (!isBrowser()) return;
  const name = username.trim();
  if (!name) return;
  const existing = getRecentSearches().filter((n) => n.toLowerCase() !== name.toLowerCase());
  const updated = [name, ...existing].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full or unavailable — silently ignore, this is a non-critical convenience feature.
  }
}
