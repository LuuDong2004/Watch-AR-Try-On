/**
 * Real authentication session backed by the backend JWT.
 *
 * The token lives in localStorage (see api/client). On boot we call /api/auth/me
 * to restore the session. `role` maps the backend role onto the three app UIs.
 */
import { create } from 'zustand';
import { authApi, getToken, type Role, type User } from '../api';

type Status = 'loading' | 'authed' | 'anon';

interface SessionState {
  user: User | null;
  status: Status;
  /** Restore the session from a stored token (call once on app boot). */
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  /** Replace the cached user after a profile edit. */
  setUser: (user: User) => void;
  logout: () => void;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  status: 'loading',
  init: async () => {
    if (!getToken()) {
      set({ user: null, status: 'anon' });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, status: 'authed' });
    } catch {
      authApi.logout();
      set({ user: null, status: 'anon' });
    }
  },
  login: async (email, password) => {
    const { user } = await authApi.login(email, password);
    set({ user, status: 'authed' });
    return user;
  },
  register: async (name, email, password) => {
    const { user } = await authApi.register(name, email, password);
    set({ user, status: 'authed' });
    return user;
  },
  setUser: (user) => set({ user }),
  logout: () => {
    authApi.logout();
    set({ user: null, status: 'anon' });
  },
}));

/** Map the backend role onto the App.jsx UI shells. */
export function uiRoleFor(role: Role | undefined): 'user' | 'shop' | 'admin' {
  if (role === 'admin') return 'admin';
  if (role === 'shop') return 'shop';
  return 'user';
}
