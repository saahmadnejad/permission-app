# permission-visibility-demo-data

Shared demo dataset for the `permission-visibility` playgrounds
(`demos/angular-playground`, `demos/react-playground`).

**Not for production use** — this exists so both demo apps render identical
sections from one source of truth, while the libraries stay free of demo policy.

Depends on [`permission-visibility-core`](https://www.npmjs.com/package/permission-visibility-core).

## What's inside

```ts
import {
  ALL_PERMISSIONS,       // the 10 demo permission strings
  PARTIAL_PERMISSIONS,   // the "Partial" demo mode subset
  registerDemoNodes,     // idempotently defines all demo nodes in the registry
  demoNode,              // registry lookup: demoNode('main-nav')
  DEMO_NODE_IDS,         // ['main-nav', 'sub-nav', 'users-table', ...]
} from 'permission-visibility-demo-data';
import type { DemoPermission, DemoNodeId } from 'permission-visibility-demo-data';
```

Demo node tree mirrors the playgrounds: `main-nav` (layout container), `sub-nav`
(`ADMIN_PANEL` + visible child), `users-table` (row-level contextual `EDIT_USER`
with `denied: 'disable'`, `DELETE_USER`), `options-dropdown`, `confirm-modal`,
and two standalone buttons.

## Usage in a demo app

```ts
import { registerDemoNodes } from 'permission-visibility-demo-data';

registerDemoNodes();          // once, at bootstrap
perms.setPermissions(ALL_PERMISSIONS);    // 'full' mode
perms.setPermissions(PARTIAL_PERMISSIONS); // 'partial' mode
perms.setPermissions([]);                 // 'none' mode — parents disappear
```

## License

MIT
