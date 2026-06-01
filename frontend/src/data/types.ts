/** Canonical domain types for the TrueWrist frontend (backed by the Spring API). */

export type Role = 'admin' | 'shop' | 'customer';
export type UserStatus = 'active' | 'locked';
export type ListingStatus = 'active' | 'locked';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Optional — only sent when an admin creates/updates a user; never returned by the API. */
  password?: string;
  role: Role;
  /** Set when role === 'shop': the shop this owner manages. */
  shopId?: string;
  status: UserStatus;
  /** 'local' | 'google'. */
  provider?: string;
  createdAt: number;
}

export interface Shop {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  /** Accent color for the shop's avatar/badge. */
  color: string;
  zalo: string;
  messenger: string;
  hours: string;
  manager: string;
  image: string;
  services: string[];
  rating: number;
  reviewCount: number;
  since: string;
  status: ListingStatus;
  createdAt: number;
}

export interface Watch {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  description: string;
  specs: Record<string, string>;
  /** Primary storefront image URL. */
  image: string;
  /** Additional gallery image URLs. */
  gallery: string[];
  /** GLB shown in the 3D product viewer (may be empty). */
  modelUrl: string;
  /** Whether the "Thử AR" button is offered. */
  hasAR: boolean;
  /**
   * Which entry in the AR engine catalogue (src/config/watches.ts) the "Thử AR"
   * button loads — 'chrono' | 'wrist' | 'classic' | 'gshock' | 'smart'.
   */
  arWatchId: string;
  variant?: string;
  /** Palette for the gradient thumbnail fallback. */
  metal: string;
  dial: string;
  accent: string;
  rating: number;
  reviewCount: number;
  status: ListingStatus;
  shopId: string;
  createdAt: number;
}

export type LeadType = 'contact' | 'appointment';
export type LeadStatus = 'new' | 'responded' | 'booked' | 'closed';
export type LeadChannel = 'form' | 'call' | 'zalo' | 'messenger';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  watchId: string;
  watchName: string;
  watchBrand: string;
  shopId: string;
  shopName: string;
  type: LeadType;
  date?: string;
  time?: string;
  message: string;
  status: LeadStatus;
  timestamp: string;
  channel: LeadChannel;
  hasTriedOn: boolean;
  triedOnImage?: string;
}

export type FeedbackTarget = 'shop' | 'website';

export interface Feedback {
  id: string;
  target: FeedbackTarget;
  shopId?: string;
  shopName?: string;
  rating: number;
  topic?: string;
  message: string;
  name: string;
  contact?: string;
  timestamp: string;
}

export interface ClosetItem {
  id: string;
  watchId: string;
  watchName: string;
  watchBrand: string;
  price: number;
  imageUrl: string;
  date: string;
}

export interface DB {
  users: User[];
  shops: Shop[];
  watches: Watch[];
}
