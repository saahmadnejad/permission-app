import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { PermissionNodeDef } from '../core';
import { ShowIfDirective } from './show-if.directive';
import { MenuItemComponent } from './menu-item.component';

@Component({
  selector: 'app-sub-navbar',
  standalone: true,
  imports: [CommonModule, ShowIfDirective, MenuItemComponent],
  template: `
    <nav class="sub-nav" *appShowIf="node">
      <ul>
        @for (child of node.children ?? []; track child.query ?? child.permission ?? $index) {
          <li><app-menu-item [node]="child"></app-menu-item></li>
        }
      </ul>
    </nav>
  `,
  styles: [
    '.sub-nav { background: #e0e0e0; padding: 10px; } ul { display: flex; } li { margin-right: 20px; }',
  ],
})
export class SubNavbarComponent {
  @Input({ required: true }) node!: PermissionNodeDef;
}
