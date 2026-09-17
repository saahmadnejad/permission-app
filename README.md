# PermissionApp — permission-aware UI hierarchy

A small Angular 20 demo + a **framework-free permission core** (`src/core`) that makes
**every UI component permission-aware**.

Rule: a parent (sidebar section, nav, table, modal...) is shown **iff it is itself
allowed AND at least one child in its subtree is visible**. Layout-only containers
skip the own-check. Hiding is UX only — the same `can()` decision also feeds route
guards, and the backend must re-check.

```
src/
  core/   # pure TS, zero Angular/RxJS/DOM — importable from React as-is
    types.ts     # Query, QueryInput, PermissionNodeDef, DeniedBehavior
    evaluate.ts  # evaluateQuery(), isNodeVisible(), isNodeEnabled(), CanFn
    store.ts     # PermissionStore, InMemoryPermissionStore, AsyncPermissionStore
    registry.ts  # central permissionRegistry + defineNode(s)
    guards.ts    # canActivateRoute(), canShowNode(), visibleChildren()
  app/    # thin Angular adapters + dumb demo UI
    permission.service.ts  # Signal-based adapter over the core store
    show-if.directive.ts   # *appShowIf="query|node; context:ctx; denied:..."
    perm.guard.ts          # CanActivateFn from the same can()
  react/
    adapter.ts  # showInReact() + copy-paste usePermission/<Show>/<ProtectedRoute> sketch
```

## Quick start

```bash
yarn install
ng serve        # -> http://localhost:4200/
ng build
ng test
```

## 1. Core concepts

### Permission queries

```ts
import type { Query } from './core';

const a: Query = 'EDIT_USER';
const b: Query = { all: ['VIEW_USERS', 'EDIT_USER'] };
const c: Query = { any: ['EDIT_USER', 'DELETE_USER'] };
const d: Query = { not: 'BANNED' };
const e: Query = { perm: 'EDIT_USER', context: { owner: 'john' } };
```

Start with plain strings; composites cost nothing until needed.

### Visibility rule

```
visible(node) = (node.query ? can(node.query, ctx) : true)
            AND (node.children?.length ? children.some(c => visible(c)) : true)
enabled(node) = node.query ? can(node.query, ctx) : true   // separate concern
```

- `query: null` -> layout container (nav wrapper, modal shell): only needs one visible child.
- A container **with** its own permission (e.g. `ADMIN_PANEL`) hides entirely when that
  check fails — even if a child would pass.
- `visible` (render?) and `enabled` (clickable?) are orthogonal on purpose.

### Denied behaviour

| mode          | effect                                              | use for              |
| ------------- | --------------------------------------------------- | -------------------- |
| `hide`        | content removed (default for nav/containers)        | nav, menus, sections |
| `disable`     | content stays, `disabled` exposed (default actions) | buttons, row actions |
| `show-locked` | content stays, `locked` exposed for lock-UI         | upsell / teaser      |

### Stores (fail-closed)

```ts
import { InMemoryPermissionStore, AsyncPermissionStore } from './core';

// Sync — tests, demos, SSR seeds
const store = new InMemoryPermissionStore(['VIEW_HOME', 'EDIT_USER']);
store.can('EDIT_USER'); // true
store.setPermissions(['VIEW_HOME']); // emits -> adapters re-render

// Async — API / JWT / ...
const api = new AsyncPermissionStore(async () => fetch('/api/me/perms').then(r => r.json()));
await api.refresh();
api.status; // 'loading' | 'ready' | 'error'
api.can('X'); // false while loading/error (fail-closed)
```

Custom sources: extend `BasePermissionStore` (or implement the 4-member
`PermissionStore` interface: `status`, `can()`, `onChange()`, `refresh()`).
Any implementation substitutes for any other (Liskov).
## 2. Angular usage

### Setup: the service

`PermissionService` (`providedIn: 'root'`) wraps the core store with Signals:

```ts
inject(PermissionService).can('EDIT_USER'); // sync, tracked in reactive ctx
perms.canSignal('EDIT_USER'); // Signal<boolean> — preferred in templates
perms.visibleSignal(node);    // node-subtree visibility
perms.enabledSignal(node);    // node enabled state
perms.setPermissions([...]);  // login/logout/role-switch/impersonate
perms.useDemoMode('full' | 'partial' | 'none'); // demo switcher
```

### Show / hide with `*appShowIf`

```html
<!-- plain query -->
<nav *appShowIf="'VIEW_HOME'">...</nav>

<!-- composite + row context + disable-instead-of-hide -->
<button *appShowIf="editQuery; context: user; denied: 'disable'; let disabled = disabled"
  [disabled]="disabled">Edit</button>

<!-- whole subtree node -->
<section *appShowIf="node; context: row">...</section>

<!-- lock-UI -->
<div *appShowIf="'EXPORT'; denied: 'show-locked'; let locked = locked">
  @if (locked) { Upgrade to export }
</div>
```

Microsyntax: `*appShowIf="query; context: expr; denied: 'disable'"`.
Template context exposes `$implicit (=visible)`, `visible`, `disabled`, `locked`.

### Preferred button API

`app-action-button` takes an inline query (no node plumbing):

```html
<app-action-button [query]="'EDIT_USER'" [label]="'Edit'" (action)="edit(row)" />
<app-action-button [query]="editQuery" [context]="row" denied="disable" />
```

### Central registry (single source of truth)

Do not scatter `new PermissionNode('EDIT_USER')` across components. Define once:

