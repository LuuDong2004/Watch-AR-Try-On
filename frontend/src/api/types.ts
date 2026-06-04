/**
 * Frontend-facing view types. The API layer normalises backend DTOs (UPPERCASE
 * enums, `modelUrl`, etc.) into these shapes so components keep using the same
 * lowercase fields the old mock data exposed.
 */

export type Role = 'admin' | 'shop' | 'customer';
export type UserStatus = 'active' | 'locked';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  shopId?: string | null;
  status: UserStatus;
  provider?: string;
  createdAt?: number;
}

export interface Watch {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number | null;
  description?: string;
  specs?: Record<string, string>;
  image: string;
  gallery?: string[];
  /** GLB path for AR (aliased from backend `modelUrl`). */
  model?: string;
  hasAR: boolean;
  arWatchId?: string;
  variant?: string;
  metal?: string;
  dial?: string;
  accent?: string;
  rating?: number;
  reviewCount?: number;
  status?: 'active' | 'archived';
  shopId: string;
  createdAt?: number;
}

export interface Shop {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  color?: string;
  zalo?: string;
  messenger?: string;
  hours?: string;
  manager?: string;
  image?: string;
  services?: string[];
  rating?: number;
  reviewCount?: number;
  since?: string;
  status?: 'active' | 'archived';
  createdAt?: number;
}

export type LeadType = 'contact' | 'appointment';
export type LeadStatus = 'new' | 'responded' | 'booked' | 'closed';
export type LeadChannel = 'form' | 'call' | 'zalo' | 'messenger';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  watchId?: string;
  watchName?: string;
  watchBrand?: string;
  shopId: string;
  shopName?: string;
  type: LeadType;
  date?: string;
  time?: string;
  message?: string;
  status: LeadStatus;
  timestamp?: string;
  channel: LeadChannel;
  hasTriedOn: boolean;
  triedOnImage?: string;
  userId?: string | null;
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
  timestamp?: string;
}
