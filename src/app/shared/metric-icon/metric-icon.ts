import { Component, computed, input } from '@angular/core';

/**
 * Renders a metric's icon, which is either an emoji glyph (skills, activities, EHP/EHB —
 * `format.util`'s SKILL_ICONS) or a path to a real sprite — either a root-relative path
 * (bosses — see `bossIconPath`) or a full URL to an external CDN (item icons — see
 * `itemIconUrl`). Centralizing the emoji-vs-image decision here means every table/tile
 * that shows a `row.icon`/`tile.icon` string automatically renders whichever kind it is.
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
  readonly isImage = computed(() => {
    const icon = this.icon();
    return icon.startsWith('/') || icon.startsWith('http://') || icon.startsWith('https://');
  });
}
