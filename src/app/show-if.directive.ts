/**
 * Structural directive replacing BasePermissionComponent inheritance (Q4).
 *
 * Usage:
 *   <nav *appShowIf="'VIEW_HOME'">…</nav>
 *   <button *appShowIf="'EDIT_USER'; context: row; denied: 'disable'; disabledClass: 'is-disabled'">…</button>
 *   <section *appShowIf="node; context: row">…</section>   <!-- node: PermissionNodeDef -->
 *
 * Modes (Q7):
 *  - hide (default): removes content when denied.
 *  - disable: keeps content but exposes `disabled` in the template context;
 *             bind with `let-disabled="disabled"` and `[disabled]="disabled"`.
 *  - show-locked: keeps content, exposes `locked=true` for lock-UI.
 */
import {
  Directive,
  EmbeddedViewRef,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { isNodeVisible, resolveQuery, type PermissionContext, type PermissionNodeDef, type Query, type QueryInput } from '../core';
import { PermissionService } from './permission.service';

interface ShowIfContext {
  $implicit: boolean; // visible
  visible: boolean;
  disabled: boolean;
  locked: boolean;
}

@Directive({ selector: '[appShowIf]', standalone: true })
export class ShowIfDirective {
  private readonly tpl = inject(TemplateRef<ShowIfContext>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly perms = inject(PermissionService);
  private viewRef: EmbeddedViewRef<ShowIfContext> | null = null;

  private rawQuery: QueryInput | PermissionNodeDef;
  private ctx: PermissionContext | unknown;
  private denied: 'hide' | 'disable' | 'show-locked' = 'hide';

  constructor() {
    // Re-evaluate whenever store revision changes (fail-closed included).
    effect(() => {
      this.render();
    });
  }

  @Input('appShowIf') set query(value: QueryInput | PermissionNodeDef) {
    this.rawQuery = value;
    this.render();
  }

  @Input('appShowIfContext') set context(value: PermissionContext | unknown) {
    this.ctx = value;
    this.render();
  }

  @Input('appShowIfDenied') set deniedMode(value: 'hide' | 'disable' | 'show-locked') {
    this.denied = value ?? 'hide';
    this.render();
  }

  // Microsyntax aliases: *appShowIf="q; context: c; denied: 'disable'"
  @Input() set appShowIfContextAlias(_v: never) {
    /* handled by context above */
  }

  private evaluate(): { visible: boolean; disabled: boolean; locked: boolean } {
    const raw = this.rawQuery as PermissionNodeDef | Query | null | undefined;
    let visible: boolean;
    if (raw !== null && typeof raw === 'object' && ('query' in raw || 'permission' in raw || 'children' in raw)) {
      visible = isNodeVisible(raw as PermissionNodeDef, (q, c) => this.perms.can(q, c), this.ctx);
    } else {
      const resolved = resolveQuery((raw ?? null) as never, this.ctx);
      visible =
        resolved === null ? true : this.perms.can(resolved, this.ctx);
    }
    if (visible) return { visible: true, disabled: false, locked: false };
    if (this.denied === 'hide') return { visible: false, disabled: false, locked: false };
    if (this.denied === 'disable') return { visible: true, disabled: true, locked: false };
    return { visible: true, disabled: false, locked: true };
  }

  private render(): void {
    // Guard: inputs may not be set on first effect run.
    if (this.rawQuery === undefined) return;
    const state = this.evaluate();
    if (!state.visible) {
      this.vcr.clear();
      this.viewRef = null;
      return;
    }
    if (!this.viewRef) {
      this.viewRef = this.vcr.createEmbeddedView(this.tpl, {
        $implicit: true,
        visible: true,
        disabled: state.disabled,
        locked: state.locked,
      });
    } else {
      this.viewRef.context.disabled = state.disabled;
      this.viewRef.context.locked = state.locked;
      this.viewRef.context.visible = true;
      this.viewRef.context.$implicit = true;
      this.viewRef.markForCheck();
    }
  }
}
