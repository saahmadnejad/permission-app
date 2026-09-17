import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { PermissionNodeDef } from '../core';
import { ShowIfDirective } from './show-if.directive';
import { ActionButtonComponent } from './action-button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ShowIfDirective, ActionButtonComponent],
  template: `
    <ng-container *appShowIf="node">
      <div class="modal-content">
        <h2>Confirmation Modal</h2>
        @for (child of node.children ?? []; track child.query ?? child.permission ?? $index) {
          <app-action-button
            [query]="child.query ?? child.permission ?? null"
            [label]="labelOf(child)"
            (action)="handleAction(child)"
          ></app-action-button>
        }
        <button (click)="close.emit()">Close</button>
      </div>
    </ng-container>
  `,
  styles: [
    '.modal-content { border: 1px solid #000; padding: 20px; background: white; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); }',
  ],
})
export class ModalComponent {
  @Input({ required: true }) node!: PermissionNodeDef;
  @Output() close = new EventEmitter<void>();

  labelOf(child: PermissionNodeDef): string {
    const q = child.query;
    if (typeof q === 'string') return q;
    if (typeof child.permission === 'string' && child.permission) return child.permission;
    return child.label ?? '';
  }

  handleAction(child: PermissionNodeDef): void {
    // eslint-disable-next-line no-console
    console.log('Action performed:', child.query ?? child.permission);
    this.close.emit();
  }
}
