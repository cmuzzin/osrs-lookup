import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SearchBar } from '../../shared/search-bar/search-bar';
import { getRecentSearches } from '../../core/recent-searches.util';

/** The player/clan stat lookup feature — search, recent lookups. Reached from Home via a feature card. */
@Component({
  selector: 'app-lookup',
  imports: [SearchBar],
  templateUrl: './lookup.html',
  styleUrl: './lookup.scss',
})
export class Lookup {
  private readonly router = inject(Router);

  readonly recent = signal<string[]>(getRecentSearches());

  goTo(username: string): void {
    this.router.navigate(['/players', username]);
  }
}
