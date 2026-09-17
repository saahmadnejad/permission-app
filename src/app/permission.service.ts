/**
 * Angular adapter over the pure core store (Q4/Q5/Q10).
 * Thin wrapper: reactivity (Signals + Observable compat) lives here,
 * decision logic lives in `src/core` (portable to React as-is).
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
} from '../core';

export const ALL_PERMISSIONS = [
  'VIEW_HOME',
  'VIEW_PROFILE',
  'ADMIN_PANEL',
  'VIEW_SETTINGS',
  'VIEW_USERS',
  'VIEW_USERS_TABLE',
  'EDIT_USER',
  'DELETE_USER',
  'OPTION_VIEW',
  'OPTION_EDIT',
] as const;

@Injectable({ providedIn: 'root' })
export class PermissionService {
  /** Underlying framework-free store — the single source of truth. */
  private readonly core = new InMemoryPermissionStore([...ALL_PERMISSIONS]);

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

  /** Switch between Full / Partial / None demo modes. */
  useDemoMode(mode: 'full' | 'partial' | 'none'): void {
    if (mode === 'full') this.setPermissions([...ALL_PERMISSIONS]);
    else if (mode === 'partial')
      this.setPermissions(['VIEW_HOME', 'VIEW_PROFILE', 'OPTION_VIEW', 'EDIT_USER']);
    else this.setPermissions([]);
  }
}
