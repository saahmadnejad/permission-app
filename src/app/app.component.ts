/**
 * Demo shell — playground at `/`, guarded pages behind `permGuard`.
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main style="display:block;padding:20px;max-width:1100px;margin:0 auto;font-family:system-ui,sans-serif">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {}
