import { api } from './client';
import { normShop, normWatch, upper } from './normalize';
import type { Shop, Watch } from '../data/types';

/** Fields a shop/admin can submit when creating or editing a watch. */
export type WatchInput = Omit<Watch, 'id' | 'createdAt'> & { shopId?: string };
export type ShopInput = Omit<Shop, 'id' | 'createdAt'>;

function watchBody(w: Partial<WatchInput>) {
  return {
    name: w.name,
    brand: w.brand,
    price: w.price,
    originalPrice: w.originalPrice ?? null,
    description: w.description,
    specs: w.specs ?? {},
    image: w.image,
    gallery: w.gallery ?? [],
    modelUrl: w.modelUrl,
    hasAR: w.hasAR ?? false,
    arWatchId: w.arWatchId,
    variant: w.variant,
    metal: w.metal,
    dial: w.dial,
    accent: w.accent,
    rating: w.rating ?? 0,
    reviewCount: w.reviewCount ?? 0,
    status: upper(w.status) ?? 'ACTIVE',
    shopId: w.shopId,
  };
}

function shopBody(s: Partial<ShopInput>) {
  return {
    name: s.name,
    phone: s.phone,
    email: s.email,
    address: s.address,
    description: s.description,
    color: s.color,
    zalo: s.zalo,
    messenger: s.messenger,
    hours: s.hours,
    manager: s.manager,
    image: s.image,
    services: s.services ?? [],
    since: s.since,
    status: upper(s.status) ?? 'ACTIVE',
  };
}

// --- Watches ---------------------------------------------------------------

export async function listWatches(shopId?: string): Promise<Watch[]> {
  const q = shopId ? `?shopId=${encodeURIComponent(shopId)}` : '';
  const res = await api<any[]>(`/api/watches${q}`, { anonymous: true });
  return res.map(normWatch);
}

export async function getWatch(id: string): Promise<Watch> {
  return normWatch(await api<any>(`/api/watches/${id}`, { anonymous: true }));
}

export async function createWatch(input: Partial<WatchInput>): Promise<Watch> {
  return normWatch(await api<any>('/api/watches', { method: 'POST', body: watchBody(input) }));
}

export async function updateWatch(id: string, input: Partial<WatchInput>): Promise<Watch> {
  return normWatch(await api<any>(`/api/watches/${id}`, { method: 'PUT', body: watchBody(input) }));
}

export async function deleteWatch(id: string): Promise<void> {
  await api<void>(`/api/watches/${id}`, { method: 'DELETE' });
}

// --- Shops -----------------------------------------------------------------

export async function listShops(): Promise<Shop[]> {
  const res = await api<any[]>('/api/shops', { anonymous: true });
  return res.map(normShop);
}

export async function getShop(id: string): Promise<Shop> {
  return normShop(await api<any>(`/api/shops/${id}`, { anonymous: true }));
}

export async function createShop(input: Partial<ShopInput>): Promise<Shop> {
  return normShop(await api<any>('/api/shops', { method: 'POST', body: shopBody(input) }));
}

export async function updateShop(id: string, input: Partial<ShopInput>): Promise<Shop> {
  return normShop(await api<any>(`/api/shops/${id}`, { method: 'PUT', body: shopBody(input) }));
}

export async function deleteShop(id: string): Promise<void> {
  await api<void>(`/api/shops/${id}`, { method: 'DELETE' });
}
