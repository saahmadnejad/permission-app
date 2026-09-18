/**
 * Central permission-node registry — single source of truth (Q6).
 * Replaces ad-hoc `new PermissionNode(...)` scattered across templates.
 * Components reference nodes by `id`; tests assert against the registry.
 */
import type { PermissionNodeDef } from './types.js';

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
