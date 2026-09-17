/** Public core barrel — the only import portable adapters need. */
export type {
  CanFn,
} from './evaluate';
export {
  canFromSet,
  evaluateQuery,
  isNodeEnabled,
  isNodeVisible,
  resolveQuery,
} from './evaluate';
export {
  AsyncPermissionStore,
  BasePermissionStore,
  InMemoryPermissionStore,
  createStore,
} from './store';
export type { HasFn, PermissionLoader, PermissionStore } from './store';
export {
  canActivateRoute,
  canShowNode,
  visibleChildren,
} from './guards';
export {
  defineNode,
  defineNodes,
  permissionRegistry,
  registerDemoNodes,
} from './registry';
export type {
  DeniedBehavior,
  PermissionContext,
  PermissionNodeDef,
  PermissionStatus,
  PermWithContext,
  Query,
  QueryInput,
} from './types';
