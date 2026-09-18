/**
 * Route guard helper (Q3/Q8) — same core can() feeds router + UI.
 * Usage in routes:  { path: 'users', component: X, canActivate: [permGuard], data: { perm: 'VIEW_USERS' } }
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { canActivateRoute, resolveQuery } from 'permission-visibility-core';
import { PermissionService } from './permission.service.js';

export const permGuard: CanActivateFn = (route) => {
  const perms = inject(PermissionService);
  const router = inject(Router);
  const perm = route.data?.['perm'] ?? route.data?.['permQuery'] ?? null;
  const ctx = route.data?.['permContext'];
  const resolved = resolveQuery(perm, ctx);
  const ok = canActivateRoute(resolved, (q, c) => perms.can(q, c), ctx);
  if (ok) return true;
  const redirect = route.data?.['deniedRedirect'] ?? '/';
  return router.createUrlTree([redirect]);
};
