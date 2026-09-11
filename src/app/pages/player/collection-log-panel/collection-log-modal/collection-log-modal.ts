import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RuneProfileApi } from '../../../../core/runeprofile-api';
import { CollectionLogItem, CollectionLogResponse } from '../../../../core/runeprofile.models';
import { formatNumber, itemIconUrl } from '../../../../core/format.util';

// Beyond this many matches, a query is too broad to render usefully — narrow it instead.
const SEARCH_RESULTS_LIMIT = 150;

export interface CollectionLogSearchResult {
  item: CollectionLogItem;
  tabIndex: number;
  pageIndex: number;
  tabName: string;
  pageName: string;
}

/**
 * Full collection-log browser: tabs (Bosses/Raids/Clues/...) on top, pages within
 * the active tab on the left, and the selected page's items — icon, name, obtained
 * state — on the right. Data comes from RuneProfile, a separate opt-in tracking
 * service, so most players won't have one; that's treated as a normal empty state,
 * not an error.
 */
@Component({
  selector: 'app-collection-log-modal',
  templateUrl: './collection-log-modal.html',
  styleUrl: './collection-log-modal.scss',
})
export class CollectionLogModal {
  private readonly runeProfile = inject(RuneProfileApi);

  /** The player's real in-game name (correct spacing/casing) — RuneProfile's lookup is case-insensitive but space-sensitive. */
  readonly rsn = input.required<string>();
  readonly open = input<boolean>(false);
  readonly closed = output<void>();

  readonly log = signal<CollectionLogResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeTabIndex = signal(0);
  readonly activePageIndex = signal(0);

  readonly activeTab = computed(() => this.log()?.tabs[this.activeTabIndex()] ?? null);
  readonly activePage = computed(() => this.activeTab()?.pages[this.activePageIndex()] ?? null);

  readonly search = signal('');
  readonly isSearching = computed(() => this.search().trim().length > 0);

  // Flattened across every tab/page so an item can be found regardless of where
  // it lives — e.g. searching "whip" while browsing Raids still finds the one
  // under Bosses ▸ Abyssal Sire. Results carry enough to jump straight there.
  //
  // Omnisearch: a query matches an item by its own name, OR by the page/tab it
  // lives on — so "hydra" also surfaces Dragon knife and every other item on the
  // Alchemical Hydra page, not just items literally named "hydra".
  private readonly allSearchResults = computed<CollectionLogSearchResult[]>(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) return [];
    const results: CollectionLogSearchResult[] = [];
    this.log()?.tabs.forEach((tab, tabIndex) => {
      const tabMatches = tab.name.toLowerCase().includes(query);
      tab.pages.forEach((page, pageIndex) => {
        const pageMatches = tabMatches || page.name.toLowerCase().includes(query);
        for (const item of page.items) {
          if (pageMatches || item.name.toLowerCase().includes(query)) {
            results.push({ item, tabIndex, pageIndex, tabName: tab.name, pageName: page.name });
          }
        }
      });
    });
    return results;
  });

  readonly searchResults = computed(() => this.allSearchResults().slice(0, SEARCH_RESULTS_LIMIT));
  readonly searchResultsTotal = computed(() => this.allSearchResults().length);
  readonly searchResultsTruncated = computed(() => this.searchResultsTotal() > SEARCH_RESULTS_LIMIT);

  readonly formatNumber = formatNumber;
  readonly itemIconUrl = itemIconUrl;

  // Fetches lazily on first open, and only once per rsn — RuneProfileApi's own
  // response cache makes re-opening the modal after that free.
  private loadedFor: string | null = null;

  constructor() {
    effect(() => {
      if (this.open() && this.loadedFor !== this.rsn()) {
        this.fetch(this.rsn());
      }
    });
  }

  selectTab(index: number): void {
    this.activeTabIndex.set(index);
    this.activePageIndex.set(0);
  }

  selectPage(index: number): void {
    this.activePageIndex.set(index);
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  clearSearch(): void {
    this.search.set('');
  }

  /** Jumps to a search result's own tab/page and closes the search view, same as clicking there directly. */
  goToResult(result: CollectionLogSearchResult): void {
    this.activeTabIndex.set(result.tabIndex);
    this.activePageIndex.set(result.pageIndex);
    this.clearSearch();
  }

  retry(): void {
    this.loadedFor = null;
    this.fetch(this.rsn());
  }

  close(): void {
    this.closed.emit();
  }

  private fetch(rsn: string): void {
    this.loadedFor = rsn;
    this.loading.set(true);
    this.error.set(null);
    this.activeTabIndex.set(0);
    this.activePageIndex.set(0);
    this.search.set('');
    this.runeProfile.getCollectionLog(rsn).subscribe({
      next: (log) => {
        this.log.set(log);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
