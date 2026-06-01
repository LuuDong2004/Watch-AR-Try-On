import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../data/types';
import { useAuth } from './useAuth';

/** Guards a route subtree: redirects to /login unless the session role matches. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const session = useAuth((s) => s.session);
  const ready = useAuth((s) => s.ready);
  const location = useLocation();

  // Wait for the initial token rehydrate so we don't bounce to /login on refresh.
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F4EF] text-[#B8924A]">
        <span className="animate-pulse text-sm font-medium">Đang tải…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (session.role !== role) {
    // Logged in but wrong area — send them to their own home.
    return <Navigate to={session.role === 'admin' ? '/admin' : session.role === 'shop' ? '/shop' : '/'} replace />;
  }
  return <>{children}</>;
}
