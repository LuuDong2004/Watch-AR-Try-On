import { create } from 'zustand';
import type { Role, User } from '../data/types';
import * as authApi from '../api/auth';
import { ApiError, clearToken, getToken, setToken } from '../api/client';

interface Session {
  userId: string;
  name: string;
  role: Role;
  shopId?: string;
  email: string;
}

interface AuthState {
  session: Session | null;
  /** False until the initial token rehydrate completes (avoids login-flash). */
  ready: boolean;
  /** Email+password login. Resolves to an error message, or null on success. */
  login: (email: string, password: string) => Promise<string | null>;
  /** Self-service customer registration. */
  register: (name: string, email: string, password: string) => Promise<string | null>;
  /** Adopt a JWT obtained out-of-band (Google OAuth redirect). */
  adoptToken: (token: string) => Promise<string | null>;
  /** Rehydrate the session from a stored token on app start. */
  bootstrap: () => Promise<void>;
  logout: () => void;
}

function toSession(u: User): Session {
  return { userId: u.id, name: u.name, role: u.role, shopId: u.shopId, email: u.email };
}

function errMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

export const useAuth = create<AuthState>()((set) => ({
  session: null,
  ready: false,

  login: async (email, password) => {
    try {
      const user = await authApi.login(email, password);
      set({ session: toSession(user), ready: true });
      return null;
    } catch (e) {
      return errMessage(e);
    }
  },

  register: async (name, email, password) => {
    try {
      const user = await authApi.register(name, email, password);
      set({ session: toSession(user), ready: true });
      return null;
    } catch (e) {
      return errMessage(e);
    }
  },

  adoptToken: async (token) => {
    setToken(token);
    try {
      const user = await authApi.me();
      set({ session: toSession(user), ready: true });
      return null;
    } catch (e) {
      clearToken();
      set({ session: null, ready: true });
      return errMessage(e);
    }
  },

  bootstrap: async () => {
    if (!getToken()) {
      set({ session: null, ready: true });
      return;
    }
    try {
      const user = await authApi.me();
      set({ session: toSession(user), ready: true });
    } catch {
      clearToken();
      set({ session: null, ready: true });
    }
  },

  logout: () => {
    authApi.logout();
    set({ session: null });
  },
}));

/** Default landing route for a role after login. */
export function homeForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'shop':
      return '/shop';
    default:
      return '/';
  }
}
