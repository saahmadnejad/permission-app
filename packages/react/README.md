# permission-visibility-react

React adapter for [`permission-visibility-core`](https://www.npmjs.com/package/permission-visibility-core):
`PermissionProvider`, `usePermission` / `useNodeVisible` hooks, and the `<Show>`
component — the twin of Angular's `*appShowIf`, driven by the same framework-free
`can()` decision.

Peer dependency: `react` ^18 || ^19.

## Install

```bash
npm install permission-visibility-react permission-visibility-core
```

## Provider

```tsx
import { PermissionProvider, getStore } from 'permission-visibility-react';

// The default provider owns a singleton InMemoryPermissionStore.
// Swap in your own store implementation for a real app (see core docs).
root.render(
  <PermissionProvider>
    <App />
  </PermissionProvider>,
);
```

## Hooks

```tsx
import { usePermission, useNodeVisible, usePermissionStore } from 'permission-visibility-react';

const canEdit = usePermission('EDIT_USER');                        // string query
const canDelete = usePermission({ any: ['DELETE_USER', 'SUDO'] }); // composite
const canEditRow = usePermission('EDIT_USER', { owner: row.ownerId }); // context
const tableVisible = useNodeVisible(node);                         // hierarchy rule

const store = usePermissionStore(); // the underlying PermissionStore
store.setPermissions(['VIEW_HOME']); // emits -> every hook re-renders
```

All hooks subscribe via `useSyncExternalStore` — no tearing, no stale renders.

## `<Show>` component

```tsx
<Show query="EDIT_USER" context={row} denied="disable">
  {(state) => <button disabled={state.disabled}>Edit</button>}
</Show>

<Show query="EXPORT" denied="show-locked" fallback={<Skeleton />}>
  <ExportPanel />
</Show>
```

`denied` modes: `hide` (render `fallback`, default), `disable` (render children with
`disabled: true` — pass a function child, or a plain wrapper is used), `show-locked`
(children with `locked: true`).

## Notes

- Fail-closed: unknown / loading / error ⇒ denied.
- UI hiding is UX only — re-check every decision server-side.

## License

MIT
