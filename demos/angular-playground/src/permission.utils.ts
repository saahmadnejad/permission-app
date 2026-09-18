/**
 * Back-compat re-export: old `getNodeVisible$` callers keep working,
 * now delegating to the pure core (sync) wrapped as Observable.
 * New code should use `PermissionService.canSignal/visibleSignal` or `*appShowIf`.
 */
import { Observable, of } from 'rxjs';
import { isNodeVisible, type CanFn } from 'permission-visibility-core';
import type { PermissionContext } from 'permission-visibility-core';
import type { PermissionNodeDef } from 'permission-visibility-core';

export function getNodeVisible$(
  node: PermissionNodeDef,
  permService: { canFn(): CanFn },
): Observable<boolean> {
  return of(isNodeVisible(node, permService.canFn()));
}

export function getChildVisible$(
  node: PermissionNodeDef,
  can: CanFn,
  ctx?: PermissionContext | unknown,
): Observable<boolean> {
  return of(isNodeVisible(node, can, ctx));
}
