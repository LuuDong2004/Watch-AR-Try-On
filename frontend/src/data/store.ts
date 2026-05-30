import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shop, User, Watch } from './types';
import { seedDB } from './seed';

/** Short unique id for new records. */
function uid(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

interface DataState {
  users: User[];
  shops: Shop[];
  watches: Watch[];

  // Watches
  addWatch: (w: Omit<Watch, 'id' | 'createdAt'>) => Watch;
  updateWatch: (id: string, patch: Partial<Watch>) => void;
  deleteWatch: (id: string) => void;

  // Shops
  addShop: (s: Omit<Shop, 'id' | 'createdAt'>) => Shop;
  updateShop: (id: string, patch: Partial<Shop>) => void;
  deleteShop: (id: string) => void;

  // Users
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;

  /** Wipe localStorage data back to the seed. */
  resetDemo: () => void;
}

export const useData = create<DataState>()(
  persist(
    (set) => ({
      users: seedDB.users,
      shops: seedDB.shops,
      watches: seedDB.watches,

      addWatch: (w) => {
        const watch: Watch = { ...w, id: uid('w'), createdAt: Date.now() };
        set((s) => ({ watches: [watch, ...s.watches] }));
        return watch;
      },
      updateWatch: (id, patch) =>
        set((s) => ({ watches: s.watches.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
      deleteWatch: (id) => set((s) => ({ watches: s.watches.filter((w) => w.id !== id) })),

      addShop: (sh) => {
        const shop: Shop = { ...sh, id: uid('s'), createdAt: Date.now() };
        set((s) => ({ shops: [shop, ...s.shops] }));
        return shop;
      },
      updateShop: (id, patch) =>
        set((s) => ({ shops: s.shops.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)) })),
      deleteShop: (id) =>
        set((s) => ({
          shops: s.shops.filter((sh) => sh.id !== id),
          // Cascade: drop this shop's watches and unlink its owners.
          watches: s.watches.filter((w) => w.shopId !== id),
          users: s.users.map((u) => (u.shopId === id ? { ...u, shopId: undefined } : u)),
        })),

      addUser: (u) => {
        const user: User = { ...u, id: uid('u'), createdAt: Date.now() };
        set((s) => ({ users: [user, ...s.users] }));
        return user;
      },
      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      resetDemo: () =>
        set({ users: seedDB.users, shops: seedDB.shops, watches: seedDB.watches }),
    }),
    { name: 'watch-ar-demo-db', version: 1 },
  ),
);
