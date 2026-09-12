import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Site-wide navbar with a Bulma-standard hamburger burger for mobile — same
 * markup/classes as Bulma's own docs, but toggled via a signal instead of
 * direct DOM manipulation (Bulma ships no JS of its own for this).
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
