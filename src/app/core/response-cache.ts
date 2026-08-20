import { Observable, shareReplay, tap } from 'rxjs';

/**
 * Short-lived in-memory cache for HTTP response Observables, shared by every API
 * client. Reusing an in-flight or recently-completed response for the same key
 * avoids duplicate network calls — e.g. clicking into a clan and back doesn't
 * re-fetch the player. Failed responses are evicted immediately so a retry hits
 * the network again rather than replaying the same error for the rest of the TTL.
 */
export class ResponseCache {
  private readonly entries = new Map<string, { expiresAt: number; response$: Observable<unknown> }>();

  constructor(private readonly ttlMs: number) {}

  get<T>(key: string, request: () => Observable<T>): Observable<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.response$ as Observable<T>;
    }

    const response$ = request().pipe(
      tap({ error: () => this.entries.delete(key) }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.entries.set(key, { expiresAt: Date.now() + this.ttlMs, response$ });
    return response$;
  }
}
