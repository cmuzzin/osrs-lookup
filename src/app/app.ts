import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AnalyticsService } from './core/analytics.service';
import { SeoService } from './core/seo.service';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);
  private readonly title = inject(Title);

  constructor() {
    // withComponentInputBinding() means route data (username/clanId) is ready by
    // the time NavigationEnd fires, so urlAfterRedirects reflects the real page.
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.seo.update(event.urlAfterRedirects, this.deepestData(this.router.routerState.snapshot.root));
        this.analytics.trackPageView(event.urlAfterRedirects, this.title.getTitle());
      });
  }

  private deepestData(route: ActivatedRouteSnapshot): string | undefined {
    let current = route;
    while (current.firstChild) current = current.firstChild;
    return current.data['description'];
  }
}
