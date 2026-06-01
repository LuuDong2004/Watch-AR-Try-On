/** Maps backend response DTOs (UPPERCASE enums) to the frontend's lowercase domain types. */

import type {
  ClosetItem,
  Feedback,
  Lead,
  Shop,
  User,
  Watch,
} from '../data/types';

const lower = (v: unknown): string => (typeof v === 'string' ? v.toLowerCase() : '');

export function normUser(d: any): User {
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    role: lower(d.role) as User['role'],
    shopId: d.shopId ?? undefined,
    status: lower(d.status) as User['status'],
    provider: lower(d.provider) || undefined,
    createdAt: d.createdAt,
  };
}

export function normShop(d: any): Shop {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone ?? '',
    email: d.email ?? '',
    address: d.address ?? '',
    description: d.description ?? '',
    color: d.color ?? '#B8924A',
    zalo: d.zalo ?? '',
    messenger: d.messenger ?? '',
    hours: d.hours ?? '',
    manager: d.manager ?? '',
    image: d.image ?? '',
    services: d.services ?? [],
    rating: d.rating ?? 0,
    reviewCount: d.reviewCount ?? 0,
    since: d.since ?? '',
    status: lower(d.status) as Shop['status'],
    createdAt: d.createdAt,
  };
}

export function normWatch(d: any): Watch {
  return {
    id: d.id,
    name: d.name,
    brand: d.brand,
    price: d.price,
    originalPrice: d.originalPrice ?? undefined,
    description: d.description ?? '',
    specs: d.specs ?? {},
    image: d.image ?? '',
    gallery: d.gallery ?? [],
    modelUrl: d.modelUrl ?? '',
    hasAR: !!d.hasAR,
    arWatchId: d.arWatchId,
    variant: d.variant ?? undefined,
    metal: d.metal ?? '#cccccc',
    dial: d.dial ?? '#111111',
    accent: d.accent ?? '#B8924A',
    rating: d.rating ?? 0,
    reviewCount: d.reviewCount ?? 0,
    status: lower(d.status) as Watch['status'],
    shopId: d.shopId,
    createdAt: d.createdAt,
  };
}

export function normLead(d: any): Lead {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email ?? undefined,
    watchId: d.watchId ?? '',
    watchName: d.watchName ?? '',
    watchBrand: d.watchBrand ?? '',
    shopId: d.shopId,
    shopName: d.shopName ?? '',
    type: lower(d.type) as Lead['type'],
    date: d.date ?? undefined,
    time: d.time ?? undefined,
    message: d.message ?? '',
    status: lower(d.status) as Lead['status'],
    timestamp: d.timestamp,
    channel: lower(d.channel) as Lead['channel'],
    hasTriedOn: !!d.hasTriedOn,
    triedOnImage: d.triedOnImage ?? undefined,
  };
}

export function normFeedback(d: any): Feedback {
  return {
    id: d.id,
    target: lower(d.target) as Feedback['target'],
    shopId: d.shopId ?? undefined,
    shopName: d.shopName ?? undefined,
    rating: d.rating,
    topic: d.topic ?? undefined,
    message: d.message,
    name: d.name,
    contact: d.contact ?? undefined,
    timestamp: d.timestamp,
  };
}

export function normCloset(d: any): ClosetItem {
  return {
    id: d.id,
    watchId: d.watchId ?? '',
    watchName: d.watchName ?? '',
    watchBrand: d.watchBrand ?? '',
    price: d.price ?? 0,
    imageUrl: d.imageUrl ?? '',
    date: d.date ?? '',
  };
}

/** Frontend lowercase enum → backend UPPERCASE enum (for request bodies). */
export const upper = (v: string | undefined | null): string | undefined =>
  v == null ? undefined : v.toUpperCase();
