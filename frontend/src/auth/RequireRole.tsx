import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../data/types';
import { useAuth } from './useAuth';

/** Guards a route subtree: redirects to /login unless the session role matches. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const session = useAuth((s) => s.session);
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (session.role !== role) {
    // Logged in but wrong area — send them to their own home.
    return <Navigate to={session.role === 'admin' ? '/admin' : session.role === 'shop' ? '/shop' : '/'} replace />;
  }
  return <>{children}</>;
}
