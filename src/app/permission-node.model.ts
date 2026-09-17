/**
 * Legacy PermissionNode — kept for backward compat, delegates to core.
 * New code should use core `PermissionNodeDef` + registry instead.
 * Preserved shape so old `new PermissionNode('X', true, '/url', [...])` compiles.
 */
import type { PermissionNodeDef } from '../core';

export class PermissionNode implements PermissionNodeDef {
  id?: string;
  query: string | null;
  permission: string;
  actionable: boolean;
  url?: string;
  children?: PermissionNode[];

  constructor(
    permission: string,
    actionable = false,
    url?: string,
    children?: PermissionNode[],
  ) {
    this.permission = permission;
    this.query = permission === '' ? null : permission;
    this.actionable = actionable;
    this.url = url;
    this.children = children;
  }
}
