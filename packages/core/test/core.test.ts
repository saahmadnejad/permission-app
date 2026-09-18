import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canFromSet, evaluateQuery, isNodeEnabled, isNodeVisible } from '../src/evaluate.js';
import { canActivateRoute, canShowNode, visibleChildren } from '../src/guards.js';
import { defineNodes, permissionRegistry } from '../src/registry.js';
import { AsyncPermissionStore, InMemoryPermissionStore } from '../src/store.js';

describe('core/evaluate', () => {
  const can = canFromSet(['VIEW_HOME', 'EDIT_USER']);

  it('evaluates flat strings', () => {
    assert.equal(can('VIEW_HOME'), true);
    assert.equal(can('DELETE_USER'), false);
  });

  it('evaluates composites', () => {
    assert.equal(can({ all: ['VIEW_HOME', 'EDIT_USER'] }), true);
    assert.equal(can({ all: ['VIEW_HOME', 'DELETE_USER'] }), false);
    assert.equal(can({ any: ['DELETE_USER', 'EDIT_USER'] }), true);
    assert.equal(can({ not: 'DELETE_USER' }), true);
    assert.equal(can({ perm: 'EDIT_USER', context: { owner: 'x' } }), true);
  });

  it('passes context to the primitive', () => {
    let seen: unknown;
    evaluateQuery(
      { perm: 'EDIT_USER', context: { owner: 'a' } },
      (p, ctx) => {
        seen = ctx;
        return p === 'EDIT_USER';
      },
      { fallback: 1 },
    );
    assert.deepEqual(seen, { owner: 'a' });
  });

  it('parent visible = own && anyChild; layout parent = anyChild', () => {
    // container with own perm denied hides even with visible child (Q2)
    assert.equal(
      isNodeVisible(
        { query: 'ADMIN_PANEL', children: [{ query: 'VIEW_HOME' }] },
        can,
      ),
      false,
    );
    // layout container shows when any child visible
    assert.equal(
      isNodeVisible({ query: null, children: [{ query: 'NOPE' }, { query: 'VIEW_HOME' }] }, can),
      true,
    );
    assert.equal(
      isNodeVisible({ query: null, children: [{ query: 'NOPE' }] }, can),
      false,
    );
    // leaf
    assert.equal(isNodeVisible({ query: 'VIEW_HOME' }, can), true);
    // legacy PermissionNode compat: '' = layout, 'X' = query
    assert.equal(
      isNodeVisible(
        { permission: '', children: [{ permission: 'VIEW_HOME', actionable: true }] } as never,
        can,
      ),
      true,
    );
  });

  it('enabled is orthogonal to visible', () => {
    assert.equal(isNodeEnabled({ query: 'EDIT_USER' }, can), true);
    assert.equal(isNodeEnabled({ query: 'DELETE_USER' }, can), false);
    assert.equal(isNodeEnabled({ query: null }, can), true);
  });
});

describe('core/guards', () => {
  const can = canFromSet(['VIEW_USERS']);

  it('canActivateRoute fail-closed without checker; open for layout routes', () => {
    assert.equal(canActivateRoute('VIEW_USERS', can), true);
    assert.equal(canActivateRoute('ADMIN_PANEL', can), false);
    assert.equal(canActivateRoute('ADMIN_PANEL', null), false);
    assert.equal(canActivateRoute(null, can), true);
  });

  it('canShowNode + visibleChildren filter', () => {
    const node = {
      query: null,
      children: [{ query: 'VIEW_USERS' }, { query: 'NOPE' }],
    };
    assert.equal(canShowNode(node, can), true);
    assert.deepEqual(visibleChildren(node.children, can), [{ query: 'VIEW_USERS' }]);
    assert.deepEqual(visibleChildren(node.children, null), []);
  });
});

describe('core/store', () => {
  it('InMemory store: setPermissions notifies, fail-closed never triggers (always ready)', () => {
    const store = new InMemoryPermissionStore(['A']);
    assert.equal(store.status, 'ready');
    assert.equal(store.can('A'), true);
    let calls = 0;
    const off = store.onChange(() => calls++);
    store.setPermissions(['B']);
    assert.equal(store.can('A'), false);
    assert.equal(store.can('B'), true);
    assert.equal(calls, 1);
    off();
    store.setPermissions(['C']);
    assert.equal(calls, 1);
  });

  it('Async store fail-closed while loading / on error', async () => {
    let gate!: (v: readonly string[]) => void;
    const pending = new Promise<readonly string[]>((res) => (gate = res));
    const store = new AsyncPermissionStore(() => pending, { eager: false });
    assert.equal(store.status, 'loading');
    assert.equal(store.can('A'), false); // fail-closed
    const refreshing = store.refresh();
    gate(['A']);
    await refreshing;
    assert.equal(store.status, 'ready');
    assert.equal(store.can('A'), true);

    const failing = new AsyncPermissionStore(
      () => Promise.reject(new Error('down')),
      { eager: false },
    );
    await failing.refresh();
    assert.equal(failing.status, 'error');
    assert.equal(failing.can('A'), false);
  });
});

describe('core/registry', () => {
  it('define/get/throw are mechanism-only (dataset lives in demo-data)', () => {
    permissionRegistry.clear();
    defineNodes([{ id: 'x', query: 'VIEW_HOME' }]);
    assert.equal(permissionRegistry.get('x').query, 'VIEW_HOME');
    assert.throws(() => permissionRegistry.get('missing'));
    assert.equal(permissionRegistry.has('x'), true);
    permissionRegistry.clear();
    assert.deepEqual(permissionRegistry.ids(), []);
  });
});
