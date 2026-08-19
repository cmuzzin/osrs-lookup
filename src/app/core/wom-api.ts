import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import {
  GainsPeriod,
  GroupMembership,
  Player,
  PlayerGains,
  PlayerRecord,
  TimelineDataPoint,
} from './wom.models';

const BASE_URL = 'https://api.wiseoldman.net/v2';

/** Thin client around the public Wise Old Man REST API (no API key required). */
@Injectable({ providedIn: 'root' })
export class WomApi {
  private readonly http = inject(HttpClient);

  /**
   * Looks up a player. Uses the "update" endpoint (POST) rather than a plain GET
   * so the hiscores are re-fetched fresh at search time, which also implicitly
   * registers previously-unseen usernames with Wise Old Man on first lookup.
   */
  trackPlayer(username: string): Observable<Player> {
    const url = `${BASE_URL}/players/${encodeURIComponent(username.trim())}`;
    return this.http.post<Player>(url, {}).pipe(catchError(this.handleError));
  }

  getGains(username: string, period: GainsPeriod): Observable<PlayerGains> {
    const url = `${BASE_URL}/players/${encodeURIComponent(username.trim())}/gained`;
    return this.http
      .get<PlayerGains>(url, { params: { period } })
      .pipe(catchError(this.handleError));
  }

  /**
   * Newest-first series of {value, rank, date} points for a single metric, used to
   * chart XP (or KC/score) progress over a period. `metric` is a skill/boss/activity
   * key such as 'overall', 'woodcutting', or 'zulrah'.
   */
  getTimeline(username: string, metric: string, period: GainsPeriod): Observable<TimelineDataPoint[]> {
    const url = `${BASE_URL}/players/${encodeURIComponent(username.trim())}/snapshots/timeline`;
    return this.http
      .get<TimelineDataPoint[]>(url, { params: { metric, period } })
      .pipe(catchError(this.handleError));
  }

  /** All-time best single-period gain per metric, e.g. their highest XP ever gained in one day. */
  getRecords(username: string, period: GainsPeriod): Observable<PlayerRecord[]> {
    const url = `${BASE_URL}/players/${encodeURIComponent(username.trim())}/records`;
    return this.http.get<PlayerRecord[]>(url, { params: { period } }).pipe(catchError(this.handleError));
  }

  /** WOM-tracked clans/groups this player belongs to. */
  getGroups(username: string): Observable<GroupMembership[]> {
    const url = `${BASE_URL}/players/${encodeURIComponent(username.trim())}/groups`;
    return this.http.get<GroupMembership[]>(url).pipe(catchError(this.handleError));
  }

  private handleError = (err: HttpErrorResponse) => {
    let message = 'Something went wrong talking to Wise Old Man. Please try again.';
    if (err.status === 404) {
      message = 'That player could not be found on the OSRS hiscores.';
    } else if (err.status === 400) {
      message = err.error?.message ?? 'That is not a valid RuneScape username.';
    } else if (err.status === 429) {
      message = 'Too many lookups too quickly — please wait a moment and try again.';
    } else if (err.status === 0) {
      message = 'Could not reach Wise Old Man. Check your internet connection.';
    } else if (err.error?.message) {
      message = err.error.message;
    }
    return throwError(() => new Error(message));
  };
}
