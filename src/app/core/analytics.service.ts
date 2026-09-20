import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp } from 'firebase/app';
import { Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { firebaseConfig } from './firebase.config';

/**
 * Thin wrapper around Firebase Analytics. Initialization is guarded by
 * isSupported() (false in some browsers/private-browsing modes) and every call
 * is a silent no-op until that check resolves, so a blocked or unsupported
 * environment never breaks the app — analytics is best-effort by nature.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private analytics: Analytics | null = null;
  private readonly ready: Promise<void>;

  constructor() {
    // Prerendering runs in Node, where there is nothing to initialise.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      this.ready = Promise.resolve();
      return;
    }
    const app = initializeApp(firebaseConfig);
    this.ready = isSupported()
      .then((supported) => {
        if (supported) this.analytics = getAnalytics(app);
      })
      .catch(() => {
        // Analytics genuinely unsupported (or its scripts got blocked) — no-op.
      });
  }

  /** Records a virtual page view for an SPA route change. */
  trackPageView(pagePath: string, pageTitle?: string): void {
    void this.ready.then(() => {
      if (!this.analytics) return;
      logEvent(this.analytics, 'page_view', { page_path: pagePath, page_title: pageTitle });
    });
  }

  /** Records a named event with optional parameters (see Firebase's recommended event names). */
  trackEvent(name: string, params?: Record<string, unknown>): void {
    void this.ready.then(() => {
      if (!this.analytics) return;
      logEvent(this.analytics, name, params);
    });
  }
}
