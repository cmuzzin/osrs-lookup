import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AnalyticsService } from './core/analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  constructor() {
    // withComponentInputBinding() means route data (username/clanId) is ready by
    // the time NavigationEnd fires, so urlAfterRedirects reflects the real page.
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.analytics.trackPageView(event.urlAfterRedirects, document.title);
      });
  }
}
