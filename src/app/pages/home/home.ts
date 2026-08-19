import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SearchBar } from '../../shared/search-bar/search-bar';
import { getRecentSearches } from '../../core/recent-searches.util';

@Component({
  selector: 'app-home',
  imports: [SearchBar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);

  readonly recent = signal<string[]>(getRecentSearches());

  goTo(username: string): void {
    this.router.navigate(['/players', username]);
  }
}
