import { Component, input } from '@angular/core';
import { SortDirection } from '../sort-state';

/** Small ▲/▼ indicator for a sortable table header; a faint ⇅ hints it's clickable when inactive. */
@Component({
  selector: 'app-sort-icon',
  template: `
    <span class="sort-icon" [class.is-active]="active()" aria-hidden="true">
      {{ active() ? (direction() === 'asc' ? '▲' : '▼') : '⇅' }}
    </span>
  `,
  styles: `
    .sort-icon {
      margin-left: 0.3rem;
      font-size: 0.7em;
      color: var(--text-faint);
      opacity: 0.6;
    }

    .sort-icon.is-active {
      color: var(--gold-bright);
      opacity: 1;
    }
  `,
})
export class SortIcon {
  readonly active = input.required<boolean>();
  readonly direction = input.required<SortDirection>();
}
