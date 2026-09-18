/** Public core barrel — the only import portable adapters need. */
export type {
  CanFn,
} from './evaluate.js';
export {
  canFromSet,
  evaluateQuery,
  isNodeEnabled,
  isNodeVisible,
  resolveQuery,
} from './evaluate.js';
export {
  AsyncPermissionStore,
  BasePermissionStore,
  InMemoryPermissionStore,
  createStore,
} from './store.js';
export type { HasFn, PermissionLoader, PermissionStore } from './store.js';
export {
  canActivateRoute,
  canShowNode,
  visibleChildren,
} from './guards.js';
export {
  defineNode,
  defineNodes,
  permissionRegistry,
} from './registry.js';
export type {
  DeniedBehavior,
  PermissionContext,
  PermissionNodeDef,
  PermissionStatus,
  PermWithContext,
  Query,
  QueryInput,
} from './types.js';
