/**
 * Shared demo dataset — the ONE source of truth for both playgrounds.
 * Lives outside the library on purpose: demos depend on data, the library
 * must never depend on (or ship) demo policy.
 */
import type { PermissionNodeDef } from 'permission-visibility-core';
import { defineNodes, permissionRegistry } from 'permission-visibility-core';

export const ALL_PERMISSIONS = [
  'VIEW_HOME',
  'VIEW_PROFILE',
  'ADMIN_PANEL',
  'VIEW_SETTINGS',
  'VIEW_USERS',
  'VIEW_USERS_TABLE',
  'EDIT_USER',
  'DELETE_USER',
  'OPTION_VIEW',
  'OPTION_EDIT',
] as const;

export type DemoPermission = (typeof ALL_PERMISSIONS)[number];

export const PARTIAL_PERMISSIONS: readonly string[] = [
  'VIEW_HOME',
  'VIEW_PROFILE',
  'OPTION_VIEW',
  'EDIT_USER',
];

/** Nodes mirroring the original AppComponent wiring. Idempotent. */
export function registerDemoNodes(): void {
  defineNodes([
    {
      id: 'main-nav',
      query: null,
      denied: 'hide',
      children: [
        { query: 'VIEW_HOME', url: '/home', actionable: true, label: 'VIEW_HOME' },
        { query: 'VIEW_PROFILE', url: '/profile', actionable: true, label: 'VIEW_PROFILE' },
      ],
    },
    {
      id: 'sub-nav',
      query: 'ADMIN_PANEL',
      denied: 'hide',
      children: [
        { query: 'VIEW_SETTINGS', url: '/settings', actionable: true, label: 'VIEW_SETTINGS' },
        { query: 'VIEW_USERS', url: '/users', actionable: true, label: 'VIEW_USERS' },
      ],
    },
    {
      id: 'users-table',
      query: 'VIEW_USERS_TABLE',
      denied: 'hide',
      children: [
        {
          id: 'edit-user',
          query: (row?: unknown) => ({
            perm: 'EDIT_USER',
            context:
              row && typeof row === 'object'
                ? { owner: (row as Record<string, unknown>)['ownerId'] ?? row }
                : undefined,
          }),
          denied: 'disable',
        },
        { id: 'delete-user', query: 'DELETE_USER', denied: 'disable' },
      ],
    },
    {
      id: 'options-dropdown',
      query: null,
      denied: 'hide',
      children: [
        { query: 'OPTION_VIEW', url: 'view', label: 'OPTION_VIEW' },
        { query: 'OPTION_EDIT', url: 'edit', label: 'OPTION_EDIT' },
      ],
    },
    {
      id: 'confirm-modal',
      query: null,
      denied: 'hide',
      children: [
        { query: 'EDIT_USER', label: 'EDIT_USER' },
        { query: 'DELETE_USER', label: 'DELETE_USER' },
      ],
    },
    { id: 'standalone-edit', query: 'EDIT_USER', denied: 'hide' },
    { id: 'standalone-delete', query: 'DELETE_USER', denied: 'hide' },
  ]);
}

export const DEMO_NODE_IDS = [
  'main-nav',
  'sub-nav',
  'users-table',
  'options-dropdown',
  'confirm-modal',
  'standalone-edit',
  'standalone-delete',
] as const;

export type DemoNodeId = (typeof DEMO_NODE_IDS)[number];

export function demoNode(id: DemoNodeId): PermissionNodeDef {
  return permissionRegistry.get(id);
}
