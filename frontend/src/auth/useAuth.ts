import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '../data/types';
import { useData } from '../data/store';

interface Session {
  userId: string;
  name: string;
  role: Role;
  shopId?: string;
}

interface AuthState {
  session: Session | null;
  /** Returns an error message on failure, or null on success. */
  login: (email: string, password: string) => string | null;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      login: (email, password) => {
        const { users } = useData.getState();
        const user = users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!user || user.password !== password) {
          return 'Email hoặc mật khẩu không đúng.';
        }
        if (user.status === 'locked') {
          return 'Tài khoản đã bị khoá. Liên hệ quản trị viên.';
        }
        set({
          session: {
            userId: user.id,
            name: user.name,
            role: user.role,
            shopId: user.shopId,
          },
        });
        return null;
      },
      logout: () => set({ session: null }),
    }),
    { name: 'watch-ar-demo-auth', version: 1 },
  ),
);

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
