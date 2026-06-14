/**
 * Frontend-facing view types. The API layer normalises backend DTOs (UPPERCASE
 * enums, `modelUrl`, etc.) into these shapes so components keep using the same
 * lowercase fields the old mock data exposed.
 */

export type Role = 'admin' | 'shop' | 'customer';
export type UserStatus = 'active' | 'locked';
/** AR/3D moderation state. Only 'approved' watches expose the "Thử AR" try-on. */
export type ArReviewStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Primary role (highest precedence) — drives the app shell. */
  role: Role;
  /** Full set of granted roles (multi-role). Always includes {@link role}. */
  roles: Role[];
  shopId?: string | null;
  status: UserStatus;
  provider?: string;
  /** Profile picture URL; null/undefined = show initials. */
  avatar?: string | null;
  /** Contact phone number; pre-fills enquiry/appointment forms. */
  phone?: string | null;
  /** Whether the account's email has been verified (self-registrations gate on this). */
  emailVerified?: boolean;
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
  status?: 'active' | 'locked';
  /** AR/3D moderation state (admin-controlled). */
  arReviewStatus?: ArReviewStatus;
  /** Reviewer feedback shown to the seller when AR is rejected. */
  arReviewNote?: string | null;
  shopId: string;
  createdAt?: number;
}

export interface Shop {
  id: string;
  /** User id of the seller who owns this shop. */
  ownerId?: string | null;
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
  /** Google Maps link (share/place URL) for directions to the shop. */
  mapUrl?: string;
  services?: string[];
  rating?: number;
  reviewCount?: number;
  since?: string;
  status?: 'active' | 'locked';
  /** Reason shown to the owner when an admin locks the shop. */
  lockReason?: string | null;
  createdAt?: number;
}

/** A threaded comment on a watch (display + AR platform — no star ratings). */
export interface ProductComment {
  id: string;
  watchId: string;
  userId: string;
  authorName: string;
  /** Author owns the watch's shop → render a "Shop" badge. */
  isShop: boolean;
  /** Author's profile picture URL; null/undefined = show initials/shop icon. */
  authorAvatar?: string | null;
  /** User marked "đã thử AR và thấy phù hợp". */
  triedAr: boolean;
  body: string;
  parentId?: string | null;
  createdAt: number;
  replies: ProductComment[];
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
  createdAt?: number;
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

/** Plan codes are now editable catalogue keys (TRIAL/ESSENTIAL/PREMIUM are the
 *  seeded defaults; admins can add custom ones), so this is just a string. */
export type SubscriptionPlanCode = string;
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED';

export interface SubscriptionPlan {
  code: SubscriptionPlanCode;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  maxShops: number;
  maxProducts: number;
  recommended: boolean;
  /** Display + upgrade/downgrade rank (higher = more premium). */
  sortOrder: number;
  features: string[];
}

export interface ShopSubscription {
  id: string;
  plan: SubscriptionPlanCode;
  status: SubscriptionStatus;
  registeredAt: number;
  expiresAt: number;
  daysRemaining: number;
  autoRenew: boolean;
  currentPlan: SubscriptionPlan;
  plans: SubscriptionPlan[];
}

/** Admin plan overview: plan definition plus its real active-subscriber count. */
export interface AdminPlanOverview {
  code: SubscriptionPlanCode;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  maxShops: number;
  maxProducts: number;
  recommended: boolean;
  trial: boolean;
  sortOrder: number;
  subscribers: number;
  features: string[];
}

/** Lifecycle of a user's plan-upgrade request (manual admin approval). */
export type UpgradeRequestStatus = 'pending' | 'approved' | 'rejected';

/** A user's request to move onto a paid selling plan, pending admin approval. */
export interface PlanUpgradeRequest {
  id: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  planCode: string;
  planName: string;
  planPrice: number;
  planDurationDays: number;
  status: UpgradeRequestStatus;
  note?: string | null;
  createdAt: number;
  decidedAt?: number | null;
}

/** Admin payload to create/update a plan (code is server-assigned on create). */
export interface PlanInput {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  maxShops: number;
  maxProducts: number;
  recommended: boolean;
  sortOrder?: number;
  features: string[];
}

/** A seller currently on a paid plan, for the admin subscriber table. */
export interface AdminSubscriberRow {
  userId: string;
  userName: string;
  userEmail: string;
  shopId?: string | null;
  shopName?: string | null;
  planCode: string;
  planName: string;
  price: number;
  status: SubscriptionStatus;
  registeredAt: number;
  expiresAt: number;
  daysRemaining: number;
}
