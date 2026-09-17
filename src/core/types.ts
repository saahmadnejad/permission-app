/**
 * Core permission types — pure TypeScript, zero framework dependencies.
 * Portable: importable as-is from Angular, React, Vue, Node, tests.
 *
 * SOLID:
 *  - ISP: small focused types, components depend only on what they need.
 *  - OCP: Query is a union — new operators extend without editing callers.
 */

/** Runtime context for contextual checks (row, tenant, ownerId, ...). */
export type PermissionContext = Record<string, unknown>;

/** Atomic permission with optional inline context. */
export interface PermWithContext {
  perm: string;
  context?: PermissionContext;
}

/**
 * Permission query language (Q1).
 * Start with plain strings; composites cost nothing until needed.
 */
export type Query =
  | string
  | { all: Query[] }
  | { any: Query[] }
  | { not: Query }
  | PermWithContext;

/** A query, a context-bound query factory (for row-level), or empty (layout node). */
export type QueryInput = Query | ((ctx?: PermissionContext | unknown) => Query) | null | undefined;

/** What to do when `can()` is false (Q7). */
export type DeniedBehavior = 'hide' | 'disable' | 'show-locked';

/** Loading state of the store (Q10 — fail-closed). */
export type PermissionStatus = 'loading' | 'ready' | 'error';

/**
 * Permission tree node (Q6).
 * `query: null/undefined` = pure layout container (skips own check, Q2).
 * `permission` is legacy compat for the old `PermissionNode` class — prefer `query`.
 */
export interface PermissionNodeDef {
  id?: string;
  query?: QueryInput;
  /** @deprecated use `query` instead. Kept so old `new PermissionNode('X')` still works. */
  permission?: string;
  denied?: DeniedBehavior;
  children?: PermissionNodeDef[];
  /** UI hints — core never reads these, adapters may. */
  actionable?: boolean;
  url?: string;
  label?: string;
}
