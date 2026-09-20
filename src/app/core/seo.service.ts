import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const SITE_URL = 'https://rune-tools.com';
const DEFAULT_DESCRIPTION =
  'A growing set of tools for Old School RuneScape players and clans — stat lookups, boss kill counts, activities, quests, achievements, and more.';

/** Keeps the canonical URL, description, and Open Graph/Twitter tags in sync with the active route. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);

  update(path: string, description?: string): void {
    const cleanPath = path.split(/[?#]/)[0];
    const url = cleanPath === '/' ? `${SITE_URL}/` : `${SITE_URL}${cleanPath.replace(/\/$/, '')}`;
    const desc = description ?? DEFAULT_DESCRIPTION;
    const title = this.titleService.getTitle();

    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'RuneTools' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: desc });

    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
