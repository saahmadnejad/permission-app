import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { PermissionNodeDef, QueryInput } from 'permission-visibility-core';
import { ShowIfDirective } from 'permission-visibility-angular';

@Component({
  selector: 'app-modal-opener-button',
  standalone: true,
  imports: [CommonModule, ShowIfDirective],
  template: `
    <ng-container *appShowIf="query ?? node">
      <button (click)="open.emit()">Open Confirmation Modal</button>
    </ng-container>
  `,
})
export class ModalOpenerButtonComponent {
  @Input() query?: QueryInput;
  @Input() node?: PermissionNodeDef | null;
  @Output() open = new EventEmitter<void>();
}
