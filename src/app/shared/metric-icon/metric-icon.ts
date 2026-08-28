import { Component, computed, input } from '@angular/core';

/**
 * Renders a metric's icon, which is either an emoji glyph (skills, activities, EHP/EHB —
 * `format.util`'s SKILL_ICONS) or a path to a real sprite (bosses — see `bossIconPath`).
 * Centralizing the emoji-vs-image decision here means every table/tile that shows a
 * `row.icon`/`tile.icon` string automatically renders whichever kind it turns out to be.
 */
@Component({
  selector: 'app-metric-icon',
  template: `
    @if (isImage()) {
      <img class="metric-icon" [src]="icon()" alt="" aria-hidden="true" />
    } @else {
      <span class="metric-icon" aria-hidden="true">{{ icon() }}</span>
    }
  `,
  styles: `
    .metric-icon {
      display: inline-block;
      width: 1em;
      height: 1em;
      vertical-align: -0.15em;
      object-fit: contain;
    }
  `,
})
export class MetricIcon {
  readonly icon = input.required<string>();
  readonly isImage = computed(() => this.icon().startsWith('/'));
}
