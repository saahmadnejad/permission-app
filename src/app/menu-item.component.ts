import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { resolveQuery, type PermissionNodeDef } from '../core';
import { ShowIfDirective } from './show-if.directive';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule, ShowIfDirective],
  template: `
    <ng-container *appShowIf="node">
      @if (isActionable()) {
        <a [href]="node.url">{{ label || display() }}</a>
      } @else {
        <span>{{ label || display() }}</span>
      }
      @if ((node.children?.length ?? 0) > 0) {
        <ul>
          @for (child of node.children ?? []; track child.query ?? child.permission ?? $index) {
            <li><app-menu-item [node]="child" [label]="labelOf(child)"></app-menu-item></li>
          }
        </ul>
      }
    </ng-container>
  `,
  styles: ['ul { list-style-type: none; padding-left: 20px; }'],
})
export class MenuItemComponent {
  @Input({ required: true }) node!: PermissionNodeDef;
  @Input() label = '';

  display(): string {
    const q = resolveQuery(this.node.query ?? (this.node.permission as never) ?? null);
    if (typeof q === 'string') return q;
    return this.node.label ?? this.node.url ?? '';
  }

  labelOf(child: PermissionNodeDef): string {
    return child.label ?? '';
  }

  isActionable(): boolean {
    return !!this.node.actionable && !!this.node.url;
  }
}
