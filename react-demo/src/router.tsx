/** Router with permission guards — same `can()` as <Show> (Q3/Q8). */
import { Navigate, createBrowserRouter, type LoaderFunctionArgs } from 'react-router-dom';
import { canActivateRoute, type Query } from '@perm-core';
import { getStore } from './permissions';
import { DeniedPage, Playground, SettingsPage, UsersPage } from './pages';

function guard(query: Query, redirect = '/denied') {
  return (_args: LoaderFunctionArgs) => {
    const store = getStore();
    const ok = canActivateRoute(query, (q, c) => store.can(q, c));
    if (ok) return null;
    throw new Response(null, { status: 302, headers: { Location: redirect } });
  };
}

export function Protected({
  query,
  children,
}: {
  query: Query;
  children: React.ReactNode;
}) {
  const store = getStore();
  const ok = canActivateRoute(query, (q, c) => store.can(q, c));
  if (!ok) return <Navigate to="/denied" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/', element: <Playground /> },
  {
    path: '/users',
    loader: guard('VIEW_USERS_TABLE'),
    element: (
      <Protected query="VIEW_USERS_TABLE">
        <UsersPage />
      </Protected>
    ),
  },
  {
    path: '/settings',
    loader: guard({ all: ['ADMIN_PANEL', 'VIEW_SETTINGS'] }),
    element: (
      <Protected query={{ all: ['ADMIN_PANEL', 'VIEW_SETTINGS'] }}>
        <SettingsPage />
      </Protected>
    ),
  },
  { path: '/denied', element: <DeniedPage /> },
]);
