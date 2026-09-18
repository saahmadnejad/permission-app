# permission-visibility-core

Framework-free permission engine that makes **every UI component permission-aware**:
a composable query language, a hierarchical visibility rule, fail-closed stores, a
central node registry, and route-guard helpers. Zero dependencies, zero DOM, zero
framework — the same `can()` decision feeds UI visibility, route guards, and any
adapter you write.

Adapters (same rule, same registry, same store):

- `permission-visibility-angular` — Signals `PermissionService`, `*appShowIf`, `permGuard`
- `permission-visibility-react` — `PermissionProvider`, `usePermission`, `<Show>`
- `permission-visibility-demo-data` — shared demo dataset for the playgrounds (not for prod)

## Install

```bash
npm install permission-visibility-core
```

## Query language

```ts
import type { Query } from 'permission-visibility-core';

const a: Query = 'EDIT_USER';                       // plain string
const b: Query = { all: ['VIEW_USERS', 'EDIT_USER'] }; // AND
const c: Query = { any: ['EDIT_USER', 'DELETE_USER'] }; // OR
const d: Query = { not: 'BANNED' };                 // negation
const e: Query = { perm: 'EDIT_USER', context: { owner: 'john' } }; // contextual
```

Start with plain strings; composites cost nothing until needed.

## The visibility rule

```
visible(node) = (node.query ? can(node.query, ctx) : true)
            AND (node.children?.length ? children.some(c => visible(c)) : true)
enabled(node) = node.query ? can(node.query, ctx) : true   // separate concern
```

- `query: null` → layout container (nav wrapper, modal shell): shown iff at least one
  child is visible.
- A container **with** its own permission hides entirely when that check fails — even
  if a child would pass.
- `visible` (render?) and `enabled` (clickable?) are orthogonal on purpose.

## Stores (fail-closed)

```ts
import { InMemoryPermissionStore, AsyncPermissionStore } from 'permission-visibility-core';

// Sync — tests, demos, SSR seeds
const store = new InMemoryPermissionStore(['VIEW_HOME', 'EDIT_USER']);
store.can('EDIT_USER');               // true
store.setPermissions(['VIEW_HOME']);  // emits -> adapters re-render

// Async — API / JWT / ...
const api = new AsyncPermissionStore(async () => fetch('/api/me/perms').then(r => r.json()));
await api.refresh();
api.status;    // 'loading' | 'ready' | 'error'
api.can('X');  // false while loading/error (fail-closed)
```

Custom sources: extend `BasePermissionStore` (or implement the 4-member
`PermissionStore` interface: `status`, `can()`, `onChange()`, `refresh()`).
Any implementation substitutes for any other.

## Registry + guards

```ts
import { defineNode, permissionRegistry, isNodeVisible, canActivateRoute, canFromSet } from 'permission-visibility-core';

defineNode({ id: 'admin-panel', query: 'ADMIN_PANEL', denied: 'hide', children: [] });

const can = canFromSet(['VIEW_HOME', 'EDIT_USER']);
isNodeVisible({ query: null, children: [{ query: 'VIEW_HOME' }] }, can); // true
canActivateRoute('ADMIN_PANEL', can); // false
```

## Public API

| Export | Kind | Purpose |
| --- | --- | --- |
| `evaluateQuery`, `resolveQuery` | fn | evaluate a `Query` against a `CanFn` |
| `isNodeVisible`, `isNodeEnabled` | fn | hierarchical visibility / enabled |
| `canFromSet` | fn | build a `CanFn` from a permission set |
| `InMemoryPermissionStore`, `AsyncPermissionStore`, `BasePermissionStore`, `createStore` | class/fn | fail-closed permission stores |
| `canActivateRoute`, `canShowNode`, `visibleChildren` | fn | guard + parent/child helpers |
| `defineNode`, `defineNodes`, `permissionRegistry` | fn/obj | central node registry |
| `Query`, `QueryInput`, `PermissionNodeDef`, `PermissionContext`, `DeniedBehavior`, `PermissionStatus`, `PermissionStore`, `CanFn`, `HasFn`, `PermissionLoader`, `PermWithContext` | types | — |

## Security note

UI hiding is **UX only**. Guards reduce accidents, they do not stop forged requests —
every route data loader and every API endpoint must re-check server-side.

## License

MIT
