/**
 * Pure permission evaluation — no Angular, no RxJS, no DOM (Q4).
 * All functions are sync + side-effect free, so they run identically
 * in Angular, React, Node, and unit tests.
 */
import type { PermissionContext, PermWithContext, Query, QueryInput } from './types';

/**
 * Minimal checker interface (ISP/DIP).
 * Components depend on this 1-method contract — not on a whole service.
 */
export type CanFn = (query: Query, ctx?: PermissionContext | unknown) => boolean;

/** Resolve a QueryInput (string | composite | factory | null) to a concrete Query. */
export function resolveQuery(
  input: QueryInput,
  ctx?: PermissionContext | unknown,
): Query | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'function') {
    return (input as (c?: PermissionContext | unknown) => Query)(ctx);
  }
  return input as Query;
}

/**
 * Evaluate one query against a primitive `has(perm, ctx)` check.
 * Composite semantics: all=AND, any=OR, not=NOT.
 */
export function evaluateQuery(
  query: Query,
  has: (perm: string, ctx?: PermissionContext | unknown) => boolean,
  ctx?: PermissionContext | unknown,
): boolean {
  if (typeof query === 'string') return has(query, ctx);
  if (typeof query !== 'object' || query === null) return false;
  if ('all' in query) return (query as { all: Query[] }).all.every((q) => evaluateQuery(q, has, ctx));
  if ('any' in query) return (query as { any: Query[] }).any.some((q) => evaluateQuery(q, has, ctx));
  if ('not' in query) return !evaluateQuery((query as { not: Query }).not, has, ctx);
  if ('perm' in query) {
    const p = query as PermWithContext;
    return has(p.perm, p.context ?? ctx);
  }
  return false;
}

export interface VisibilityNode {
  query?: QueryInput;
  /** legacy compat */
  permission?: string;
  children?: VisibilityNode[];
}

function ownQueryOf(node: VisibilityNode): QueryInput {
  if (node.query !== undefined) return node.query;
  // Legacy: PermissionNode class instances carry `permission`. '' means layout.
  if (typeof node.permission === 'string') {
    return node.permission === '' ? null : node.permission;
  }
  return null;
}

/**
 * Visibility rule (Q2):
 *   visible = (own ? can(own) : true) AND (children?.length ? some(child visible) : true)
 * Layout containers (own == null) only need one visible child.
 */
export function isNodeVisible(
  node: VisibilityNode,
  can: CanFn,
  ctx?: PermissionContext | unknown,
): boolean {
  const own = resolveQuery(ownQueryOf(node), ctx);
  if (own !== null && !can(own, ctx)) return false;
  const children = node.children;
  if (!children || children.length === 0) return true;
  return children.some((child) => isNodeVisible(child, can, ctx));
}

/** Enabled/clickable is orthogonal to visible (Q2). */
export function isNodeEnabled(
  node: VisibilityNode,
  can: CanFn,
  ctx?: PermissionContext | unknown,
): boolean {
  const own = resolveQuery(ownQueryOf(node), ctx);
  if (own === null) return true;
  return can(own, ctx);
}

/** Build a CanFn from a primitive set-membership check. Test-friendly. */
export function canFromSet(
  perms: ReadonlySet<string> | readonly string[],
  has?: (perm: string, ctx?: PermissionContext | unknown) => boolean,
): CanFn {
  const set = perms instanceof Set ? perms : new Set(perms);
  const primitive = has ?? ((perm: string) => set.has(perm));
  return (query, ctx) => evaluateQuery(query, primitive, ctx);
}
