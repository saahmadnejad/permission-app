import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_PERMISSIONS,
  DEMO_NODE_IDS,
  PARTIAL_PERMISSIONS,
  demoNode,
  registerDemoNodes,
} from '../src/index.js';
import { canFromSet, isNodeVisible, permissionRegistry } from 'permission-visibility-core';

describe('demo-data', () => {
  it('dataset is the single source both playgrounds share', () => {
    assert.equal(ALL_PERMISSIONS.length, 10);
    assert.deepEqual([...PARTIAL_PERMISSIONS], [
      'VIEW_HOME',
      'VIEW_PROFILE',
      'OPTION_VIEW',
      'EDIT_USER',
    ]);
    permissionRegistry.clear();
    registerDemoNodes();
    assert.deepEqual([...permissionRegistry.ids()].sort(), [...DEMO_NODE_IDS].sort());
    const table = demoNode('users-table');
    assert.equal(table.children?.length, 2);
  });

  it('library rule holds on the shared dataset (adapter contract)', () => {
    permissionRegistry.clear();
    registerDemoNodes();
    const table = demoNode('users-table');
    // Full grants: container + own check pass, children visible.
    assert.equal(
      isNodeVisible(table, canFromSet([...ALL_PERMISSIONS])),
      true,
    );
    // Container permission revoked: hidden even though EDIT_USER is granted.
    assert.equal(
      isNodeVisible(
        table,
        canFromSet(['EDIT_USER', 'DELETE_USER']),
      ),
      false,
    );
  });
});
