import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="container">
      <div class="card empty-state">
        <span class="eyebrow">404</span>
        <h3>Page not found</h3>
        <p>The page you are looking for does not exist or has moved.</p>
        <a class="btn btn-primary" [routerLink]="auth.homeUrl()">Go to my dashboard</a>
      </div>
    </section>
  `,
})
export class NotFoundPage {
  protected readonly auth = inject(AuthService);
}
