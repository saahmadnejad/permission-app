/**
 * Dumb nav UI (SRP): declares structure, permission enforced by *appShowIf.
 * No inheritance, no service injection — depends only on core types.
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { PermissionNodeDef } from '../core';
import { ShowIfDirective } from './show-if.directive';
import { MenuItemComponent } from './menu-item.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ShowIfDirective, MenuItemComponent],
  template: `
    <nav class="main-nav" *appShowIf="node">
      <ul>
        @for (child of node.children ?? []; track child.query ?? child.permission ?? $index) {
          <li><app-menu-item [node]="child"></app-menu-item></li>
        }
      </ul>
    </nav>
  `,
  styles: [
    '.main-nav { background: #f0f0f0; padding: 10px; } ul { display: flex; } li { margin-right: 20px; }',
  ],
})
export class NavbarComponent {
  @Input({ required: true }) node!: PermissionNodeDef;
}
