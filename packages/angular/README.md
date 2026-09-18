# permission-visibility-angular

Angular adapter for [`permission-visibility-core`](https://www.npmjs.com/package/permission-visibility-core):
a signal-based `PermissionService`, the `*appShowIf` structural directive, and the
`permGuard` route guard — all driven by the same framework-free `can()` decision.

Peer dependencies: `@angular/core`, `@angular/common`, `@angular/router` ^20, `rxjs` ^7.

## Install

```bash
npm install permission-visibility-angular permission-visibility-core
```

## 1. PermissionService (Signals)

`providedIn: 'root'` — just inject it:

```ts
import { PermissionService } from 'permission-visibility-angular';

perms.can('EDIT_USER');          // sync, tracks signals in reactive contexts
perms.canSignal('EDIT_USER');    // Signal<boolean> — preferred in templates
perms.visibleSignal(node);       // node-subtree visibility (hierarchy rule)
perms.enabledSignal(node);       // node enabled state
perms.setPermissions([...]);     // login / logout / role-switch / impersonate
await perms.refresh();           // re-pull (AsyncPermissionStore-backed setups)
perms.status;                    // 'loading' | 'ready' | 'error'
```

## 2. `*appShowIf` structural directive

Standalone — import `ShowIfDirective` (or the package barrel) in your component.

```html
<!-- plain query -->
<nav *appShowIf="'VIEW_HOME'">...</nav>

<!-- composite + row context + disable-instead-of-hide -->
<button
  *appShowIf="editQuery; context: user; denied: 'disable'; let disabled = disabled"
  [disabled]="disabled">
  Edit
</button>

<!-- whole subtree node (PermissionNodeDef from the registry) -->
<section *appShowIf="node; context: row">...</section>

<!-- lock-UI -->
<div *appShowIf="'EXPORT'; denied: 'show-locked'; let locked = locked">...</div>
```

Denied modes: `hide` (remove, default), `disable` (keep + expose `disabled`),
`show-locked` (keep + expose `locked`). Template context: `$implicit`, `visible`,
`disabled`, `locked`.

## 3. Route guard

```ts
import { permGuard } from 'permission-visibility-angular';

export const routes: Routes = [
  { path: 'users', component: UsersPage, canActivate: [permGuard], data: { perm: 'VIEW_USERS' } },
  {
    path: 'settings',
    component: SettingsPage,
    canActivate: [permGuard],
    data: { permQuery: { all: ['ADMIN_PANEL', 'VIEW_SETTINGS'] }, deniedRedirect: '/denied' },
  },
];
```

`data` keys: `perm` (string) or `permQuery` (composite), optional `permContext`,
optional `deniedRedirect` (default `/`).

## Notes

- Ships Angular **partial compilation** output (`ngc`, `compilationMode: 'partial'`) —
  safe to consume from any Angular 20 app build.
- Fail-closed: unknown / loading / error ⇒ denied.
- UI hiding is UX only — re-check every decision server-side.

## License

MIT
