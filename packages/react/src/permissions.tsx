/**
 * React adapter over the shared framework-free core.
 * Mirrors the Angular adapter 1:1 — same store, same rule, same registry.
 */
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import {
  InMemoryPermissionStore,
  canShowNode,
  isNodeVisible,
  resolveQuery,
  type DeniedBehavior,
  type PermissionContext,
  type PermissionNodeDef,
  type PermissionStore,
  type Query,
  type QueryInput,
} from 'permission-visibility-core';

const PermCtx = createContext<PermissionStore | null>(null);

/** Singleton store for the demo (swap for AsyncPermissionStore in a real app). */
let singleton: InMemoryPermissionStore | null = null;
export function getStore(): InMemoryPermissionStore {
  if (!singleton) singleton = new InMemoryPermissionStore();
  return singleton;
}

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => getStore(), []);
  return <PermCtx.Provider value={store}>{children}</PermCtx.Provider>;
}

export function usePermissionStore(): PermissionStore {
  const s = useContext(PermCtx);
  if (!s) throw new Error('Missing <PermissionProvider>');
  return s;
}

function decide(
  queryOrNode: QueryInput | PermissionNodeDef,
  store: PermissionStore,
  ctx?: PermissionContext | unknown,
): boolean {
  const can = (q: Query, c?: PermissionContext | unknown) => store.can(q, c);
  const raw = queryOrNode as PermissionNodeDef | Query | null | undefined;
  if (raw !== null && typeof raw === 'object' && ('query' in raw || 'children' in raw)) {
    return isNodeVisible(raw as PermissionNodeDef, can, ctx);
  }
  const resolved = resolveQuery((raw ?? null) as never, ctx);
  if (resolved === null) return true;
  return can(resolved, ctx);
}

/** Reactive permission check — re-renders on store change (useSyncExternalStore). */
export function usePermission(query: QueryInput | PermissionNodeDef, ctx?: unknown): boolean {
  const store = usePermissionStore();
  return useSyncExternalStore(
    (cb) => store.onChange(cb),
    () => decide(query, store, ctx),
    () => decide(query, store, ctx),
  );
}

/** Node-subtree variant (same canShowNode the Angular directive uses). */
export function useNodeVisible(node: PermissionNodeDef, ctx?: unknown): boolean {
  const store = usePermissionStore();
  return useSyncExternalStore(
    (cb) => store.onChange(cb),
    () => canShowNode(node, (q, c) => store.can(q, c), ctx),
    () => canShowNode(node, (q, c) => store.can(q, c), ctx),
  );
}

/** `<Show>` — the React twin of Angular's `*appShowIf`. */
export function Show({
  query,
  context,
  denied = 'hide',
  fallback = null,
  children,
}: {
  query: QueryInput | PermissionNodeDef;
  context?: unknown;
  denied?: DeniedBehavior;
  fallback?: React.ReactNode;
  children: React.ReactNode | ((state: { disabled: boolean; locked: boolean }) => React.ReactNode);
}) {
  const ok = usePermission(query, context);
  if (ok) return <>{typeof children === 'function' ? children({ disabled: false, locked: false }) : children}</>;
  if (denied === 'hide') return <>{fallback}</>;
  if (denied === 'disable')
    return <>{typeof children === 'function' ? children({ disabled: true, locked: false }) : <span aria-disabled="true">{children}</span>}</>;
  return <>{typeof children === 'function' ? children({ disabled: false, locked: true }) : <span data-locked="true">{children}</span>}</>;
}
