/**
 * React adapter stub — proves core portability (Q4).
 * Real React app: `import { isNodeVisible, ... } from 'core'`
 * and wrap with Context + useSyncExternalStore. No Angular/RxJS imports.
 */
import type { CanFn, PermissionContext, PermissionNodeDef, PermissionStore, Query } from '../core';
import { isNodeVisible, resolveQuery } from '../core';

/** Framework-agnostic render decision — usable from any React <Show> component. */
export function showInReact(
  queryOrNode: Query | PermissionNodeDef | string | null | undefined,
  store: Pick<PermissionStore, 'can'>,
  ctx?: PermissionContext | unknown,
): boolean {
  const can: CanFn = (q, c) => store.can(q, c);
  if (
    queryOrNode !== null &&
    typeof queryOrNode === 'object' &&
    ('query' in queryOrNode || 'children' in queryOrNode)
  ) {
    return isNodeVisible(queryOrNode as PermissionNodeDef, can, ctx);
  }
  const resolved = resolveQuery((queryOrNode ?? null) as never, ctx);
  if (resolved === null) return true;
  return can(resolved, ctx);
}

/**
 * Sketch of the React wiring (copy into a .tsx file in a React project):
 *
 * ```tsx
 * import { createContext, useContext, useSyncExternalStore } from 'react';
 * import { showInReact, type Query, type PermissionStore } from './core';
 *
 * const PermCtx = createContext<PermissionStore | null>(null);
 * export const usePermissionStore = () => {
 *   const s = useContext(PermCtx);
 *   if (!s) throw new Error('Missing PermissionProvider');
 *   return s;
 * };
 * export function usePermission(q: Query, ctx?: unknown): boolean {
 *   const store = usePermissionStore();
 *   return useSyncExternalStore(
 *     (cb) => store.onChange(cb),
 *     () => showInReact(q, store, ctx),
 *   );
 * }
 * export function Show({ query, context, denied = 'hide', fallback = null, children }:
 *   { query: Query; context?: unknown; denied?: 'hide'|'disable'|'show-locked'; fallback?: React.ReactNode; children: React.ReactNode }) {
 *   const ok = usePermission(query, context);
 *   if (ok) return <>{children}</>;
 *   if (denied === 'hide') return <>{fallback}</>;
 *   return <span aria-disabled="true" data-locked={denied === 'show-locked'}>{children}</span>;
 * }
 * export function ProtectedRoute({ query, children }: { query: Query; children: React.ReactNode }) {
 *   const ok = usePermission(query);
 *   if (!ok) return <Navigate to="/denied" replace />;
 *   return <>{children}</>;
 * }
 * ```
 */
