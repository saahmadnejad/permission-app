/**
 * Route-guard helpers — same `can()` feeds router + UI (Q3, Q8).
 * Pure: no Angular Router / React Router imports. Adapters wrap these.
 */
import { isNodeVisible, resolveQuery } from './evaluate.js';
import type { CanFn } from './evaluate.js';
import type { PermissionContext, PermissionNodeDef, QueryInput } from './types.js';

/** Can this route activate for the given checker? Fail-closed on null checker. */
export function canActivateRoute(
  query: QueryInput,
  can: CanFn | null | undefined,
  ctx?: PermissionContext | unknown,
): boolean {
  if (!can) return false;
  const resolved = resolveQuery(query, ctx);
  if (resolved === null) return true; // layout route — nothing to check
  return can(resolved, ctx);
}

/** Can this node subtree render (shared by UI adapters + guards)? */
export function canShowNode(
  node: PermissionNodeDef,
  can: CanFn | null | undefined,
  ctx?: PermissionContext | unknown,
): boolean {
  if (!can) return false;
  return isNodeVisible(node, can, ctx);
}

/** Filter a list to visible items (navs, dropdown options, table actions). */
export function visibleChildren<T extends PermissionNodeDef>(
  children: readonly T[] | undefined,
  can: CanFn | null | undefined,
  ctx?: PermissionContext | unknown,
): T[] {
  if (!children || !can) return [];
  return children.filter((c) => isNodeVisible(c, can, ctx));
}
