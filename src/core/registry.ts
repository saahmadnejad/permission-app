/**
 * Central permission-node registry — single source of truth (Q6).
 * Replaces ad-hoc `new PermissionNode(...)` scattered across templates.
 * Components reference nodes by `id`; tests assert against the registry.
 */
import type { PermissionNodeDef } from './types';

class PermissionRegistry {
  private nodes = new Map<string, PermissionNodeDef>();

  /** Register (or overwrite) a node. Ids must be unique. */
  define(node: PermissionNodeDef & { id: string }): PermissionNodeDef {
    if (!node.id) throw new Error('PermissionRegistry.define requires an id');
    this.nodes.set(node.id, node);
    return node;
  }

  defineAll(nodes: Array<PermissionNodeDef & { id: string }>): void {
    for (const n of nodes) this.define(n);
  }

  get(id: string): PermissionNodeDef {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Unknown permission node: "${id}"`);
    return node;
  }

  tryGet(id: string): PermissionNodeDef | undefined {
    return this.nodes.get(id);
  }

  has(id: string): boolean {
    return this.nodes.has(id);
  }

  clear(): void {
    this.nodes.clear();
  }

  ids(): string[] {
    return [...this.nodes.keys()];
  }
}

export const permissionRegistry = new PermissionRegistry();

export function defineNode(node: PermissionNodeDef & { id: string }): PermissionNodeDef {
  return permissionRegistry.define(node);
}

export function defineNodes(nodes: Array<PermissionNodeDef & { id: string }>): void {
  permissionRegistry.defineAll(nodes);
}

/** Demo nodes mirroring the previous AppComponent wiring (single source now). */
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
