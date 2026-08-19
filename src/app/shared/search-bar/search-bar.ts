import { Component, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar {
  private readonly router = inject(Router);

  /** Pre-fills the box, e.g. when re-rendered on the player page for the current name. */
  readonly initialValue = input<string>('');
  readonly placeholder = input<string>('Enter an OSRS username…');

  query = '';

  constructor() {
    effect(() => {
      this.query = this.initialValue();
    });
  }

  submit(): void {
    const name = this.query.trim();
    if (!name || name.length > 12) return;
    this.router.navigate(['/players', name]);
  }
}
