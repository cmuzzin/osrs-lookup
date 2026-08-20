import { signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

/**
 * Click-to-sort state for a table. Clicking the already-active column flips its
 * direction; clicking a different column switches to it, defaulting to `desc`
 * unless the caller passes a different default for that column (e.g. names read
 * better starting A→Z).
 */
export function createSortable<K extends string>(initial: SortState<K>) {
  const sort = signal<SortState<K>>(initial);

  function toggleSort(key: K, defaultDirection: SortDirection = 'desc'): void {
    sort.update((s) =>
      s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: defaultDirection },
    );
  }

  return { sort, toggleSort };
}

/** Ascending/descending-aware comparator for a single already-extracted pair of values. */
export function compareValues(direction: SortDirection, a: number | string, b: number | string): number {
  const cmp = a < b ? -1 : a > b ? 1 : 0;
  return direction === 'asc' ? cmp : -cmp;
}
