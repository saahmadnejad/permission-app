/**
 * PermissionStore contract + framework-free implementations (Q5, Q10).
 * Core depends on the `PermissionStore` abstraction (DIP).
 * Angular/React adapters implement or wrap it — never the reverse.
 */
import { canFromSet, evaluateQuery, type CanFn } from './evaluate';
import type { PermissionContext, Query } from './types';
import type { PermissionStatus } from './types';

/** Loader signature for async sources (API, JWT, ...). */
export type PermissionLoader = () => Promise<readonly string[]> | readonly string[];

/**
 * Minimal store contract (ISP):
 *  - `can()` is sync for render paths (no flicker).
 *  - `onChange` notifies adapters to re-render.
 *  - `refresh()` reloads from the loader.
 * Fail-closed: `loading`/`error` => can() returns false (Q10).
 */
export interface PermissionStore {
  readonly status: PermissionStatus;
  can(query: Query, ctx?: PermissionContext | unknown): boolean;
  onChange(cb: () => void): () => void;
  refresh(): Promise<void>;
}

export type HasFn = (perm: string, ctx?: PermissionContext | unknown) => boolean;

/** Base class holding listener plumbing + status. Extend for new sources (OCP). */
export abstract class BasePermissionStore implements PermissionStore {
  protected listeners = new Set<() => void>();
  protected _status: PermissionStatus = 'ready';

  get status(): PermissionStatus {
    return this._status;
  }

  abstract can(query: Query, ctx?: PermissionContext | unknown): boolean;
  abstract refresh(): Promise<void>;

  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  protected emit(): void {
    for (const cb of [...this.listeners]) cb();
  }

  protected setStatus(s: PermissionStatus): void {
    this._status = s;
    this.emit();
  }
}

/** Sync in-memory store — tests, demos, SSR seeds. Substitutable for any store (LSP). */
export class InMemoryPermissionStore extends BasePermissionStore {
  private perms: Set<string>;
  private hasFn: HasFn;

  constructor(perms: Iterable<string> = [], hasFn?: HasFn) {
    super();
    this.perms = new Set(perms);
    this.hasFn = hasFn ?? ((perm) => this.perms.has(perm));
  }

  setPermissions(perms: Iterable<string>): void {
    this.perms = new Set(perms);
    this.emit();
  }

  override can(query: Query, ctx?: PermissionContext | unknown): boolean {
    if (this._status !== 'ready') return false;
    return evaluateQuery(query, this.hasFn, ctx);
  }

  override async refresh(): Promise<void> {
    this.emit();
  }

  /** Expose a CanFn bound to this store for pure helpers. */
  canFn(): CanFn {
    return (q: Query, ctx?: PermissionContext | unknown) => this.can(q, ctx);
  }
}

/**
 * Async store — loads via `loader` (fetch/JWT/...).
 * Starts `loading` (fail-closed), transitions to `ready`/`error`.
 */
export class AsyncPermissionStore extends BasePermissionStore {
  private perms: Set<string> = new Set();
  private hasFn: HasFn | undefined;

  constructor(
    private loader: PermissionLoader,
    opts?: { initial?: Iterable<string>; has?: HasFn; eager?: boolean },
  ) {
    super();
    this._status = 'loading';
    if (opts?.initial) this.perms = new Set(opts.initial);
    this.hasFn = opts?.has;
    if (opts?.eager !== false) void this.refresh();
  }

  setPermissions(perms: Iterable<string>): void {
    this.perms = new Set(perms);
    this.setStatus('ready');
  }

  override can(query: Query, ctx?: PermissionContext | unknown): boolean {
    if (this._status !== 'ready') return false; // fail-closed (Q10)
    const primitive: HasFn =
      this.hasFn ?? ((perm) => this.perms.has(perm));
    return evaluateQuery(query, primitive, ctx);
  }

  override async refresh(): Promise<void> {
    this.setStatus('loading');
    try {
      const loaded = await this.loader();
      this.perms = new Set(loaded);
      this.setStatus('ready');
    } catch {
      this.setStatus('error');
    }
  }

  canFn(): CanFn {
    return (q: Query, ctx?: PermissionContext | unknown) => this.can(q, ctx);
  }
}

/** Helper for demos/tests. */
export function createStore(perms: readonly string[] = []): InMemoryPermissionStore {
  return new InMemoryPermissionStore(perms);
}

export { canFromSet };
