import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isNodeVisible, type PermissionNodeDef } from 'permission-visibility-core';
import { ShowIfDirective } from 'permission-visibility-angular';
import { PermissionService } from 'permission-visibility-angular';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, ShowIfDirective],
  template: `
    <ng-container *appShowIf="node">
      <select>
        <option value="">Select an option</option>
        @for (child of visibleOptions(); track child.query ?? child.permission ?? $index) {
          <option [value]="child.url">{{ labelOf(child) }}</option>
        }
      </select>
    </ng-container>
  `,
})
export class DropdownComponent {
  @Input({ required: true }) node!: PermissionNodeDef;
  private readonly perms = inject(PermissionService);

  visibleOptions(): PermissionNodeDef[] {
    const can = this.perms.canFn();
    return (this.node.children ?? []).filter((c) => isNodeVisible(c, can));
  }

  labelOf(child: PermissionNodeDef): string {
    const q = child.query;
    if (typeof q === 'string') return q;
    if (typeof child.permission === 'string' && child.permission) return child.permission;
    return child.label ?? child.url ?? '';
  }
}
