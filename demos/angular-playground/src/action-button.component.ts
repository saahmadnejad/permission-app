/**
 * Dumb action button (SRP). Permission via *appShowIf; defaults to `disable` (Q7).
 * Row-level: pass [context]="row" and a factory query (Q9).
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { resolveQuery, type DeniedBehavior, type PermissionContext, type Query, type QueryInput } from 'permission-visibility-core';
import { ShowIfDirective } from 'permission-visibility-angular';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule, ShowIfDirective],
  template: `
    <ng-container *appShowIf="query ?? node; context: context; denied: denied; let disabled = disabled">
      <button [disabled]="disabled || isDisabled()" (click)="action.emit()">
        {{ label || display() }}
      </button>
    </ng-container>
  `,
})
export class ActionButtonComponent {
  /** Inline query (preferred) or legacy node. */
  @Input() query?: QueryInput;
  @Input() node?: { query?: Query | null; permission?: string } | null;
  @Input() context?: PermissionContext | unknown;
  @Input() denied: DeniedBehavior = 'disable';
  @Input() label?: string;
  @Output() action = new EventEmitter<void>();

  display(): string {
    const q = this.query ?? this.node?.query ?? (this.node?.permission as string | undefined) ?? null;
    const resolved = resolveQuery(q as never, this.context);
    if (typeof resolved === 'string') return resolved;
    if (resolved && typeof resolved === 'object' && 'perm' in resolved)
      return (resolved as { perm: string }).perm;
    return this.label ?? '';
  }

  isDisabled(): boolean {
    const n = (this.query ?? this.node) as { actionable?: boolean } | undefined;
    if (n && typeof n === 'object' && 'actionable' in n) return !(n as { actionable?: boolean }).actionable;
    return false;
  }
}
