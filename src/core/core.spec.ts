import { canFromSet, evaluateQuery, isNodeEnabled, isNodeVisible } from './evaluate';
import { canActivateRoute, canShowNode, visibleChildren } from './guards';
import { defineNodes, permissionRegistry, registerDemoNodes } from './registry';
import { AsyncPermissionStore, InMemoryPermissionStore } from './store';

describe('core/evaluate', () => {
  const can = canFromSet(['VIEW_HOME', 'EDIT_USER']);

  it('evaluates flat strings', () => {
    expect(can('VIEW_HOME')).toBe(true);
    expect(can('DELETE_USER')).toBe(false);
  });

  it('evaluates composites', () => {
    expect(can({ all: ['VIEW_HOME', 'EDIT_USER'] })).toBe(true);
    expect(can({ all: ['VIEW_HOME', 'DELETE_USER'] })).toBe(false);
    expect(can({ any: ['DELETE_USER', 'EDIT_USER'] })).toBe(true);
    expect(can({ not: 'DELETE_USER' })).toBe(true);
    expect(can({ perm: 'EDIT_USER', context: { owner: 'x' } })).toBe(true);
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
    expect(seen).toEqual({ owner: 'a' });
  });

  it('parent visible = own && anyChild; layout parent = anyChild', () => {
    // container with own perm denied hides even with visible child (Q2)
    expect(
      isNodeVisible(
        { query: 'ADMIN_PANEL', children: [{ query: 'VIEW_HOME' }] },
        can,
      ),
    ).toBe(false);
    // layout container shows when any child visible
    expect(
      isNodeVisible({ query: null, children: [{ query: 'NOPE' }, { query: 'VIEW_HOME' }] }, can),
    ).toBe(true);
    expect(
      isNodeVisible({ query: null, children: [{ query: 'NOPE' }] }, can),
    ).toBe(false);
    // leaf
    expect(isNodeVisible({ query: 'VIEW_HOME' }, can)).toBe(true);
    // legacy PermissionNode compat: '' = layout, 'X' = query
    expect(
      isNodeVisible(
        { permission: '', children: [{ permission: 'VIEW_HOME', actionable: true }] } as never,
        can,
      ),
    ).toBe(true);
  });

  it('enabled is orthogonal to visible', () => {
    expect(isNodeEnabled({ query: 'EDIT_USER' }, can)).toBe(true);
    expect(isNodeEnabled({ query: 'DELETE_USER' }, can)).toBe(false);
    expect(isNodeEnabled({ query: null }, can)).toBe(true);
  });
});

describe('core/guards', () => {
  const can = canFromSet(['VIEW_USERS']);

  it('canActivateRoute fail-closed without checker; open for layout routes', () => {
    expect(canActivateRoute('VIEW_USERS', can)).toBe(true);
    expect(canActivateRoute('ADMIN_PANEL', can)).toBe(false);
    expect(canActivateRoute('ADMIN_PANEL', null)).toBe(false);
    expect(canActivateRoute(null, can)).toBe(true);
  });

  it('canShowNode + visibleChildren filter', () => {
    const node = {
      query: null,
      children: [{ query: 'VIEW_USERS' }, { query: 'NOPE' }],
    };
    expect(canShowNode(node, can)).toBe(true);
    expect(visibleChildren(node.children, can)).toEqual([{ query: 'VIEW_USERS' }]);
    expect(visibleChildren(node.children, null)).toEqual([]);
  });
});

describe('core/store', () => {
  it('InMemory store: setPermissions notifies, fail-closed never triggers (always ready)', () => {
    const store = new InMemoryPermissionStore(['A']);
    expect(store.status).toBe('ready');
    expect(store.can('A')).toBe(true);
    let calls = 0;
    const off = store.onChange(() => calls++);
    store.setPermissions(['B']);
    expect(store.can('A')).toBe(false);
    expect(store.can('B')).toBe(true);
    expect(calls).toBe(1);
    off();
    store.setPermissions(['C']);
    expect(calls).toBe(1);
  });

  it('Async store fail-closed while loading / on error', async () => {
    let gate!: (v: readonly string[]) => void;
    const pending = new Promise<readonly string[]>((res) => (gate = res));
    const store = new AsyncPermissionStore(() => pending, { eager: false });
    expect(store.status).toBe('loading');
    expect(store.can('A')).toBe(false); // fail-closed
    const refreshing = store.refresh();
    gate(['A']);
    await refreshing;
    expect(store.status).toBe('ready');
    expect(store.can('A')).toBe(true);

    const failing = new AsyncPermissionStore(
      () => Promise.reject(new Error('down')),
      { eager: false },
    );
    await failing.refresh();
    expect(failing.status).toBe('error');
    expect(failing.can('A')).toBe(false);
  });
});

describe('core/registry', () => {
  it('define/get + demo nodes single-source (Q6)', () => {
    permissionRegistry.clear();
    defineNodes([{ id: 'x', query: 'VIEW_HOME' }]);
    expect(permissionRegistry.get('x').query).toBe('VIEW_HOME');
    expect(() => permissionRegistry.get('missing')).toThrow();
    permissionRegistry.clear();
    registerDemoNodes();
    expect(permissionRegistry.ids()).toContain('users-table');
    const table = permissionRegistry.get('users-table');
    expect(table.children?.length).toBe(2);
  });
});
