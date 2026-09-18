/**
 * Angular adapter over the shared framework-free core.
 * Thin wrapper: reactivity (Signals + Observable compat) lives here,
 * decision logic lives in `permission-visibility-core`.
 */
import { Injectable, Signal, computed, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  InMemoryPermissionStore,
  canShowNode,
  isNodeEnabled,
  type CanFn,
  type PermissionContext,
  type PermissionNodeDef,
  type PermissionStatus,
  type Query,
} from 'permission-visibility-core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  /** Underlying framework-free store — the single source of truth. */
  private readonly core = new InMemoryPermissionStore();

  /** Reactive revision counter so Signals recompute on store change. */
  private readonly revision = signal(0);
  private readonly statusSig = signal<PermissionStatus>('ready');

  constructor() {
    this.core.onChange(() => {
      this.statusSig.set(this.core.status);
      this.revision.update((v) => v + 1);
    });
  }

  get status(): PermissionStatus {
    return this.statusSig();
  }

  /** Sync check for render paths — tracks signals when called in reactive context. */
  can(query: Query, ctx?: PermissionContext | unknown): boolean {
    this.revision(); // track
    this.statusSig(); // track
    return this.core.can(query, ctx);
  }

  /** CanFn bound to this service (for core helpers like isNodeVisible). */
  canFn(): CanFn {
    return (q, ctx) => this.can(q, ctx);
  }

  /** Reactive Signal version — preferred in templates (no flicker, no async pipe). */
  canSignal(query: Query, ctx?: PermissionContext | unknown): Signal<boolean> {
    return computed(() => this.can(query, ctx));
  }

  /** Node-level visibility / enabled signals (Q2). */
  visibleSignal(node: PermissionNodeDef, ctx?: PermissionContext | unknown): Signal<boolean> {
    return computed(() => {
      this.revision();
      this.statusSig();
      return canShowNode(node, (q, c) => this.core.can(q, c), ctx);
    });
  }

  enabledSignal(node: PermissionNodeDef, ctx?: PermissionContext | unknown): Signal<boolean> {
    return computed(() => {
      this.revision();
      this.statusSig();
      return isNodeEnabled(node, (q, c) => this.core.can(q, c), ctx);
    });
  }

  onChange(cb: () => void): () => void {
    return this.core.onChange(cb);
  }

  setPermissions(perms: Iterable<string>): void {
    this.core.setPermissions(perms);
  }

  async refresh(): Promise<void> {
    await this.core.refresh();
  }

  /** @deprecated prefer `can()` / `canSignal()`. Kept for compat. */
  hasPermission(perm: string): Observable<boolean> {
    void this.revision();
    return of(this.core.can(perm));
  }

}
