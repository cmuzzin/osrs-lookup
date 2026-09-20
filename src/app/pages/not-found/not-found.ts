import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container has-text-centered">
        <h1 class="title">Page not found</h1>
        <p class="subtitle">That page doesn't exist — it may have moved.</p>
        <a class="button is-primary" routerLink="/">Back to RuneTools</a>
      </div>
    </section>
  `,
})
export class NotFound {}
