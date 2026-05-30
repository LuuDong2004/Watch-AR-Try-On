/** Domain types for the mock (localStorage-backed) Watch AR Studio demo. */

export type Role = 'admin' | 'shop' | 'customer';
export type UserStatus = 'active' | 'locked';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Plain-text for the mock demo only — never do this in a real app. */
  password: string;
  role: Role;
  /** Set when role === 'shop': the shop this owner manages. */
  shopId?: string;
  status: UserStatus;
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
  /** GLB shown in the 3D product viewer. */
  modelUrl: string;
  /**
   * Which entry in the AR engine catalogue (src/config/watches.ts) the "Thử AR"
   * button loads — 'chrono' | 'wrist' | 'classic' | 'gshock' | 'smart'.
   */
  arWatchId: string;
  variant?: string;
  /** Palette for the gradient thumbnail (no product photos in the demo). */
  metal: string;
  dial: string;
  accent: string;
  shopId: string;
  createdAt: number;
}

export interface DB {
  users: User[];
  shops: Shop[];
  watches: Watch[];
}
