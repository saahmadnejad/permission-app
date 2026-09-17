/** Dumb UI components — permission via <Show>, structure via props. */
import type { PermissionNodeDef, Query, QueryInput } from '@perm-core';
import { permissionRegistry } from '@perm-core';
import { Show, useNodeVisible, usePermissionStore } from './permissions';
import { isNodeVisible } from '@perm-core';

function labelOf(node: PermissionNodeDef): string {
  const q = node.query;
  if (typeof q === 'string') return q;
  return node.label ?? node.url ?? '';
}

export function Navbar({ node }: { node: PermissionNodeDef }) {
  const visible = useNodeVisible(node);
  if (!visible) return null;
  return (
    <nav style={{ background: '#f0f0f0', padding: 10 }}>
      <ul style={{ display: 'flex', gap: 20, listStyle: 'none', margin: 0, padding: 0 }}>
        {(node.children ?? []).map((c, i) => (
          <li key={labelOf(c) || i}>
            <Show query={c}>{labelOf(c)}</Show>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SubNavbar({ node }: { node: PermissionNodeDef }) {
  const visible = useNodeVisible(node);
  if (!visible) return null;
  return (
    <nav style={{ background: '#e0e0e0', padding: 10 }}>
      <ul style={{ display: 'flex', gap: 20, listStyle: 'none', margin: 0, padding: 0 }}>
        {(node.children ?? []).map((c, i) => (
          <li key={labelOf(c) || i}>
            <Show query={c}>{labelOf(c)}</Show>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Dropdown({ node }: { node: PermissionNodeDef }) {
  const store = usePermissionStore();
  const visible = useNodeVisible(node);
  if (!visible) return null;
  const options = (node.children ?? []).filter((c) =>
    isNodeVisible(c, (q, ctx) => store.can(q, ctx)),
  );
  return (
    <select>
      <option value="">Select an option</option>
      {options.map((c, i) => (
        <option key={labelOf(c) || i} value={c.url ?? ''}>
          {labelOf(c)}
        </option>
      ))}
    </select>
  );
}

export function ActionButton({
  query,
  label,
  context,
  denied = 'disable',
  onAction,
}: {
  query: QueryInput;
  label: string;
  context?: unknown;
  denied?: 'hide' | 'disable' | 'show-locked';
  onAction?: () => void;
}) {
  return (
    <Show query={query} context={context} denied={denied}>
      {({ disabled }) => (
        <button disabled={disabled} onClick={onAction}>
          {label}
        </button>
      )}
    </Show>
  );
}

export type UserRow = { name: string; email: string; ownerId?: string };

export function UsersTable({ node }: { node: PermissionNodeDef }) {
  const visible = useNodeVisible(node);
  if (!visible) return null;
  const users: UserRow[] = [
    { name: 'John Doe', email: 'john@example.com', ownerId: 'john' },
    { name: 'Jane Smith', email: 'jane@example.com', ownerId: 'jane' },
  ];
  const editQuery = (row: unknown): Query => ({
    perm: 'EDIT_USER',
    context: { owner: (row as UserRow)?.ownerId },
  });
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.email}>
            <td>{u.name}</td>
            <td>{u.email}</td>
            <td style={{ display: 'flex', gap: 8 }}>
              <ActionButton query={editQuery} context={u} label="Edit" onAction={() => console.log('Editing', u)} />
              <ActionButton query="DELETE_USER" context={u} label="Delete" onAction={() => console.log('Deleting', u)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ConfirmModal({ onClose }: { onClose: () => void }) {
  const node = permissionRegistry.get('confirm-modal');
  const visible = useNodeVisible(node);
  if (!visible) return null;
  return (
    <div
      style={{
        border: '1px solid #000',
        padding: 20,
        background: 'white',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <h2>Confirmation Modal</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        {(node.children ?? []).map((c, i) => (
          <ActionButton
            key={labelOf(c) || i}
            query={(c.query ?? null) as QueryInput}
            label={labelOf(c)}
            onAction={() => {
              console.log('Action performed:', labelOf(c));
              onClose();
            }}
          />
        ))}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