```ts
import { defineNodes, permissionRegistry } from './core';

defineNodes([
  {
    id: 'users-table',
    query: 'VIEW_USERS_TABLE',
    denied: 'hide',
    children: [
      {
        id: 'edit-btn',
        // factory query -> row-level permission
        query: (row: unknown) => ({
          perm: 'EDIT_USER',
          context: { owner: (row as { ownerId?: string })?.ownerId },
        }),
        denied: 'disable',
      },
      { id: 'delete-btn', query: 'DELETE_USER', denied: 'disable' },
    ],
  },
]);

const table = permissionRegistry.get('users-table'); // throws on unknown id
```

### Route guards (same `can()`, not a second list)

```ts
// routes.ts
import { permGuard } from './app/perm.guard';

export const routes = [
  { path: 'users', component: UsersPage, canActivate: [permGuard], data: { perm: 'VIEW_USERS' } },
  {
    path: 'admin',
    component: AdminPage,
    canActivate: [permGuard],
    data: { perm: { all: ['ADMIN_PANEL', 'VIEW_SETTINGS'] }, deniedRedirect: '/denied' },
  },
];
```

Guard reads `data.perm` (alias `data.permQuery`), optional `data.permContext`,
redirects to `data.deniedRedirect ?? '/'`.

### Row-level example (table)

```ts
// table.component.ts
editQuery = (row: unknown): Query => ({
  perm: 'EDIT_USER',
  context: { owner: (row as UserRow)?.ownerId },
});
```

```html
<app-action-button [query]="editQuery" [context]="user" [label]="'Edit'" />
```

The store primitive `has(perm, ctx)` receives the context — implement
ownership/tenant scoping there once, every adapter benefits.
## 3. Pure-core usage (no framework)

```ts
import { canFromSet, isNodeVisible, canActivateRoute } from './core';

const can = canFromSet(['VIEW_HOME', 'EDIT_USER']);
isNodeVisible({ query: null, children: [{ query: 'VIEW_HOME' }] }, can); // true
canActivateRoute('ADMIN_PANEL', can); // false
```

## 4. React demo (same core, real app)

`react-demo/` is a runnable Vite + React 19 + React Router 7 app that imports
`../src/core` verbatim via the `@perm-core` alias — no copy, no fork:

```bash
cd react-demo
yarn install
yarn dev      # → http://localhost:4301/
yarn build
```

Parity with Angular, section-for-section: mode switcher + per-permission
checkboxes, nav hierarchy (`Navbar`/`SubNavbar`), row-level `UsersTable`
(`denied: 'disable'`), `Dropdown`, standalone `ActionButton`s, `ConfirmModal`,
live composite queries, guard simulator table, and real routes:

- `/` playground, `/users` (guard `VIEW_USERS_TABLE`), `/settings`
  (guard `all [ADMIN_PANEL, VIEW_SETTINGS]`), `/denied`.
- Guards use the same core `canActivateRoute()` as Angular's `permGuard`,
  applied as router `loader`s + a `<Protected>` element wrapper.

Key files: `react-demo/src/permissions.tsx` (`PermissionProvider`,
`usePermission`, `useNodeVisible`, `<Show>` — the twin of `*appShowIf`),
`components.tsx` (dumb UI), `pages.tsx` (playground + pages), `router.tsx`.

> The older `src/react/adapter.ts` sketch (`showInReact`) is kept as
> documentation; the runnable demo lives in `react-demo/`.

## 5. Demo map (both apps)

Angular `AppComponent` playground and React `Playground` render the same sections:

| UI                 | node id            | rule in action                                        |
| ------------------ | ------------------ | ----------------------------------------------------- |
| `app-navbar`       | `main-nav` (null)  | shows iff any of `VIEW_HOME` / `VIEW_PROFILE` passes  |
| `app-sub-navbar`   | `sub-nav`          | needs `ADMIN_PANEL` **and** a visible child           |
| `app-dropdown`     | `options-dropdown` | options filtered per-child                            |
| `app-table`        | `users-table`      | container `VIEW_USERS_TABLE`; row buttons contextual  |
| standalone buttons | inline queries     | `EDIT_USER` / `DELETE_USER`                           |
| modal + opener     | `confirm-modal`    | shell visible iff any child visible                   |

Toggle modes in code: `perms.useDemoMode('partial')` (only `VIEW_HOME`,
`VIEW_PROFILE`, `OPTION_VIEW`, `EDIT_USER`) or `'none'` — watch parents disappear
automatically because no child is visible.

## 6. SOLID notes

- **S** — `evaluate` != `store` != `registry` != UI adapters.
- **O** — new query operators / `denied` modes / store sources without editing callers.
- **L** — `InMemory` / `Async` / mock stores interchangeable via `PermissionStore`.
- **I** — UI depends on the 1-method `CanFn` + 4-member `PermissionStore`, not concretions.
- **D** — `app/*` and `react/*` depend on the `core` abstraction; `core` depends on nothing.

## 7. Security and limits

- UI hiding is **UX only**. Guards reduce accidents, they do not stop forged requests —
  every route data loader and every API endpoint must re-check server-side.
- Fail-closed: unknown / loading / error => denied. Provide skeletons via `denied`
  `fallback` rather than flashing content.
- `AsyncPermissionStore` caches in memory; wire `refresh()` to login, token refresh,
  role-switch, and (optionally) a revoke push channel.

## 8. Reference

- Core barrel: `src/core/index.ts` (only import portable code needs).
- Core tests: `src/core/core.spec.ts` (`ng test`; also compilable to Node via `tsc`).
- Angular CLI notes: `ng serve` / `ng build` / `ng test` (Karma+Jasmine).
