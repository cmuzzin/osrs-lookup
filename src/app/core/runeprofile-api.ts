import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ResponseCache } from './response-cache';
import {
  AchievementDiariesResponse,
  AchievementDiaryArea,
  CollectionLogResponse,
  CombatAchievementTasksResponse,
  Quest,
  QuestsResponse,
} from './runeprofile.models';

const BASE_URL = 'https://api.runeprofile.com/v1';

// Exported so callers can tell "this player just isn't tracked here" (common,
// not really an error) apart from an actual failure worth showing in red.
export const RUNEPROFILE_NOT_LINKED_MESSAGE = "This player hasn't linked a RuneProfile account.";

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
      return this.http.get<CollectionLogResponse>(url).pipe(this.catchAs('collection log'));
    });
  }

  /** Every quest in the game plus this player's completion state for each. */
  getQuests(username: string): Observable<Quest[]> {
    const name = username.trim();
    return this.cache.get(`rp-quests:${name.toLowerCase()}`, () => {
      const url = `${BASE_URL}/accounts/${encodeURIComponent(name)}/quests`;
      return this.http.get<QuestsResponse>(url).pipe(
        map((res) => res.data),
        this.catchAs('quests'),
      );
    });
  }

  /** Every achievement diary area, with each tier's task completion counts. */
  getAchievementDiaries(username: string): Observable<AchievementDiaryArea[]> {
    const name = username.trim();
    return this.cache.get(`rp-diaries:${name.toLowerCase()}`, () => {
      const url = `${BASE_URL}/accounts/${encodeURIComponent(name)}/achievement-diaries`;
      return this.http.get<AchievementDiariesResponse>(url).pipe(
        map((res) => res.data),
        this.catchAs('achievement diaries'),
      );
    });
  }

  /** Every combat achievement task, plus total points earned and the highest tier reached. */
  getCombatAchievementTasks(username: string): Observable<CombatAchievementTasksResponse> {
    const name = username.trim();
    return this.cache.get(`rp-ca-tasks:${name.toLowerCase()}`, () => {
      const url = `${BASE_URL}/accounts/${encodeURIComponent(name)}/combat-achievements/tasks`;
      return this.http.get<CombatAchievementTasksResponse>(url).pipe(this.catchAs('combat achievements'));
    });
  }

  private catchAs<T>(subject: string) {
    return catchError<T, Observable<never>>((err: HttpErrorResponse) => {
      let message = `Something went wrong loading ${subject}.`;
      if (err.status === 404) {
        message = RUNEPROFILE_NOT_LINKED_MESSAGE;
      } else if (err.status === 429) {
        message = 'Too many lookups too quickly — please wait a moment and try again.';
      } else if (err.status === 0) {
        message = 'Could not reach RuneProfile. Check your internet connection.';
      }
      return throwError(() => new Error(message));
    });
  }
}
