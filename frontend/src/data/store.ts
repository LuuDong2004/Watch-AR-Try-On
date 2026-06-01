import { create } from 'zustand';
import type { Shop, User, Watch } from './types';
import * as catalog from '../api/catalog';
import * as usersApi from '../api/users';

/**
 * App data store, backed by the Spring API. Components keep using the same
 * selectors (`useData((s) => s.watches)` etc.); the arrays start empty and fill
 * once {@link DataState.loadCatalog} / {@link DataState.loadUsers} resolve.
 */
interface DataState {
  watches: Watch[];
  shops: Shop[];
  users: User[];
  catalogLoaded: boolean;
  usersLoaded: boolean;

  /** Public catalogue (watches + shops). Safe to call without auth. */
  loadCatalog: () => Promise<void>;
  /** Admin-only user list. */
  loadUsers: () => Promise<void>;

  addWatch: (w: Partial<Omit<Watch, 'id' | 'createdAt'>>) => Promise<Watch>;
  updateWatch: (id: string, patch: Partial<Watch>) => Promise<void>;
  deleteWatch: (id: string) => Promise<void>;

  addShop: (s: Partial<Omit<Shop, 'id' | 'createdAt'>>) => Promise<Shop>;
  updateShop: (id: string, patch: Partial<Shop>) => Promise<void>;
  deleteShop: (id: string) => Promise<void>;

  addUser: (u: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<User>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useData = create<DataState>()((set, get) => ({
  watches: [],
  shops: [],
  users: [],
  catalogLoaded: false,
  usersLoaded: false,

  loadCatalog: async () => {
    const [watches, shops] = await Promise.all([catalog.listWatches(), catalog.listShops()]);
    set({ watches, shops, catalogLoaded: true });
  },

  loadUsers: async () => {
    const users = await usersApi.listUsers();
    set({ users, usersLoaded: true });
  },

  addWatch: async (w) => {
    const watch = await catalog.createWatch(w);
    set((s) => ({ watches: [watch, ...s.watches] }));
    return watch;
  },
  updateWatch: async (id, patch) => {
    const existing = get().watches.find((w) => w.id === id);
    const updated = await catalog.updateWatch(id, { ...existing, ...patch });
    set((s) => ({ watches: s.watches.map((w) => (w.id === id ? updated : w)) }));
  },
  deleteWatch: async (id) => {
    await catalog.deleteWatch(id);
    set((s) => ({ watches: s.watches.filter((w) => w.id !== id) }));
  },

  addShop: async (sh) => {
    const shop = await catalog.createShop(sh);
    set((s) => ({ shops: [shop, ...s.shops] }));
    return shop;
  },
  updateShop: async (id, patch) => {
    const existing = get().shops.find((sh) => sh.id === id);
    const updated = await catalog.updateShop(id, { ...existing, ...patch });
    set((s) => ({ shops: s.shops.map((sh) => (sh.id === id ? updated : sh)) }));
  },
  deleteShop: async (id) => {
    await catalog.deleteShop(id);
    set((s) => ({
      shops: s.shops.filter((sh) => sh.id !== id),
      // Mirror the backend cascade locally.
      watches: s.watches.filter((w) => w.shopId !== id),
      users: s.users.map((u) => (u.shopId === id ? { ...u, shopId: undefined } : u)),
    }));
  },

  addUser: async (u) => {
    const user = await usersApi.createUser(u);
    set((s) => ({ users: [user, ...s.users] }));
    return user;
  },
  updateUser: async (id, patch) => {
    const updated = await usersApi.updateUser(id, patch);
    set((s) => ({ users: s.users.map((u) => (u.id === id ? updated : u)) }));
  },
  deleteUser: async (id) => {
    await usersApi.deleteUser(id);
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
  },
}));
