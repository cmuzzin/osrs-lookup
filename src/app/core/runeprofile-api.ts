import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ResponseCache } from './response-cache';
import { CollectionLogResponse } from './runeprofile.models';

const BASE_URL = 'https://api.runeprofile.com/v1';

// Matches WomApi's TTL. RuneProfile's own server-side cache is only ~1 minute,
// but there's no need for this app to poll that closely within one session.
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Thin client for RuneProfile's public read-only API (a separate, opt-in
 * tracking service — see runeprofile.models.ts). No API key required for the
 * anonymous tier (30 req/min), which is plenty for on-demand modal lookups.
 */
@Injectable({ providedIn: 'root' })
export class RuneProfileApi {
  private readonly http = inject(HttpClient);
  private readonly cache = new ResponseCache(CACHE_TTL_MS);

  /** Full collection log for a player, organized by tab/page/item. */
  getCollectionLog(username: string): Observable<CollectionLogResponse> {
    const name = username.trim();
    return this.cache.get(`rp-clog:${name.toLowerCase()}`, () => {
      const url = `${BASE_URL}/accounts/${encodeURIComponent(name)}/collection-log`;
      return this.http.get<CollectionLogResponse>(url).pipe(this.catchAs());
    });
  }

  private catchAs<T>() {
    return catchError<T, Observable<never>>((err: HttpErrorResponse) => {
      let message = 'Something went wrong loading the collection log.';
      if (err.status === 404) {
        message = "This player hasn't linked a RuneProfile account.";
      } else if (err.status === 429) {
        message = 'Too many lookups too quickly — please wait a moment and try again.';
      } else if (err.status === 0) {
        message = 'Could not reach RuneProfile. Check your internet connection.';
      }
      return throwError(() => new Error(message));
    });
  }
}
