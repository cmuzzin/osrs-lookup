import { Component } from '@angular/core';

/** Site-wide footer, rendered once in app.html below the router outlet. */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly year = new Date().getFullYear();
}
