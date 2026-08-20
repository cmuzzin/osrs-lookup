import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ResponseCache } from './response-cache';
import {
  GainsPeriod,
  GroupDetail,
  GroupGainedEntry,
  GroupHiscoreEntry,
  GroupMembership,
  GroupStatistics,
  Player,
  PlayerGains,
  PlayerRecord,
  TimelineDataPoint,
} from './wom.models';

const BASE_URL = 'https://api.wiseoldman.net/v2';

// How long a response stays reusable. Long enough that navigating away and back
// (e.g. into a clan page and back to the player that linked to it) doesn't re-hit
// the API, short enough that data doesn't go stale within a browsing session.
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Thin client around the public Wise Old Man REST API (no API key required). */
@Injectable({ providedIn: 'root' })
export class WomApi {
  private readonly http = inject(HttpClient);
  private readonly cache = new ResponseCache(CACHE_TTL_MS);

  /**
   * Looks up a player. Uses the "update" endpoint (POST) rather than a plain GET
   * so the hiscores are re-fetched fresh at search time, which also implicitly
   * registers previously-unseen usernames with Wise Old Man on first lookup.
   */
  trackPlayer(username: string): Observable<Player> {
    const name = username.trim();
    return this.cache.get(`player:${name.toLowerCase()}`, () => {
      const url = `${BASE_URL}/players/${encodeURIComponent(name)}`;
      return this.http.post<Player>(url, {}).pipe(this.catchAs('player'));
    });
  }

  getGains(username: string, period: GainsPeriod): Observable<PlayerGains> {
    const name = username.trim();
    return this.cache.get(`gains:${name.toLowerCase()}:${period}`, () => {
      const url = `${BASE_URL}/players/${encodeURIComponent(name)}/gained`;
      return this.http.get<PlayerGains>(url, { params: { period } }).pipe(this.catchAs('player'));
    });
  }

  /**
   * Newest-first series of {value, rank, date} points for a single metric, used to
   * chart XP (or KC/score) progress over a period. `metric` is a skill/boss/activity
   * key such as 'overall', 'woodcutting', or 'zulrah'.
   */
  getTimeline(username: string, metric: string, period: GainsPeriod): Observable<TimelineDataPoint[]> {
    const name = username.trim();
    return this.cache.get(`timeline:${name.toLowerCase()}:${metric}:${period}`, () => {
      const url = `${BASE_URL}/players/${encodeURIComponent(name)}/snapshots/timeline`;
      return this.http
        .get<TimelineDataPoint[]>(url, { params: { metric, period } })
        .pipe(this.catchAs('player'));
    });
  }

  /** All-time best single-period gain per metric, e.g. their highest XP ever gained in one day. */
  getRecords(username: string, period: GainsPeriod): Observable<PlayerRecord[]> {
    const name = username.trim();
    return this.cache.get(`records:${name.toLowerCase()}:${period}`, () => {
      const url = `${BASE_URL}/players/${encodeURIComponent(name)}/records`;
      return this.http.get<PlayerRecord[]>(url, { params: { period } }).pipe(this.catchAs('player'));
    });
  }

  /** WOM-tracked clans/groups this player belongs to. */
  getGroups(username: string): Observable<GroupMembership[]> {
    const name = username.trim();
    return this.cache.get(`player-groups:${name.toLowerCase()}`, () => {
      const url = `${BASE_URL}/players/${encodeURIComponent(name)}/groups`;
      return this.http.get<GroupMembership[]>(url).pipe(this.catchAs('player'));
    });
  }

  /** Full clan details: description, social links, role hierarchy, and full member roster. */
  getGroup(id: number): Observable<GroupDetail> {
    return this.cache.get(`group:${id}`, () => {
      const url = `${BASE_URL}/groups/${id}`;
      return this.http.get<GroupDetail>(url).pipe(this.catchAs('clan'));
    });
  }

  /** Every member ranked by a single metric (skill level/xp, boss KC, etc), best first. */
  getGroupHiscores(id: number, metric: string): Observable<GroupHiscoreEntry[]> {
    return this.cache.get(`group-hiscores:${id}:${metric}`, () => {
      const url = `${BASE_URL}/groups/${id}/hiscores`;
      return this.http.get<GroupHiscoreEntry[]>(url, { params: { metric } }).pipe(this.catchAs('clan'));
    });
  }

  /** Every member's gain for a metric within a period, e.g. "who gained the most XP this week". */
  getGroupGained(id: number, metric: string, period: GainsPeriod): Observable<GroupGainedEntry[]> {
    return this.cache.get(`group-gained:${id}:${metric}:${period}`, () => {
      const url = `${BASE_URL}/groups/${id}/gained`;
      return this.http
        .get<GroupGainedEntry[]>(url, { params: { metric, period } })
        .pipe(this.catchAs('clan'));
    });
  }

  /** Aggregate clan stats: maxed-account counts and clan-wide average levels/xp. */
  getGroupStatistics(id: number): Observable<GroupStatistics> {
    return this.cache.get(`group-stats:${id}`, () => {
      const url = `${BASE_URL}/groups/${id}/statistics`;
      return this.http.get<GroupStatistics>(url).pipe(this.catchAs('clan'));
    });
  }

  /** Maps an HttpErrorResponse to a user-facing Error, worded for the kind of lookup that failed. */
  private catchAs<T>(subject: 'player' | 'clan') {
    return catchError<T, Observable<never>>((err: HttpErrorResponse) => {
      let message = 'Something went wrong talking to Wise Old Man. Please try again.';
      if (err.status === 404) {
        message =
          subject === 'clan'
            ? 'That clan could not be found.'
            : 'That player could not be found on the OSRS hiscores.';
      } else if (err.status === 400) {
        message =
          err.error?.message ??
          (subject === 'clan' ? 'That is not a valid clan.' : 'That is not a valid RuneScape username.');
      } else if (err.status === 429) {
        message = 'Too many lookups too quickly — please wait a moment and try again.';
      } else if (err.status === 0) {
        message = 'Could not reach Wise Old Man. Check your internet connection.';
      } else if (err.error?.message) {
        message = err.error.message;
      }
      return throwError(() => new Error(message));
    });
  }
}
