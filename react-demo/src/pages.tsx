/** Playground + routed pages — mirrors the Angular sample section-for-section. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  canActivateRoute,
  permissionRegistry,
  registerDemoNodes,
  type Query,
} from '@perm-core';
import { ALL_PERMISSIONS, PermissionProvider, Show, getStore, usePermission } from './permissions';
import { ActionButton, ConfirmModal, Dropdown, Navbar, SubNavbar, UsersTable } from './components';

registerDemoNodes();

function useGranted() {
  const store = getStore();
  const [, setTick] = useState(0);
  const granted = useMemo(() => {
    const next = new Set<string>();
    for (const p of ALL_PERMISSIONS) if (store.can(p)) next.add(p);
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);
  const rerender = () => setTick((t) => t + 1);
  return { granted, rerender };
}

function ControlPanel({ onChange }: { onChange: () => void }) {
  const { granted } = useGranted();
  const [mode, setMode] = useState<'full' | 'partial' | 'none' | 'custom'>('full');
  const store = getStore();
  const apply = (perms: Iterable<string>, m: typeof mode) => {
    store.setPermissions(perms);
    setMode(m);
    onChange();
  };
  const toggle = (p: string) => {
    const next = new Set(granted);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    apply(next, 'custom');
  };
  return (
    <aside style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, height: 'fit-content' }}>
      <h2>Permissions</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => apply([...ALL_PERMISSIONS], 'full')} style={mode === 'full' ? { fontWeight: 'bold' } : undefined}>Full</button>
        <button onClick={() => apply(['VIEW_HOME', 'VIEW_PROFILE', 'OPTION_VIEW', 'EDIT_USER'], 'partial')} style={mode === 'partial' ? { fontWeight: 'bold' } : undefined}>Partial</button>
        <button onClick={() => apply([], 'none')} style={mode === 'none' ? { fontWeight: 'bold' } : undefined}>None</button>
      </div>
      {ALL_PERMISSIONS.map((p) => (
        <label key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0' }}>
          <input type="checkbox" checked={granted.has(p)} onChange={() => toggle(p)} />
          <code>{p}</code>
        </label>
      ))}
      <p style={{ color: '#666', fontSize: 12 }}>Store status: <strong>{store.status}</strong> (fail-closed)</p>
    </aside>
  );
}

const COMPOSITES: Array<{ label: string; q: Query }> = [
  { label: 'EDIT_USER', q: 'EDIT_USER' },
  { label: 'all [VIEW_USERS_TABLE, EDIT_USER]', q: { all: ['VIEW_USERS_TABLE', 'EDIT_USER'] } },
  { label: 'any [DELETE_USER, EDIT_USER]', q: { any: ['DELETE_USER', 'EDIT_USER'] } },
  { label: 'not DELETE_USER', q: { not: 'DELETE_USER' } },
];

function CompositeRow({ label, q }: { label: string; q: Query }) {
  const ok = usePermission(q);
  return <li><code>{label}</code> → <strong>{ok ? 'ALLOW' : 'DENY'}</strong></li>;
}

function GuardRows() {
  const usersOk = usePermission('VIEW_USERS_TABLE');
  const settingsOk = usePermission({ all: ['ADMIN_PANEL', 'VIEW_SETTINGS'] });
  void canActivateRoute;
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead><tr><th>Route</th><th>Query</th><th>Decision</th></tr></thead>
      <tbody>
        <tr><td><code>/users</code></td><td><code>VIEW_USERS_TABLE</code></td><td><strong>{usersOk ? 'ALLOW' : 'DENY → /denied'}</strong></td></tr>
        <tr><td><code>/settings</code></td><td><code>all [ADMIN_PANEL, VIEW_SETTINGS]</code></td><td><strong>{settingsOk ? 'ALLOW' : 'DENY → /denied'}</strong></td></tr>
      </tbody>
    </table>
  );
}

export function Playground() {
  const [, setTick] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const mainNav = permissionRegistry.get('main-nav');
  const subNav = permissionRegistry.get('sub-nav');
  const table = permissionRegistry.get('users-table');
  const dropdown = permissionRegistry.get('options-dropdown');
  const modal = permissionRegistry.get('confirm-modal');
  const card: React.CSSProperties = { border: '1px solid #ddd', padding: 12, borderRadius: 8 };
  return (
    <PermissionProvider>
      <header>
        <h1>Permission playground (React)</h1>
        <p>Same <code>@perm-core</code> as Angular — parent shown iff itself allowed and a child visible.</p>
        <nav style={{ display: 'flex', gap: 16 }}>
          <Link to="/users">/users (guard: VIEW_USERS_TABLE)</Link>
          <Link to="/settings">/settings (guard: ADMIN_PANEL + VIEW_SETTINGS)</Link>
          <Link to="/denied">/denied</Link>
        </nav>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginTop: 16 }}>
        <ControlPanel onChange={() => setTick((t) => t + 1)} />
        <main style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={card}>
            <h2>1 · Navigation hierarchy</h2>
            <Navbar node={mainNav} />
            <SubNavbar node={subNav} />
          </section>
          <section style={card}>
            <h2>2 · Row-level table (disable vs hide)</h2>
            <UsersTable node={table} />
          </section>
          <section style={card}>
            <h2>3 · Dropdown + modal + standalone buttons</h2>
            <Dropdown node={dropdown} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <ActionButton query="EDIT_USER" label="Standalone Edit" />
              <ActionButton query="DELETE_USER" label="Standalone Delete" />
              <Show query={modal}><button onClick={() => setShowModal(true)}>Open Confirmation Modal</button></Show>
            </div>
            {showModal && <ConfirmModal onClose={() => setShowModal(false)} />}
          </section>
          <section style={card}>
            <h2>4 · Composite queries (live)</h2>
            <ul>{COMPOSITES.map((c) => <CompositeRow key={c.label} label={c.label} q={c.q} />)}</ul>
            <Show query={{ perm: 'EXPORT' }} denied="show-locked">
              {({ locked }) => (locked ? <span>🔒 Export is locked — grant EXPORT to unlock.</span> : <span>✅ Export unlocked.</span>)}
            </Show>
          </section>
          <section style={card}>
            <h2>5 · Guard simulator (same can() as the router)</h2>
            <GuardRows />
          </section>
        </main>
      </div>
    </PermissionProvider>
  );
}

export function UsersPage() {
  const table = permissionRegistry.get('users-table');
  return (
    <PermissionProvider>
      <h2>Users page</h2>
      <p>Guard: <code>VIEW_USERS_TABLE</code></p>
      <UsersTable node={table} />
      <p><Link to="/">Back to playground</Link></p>
    </PermissionProvider>
  );
}

export function SettingsPage() {
  return (
    <PermissionProvider>
      <h2>Settings page</h2>
      <p>Guard: <code>all ADMIN_PANEL + VIEW_SETTINGS</code></p>
      <Show query="VIEW_SETTINGS"><label>Site name <input defaultValue="Demo site" /></label></Show>
      <Show query="DELETE_USER"><p>Danger zone (needs DELETE_USER).</p></Show>
      <p><Link to="/">Back to playground</Link></p>
    </PermissionProvider>
  );
}

export function DeniedPage() {
  return (
    <div>
      <h2>Access denied</h2>
      <p>The guard blocked this route. Turn the permission back on and retry.</p>
      <Link to="/">Back to playground</Link>
    </div>
  );
}
