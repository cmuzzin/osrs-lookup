import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Static pages are prerendered at build time so crawlers and link-preview
 * scrapers get real HTML. Player and clan pages depend on a username/id and
 * live API data, so they stay client-rendered.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'players/:username', renderMode: RenderMode.Client },
  { path: 'clans/:clanId', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
