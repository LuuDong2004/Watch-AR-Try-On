/**
 * TrueWrist backend API.
 *
 * Each endpoint group returns data already normalised into the frontend view
 * types (see ./types). Components call these instead of the old localStorage
 * mock helpers.
 */
import { http, setToken, getToken as getTokenSafe } from './client';
import type {
  ClosetItem,
  Feedback,
  Lead,
  Role,
  Shop,
  User,
  Watch,
} from './types';

export * from './types';
export { ApiError, getToken, setToken } from './client';

// --- Adapters: backend DTO -> frontend view ---------------------------------

const lower = (v: unknown): any => (typeof v === 'string' ? v.toLowerCase() : v);

function toUser(d: any): User {
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    role: lower(d.role) as Role,
    shopId: d.shopId ?? null,
    status: lower(d.status) as User['status'],
    provider: lower(d.provider),
    createdAt: d.createdAt,
  };
}

function toWatch(d: any): Watch {
  return {
    id: d.id,
    name: d.name,
    brand: d.brand,
    price: d.price,
    originalPrice: d.originalPrice ?? null,
    description: d.description,
    specs: d.specs ?? {},
    image: d.image,
    gallery: d.gallery ?? [],
    model: d.modelUrl ?? '',
    hasAR: !!d.hasAR,
    arWatchId: d.arWatchId,
    variant: d.variant,
    metal: d.metal,
    dial: d.dial,
    accent: d.accent,
    rating: d.rating,
    reviewCount: d.reviewCount,
    status: lower(d.status) as Watch['status'],
    shopId: d.shopId,
    createdAt: d.createdAt,
  };
}

function toShop(d: any): Shop {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email,
    address: d.address,
    description: d.description,
    color: d.color,
    zalo: d.zalo,
    messenger: d.messenger,
    hours: d.hours,
    manager: d.manager,
    image: d.image,
    services: d.services ?? [],
    rating: d.rating,
    reviewCount: d.reviewCount,
    since: d.since,
    status: lower(d.status) as Shop['status'],
    createdAt: d.createdAt,
  };
}

function toLead(d: any): Lead {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email,
    watchId: d.watchId,
    watchName: d.watchName,
    watchBrand: d.watchBrand,
    shopId: d.shopId,
    shopName: d.shopName,
    type: lower(d.type) as Lead['type'],
    date: d.date,
    time: d.time,
    message: d.message,
    status: lower(d.status) as Lead['status'],
    timestamp: d.timestamp,
    channel: lower(d.channel) as Lead['channel'],
    hasTriedOn: !!d.hasTriedOn,
    triedOnImage: d.triedOnImage,
    userId: d.userId ?? null,
  };
}

function toCloset(d: any): ClosetItem {
  return {
    id: d.id,
    watchId: d.watchId,
    watchName: d.watchName,
    watchBrand: d.watchBrand,
    price: d.price,
    imageUrl: d.imageUrl,
    date: d.date,
  };
}

function toFeedback(d: any): Feedback {
  return {
    id: d.id,
    target: lower(d.target) as Feedback['target'],
    shopId: d.shopId,
    shopName: d.shopName,
    rating: d.rating,
    topic: d.topic,
    message: d.message,
    name: d.name,
    contact: d.contact,
    timestamp: d.timestamp,
  };
}

const upper = (v?: string) => (v ? v.toUpperCase() : v);

// --- Auth -------------------------------------------------------------------

export interface AuthResult {
  token: string;
  user: User;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResult> {
    const d = await http.post<any>('/api/auth/login', { email, password }, { auth: false });
    setToken(d.token);
    return { token: d.token, user: toUser(d.user) };
  },
  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const d = await http.post<any>('/api/auth/register', { name, email, password }, { auth: false });
    setToken(d.token);
    return { token: d.token, user: toUser(d.user) };
  },
  async me(): Promise<User> {
    return toUser(await http.get<any>('/api/auth/me'));
  },
  logout() {
    setToken(null);
  },
};

// --- Watches ----------------------------------------------------------------

/** Build a backend WatchRequest from a partial frontend watch. */
function watchPayload(w: Partial<Watch>) {
  return {
    name: w.name,
    brand: w.brand,
    price: w.price,
    originalPrice: w.originalPrice ?? null,
    description: w.description,
    specs: w.specs ?? {},
    image: w.image,
    gallery: w.gallery ?? [],
    modelUrl: w.model ?? '',
    hasAR: w.hasAR ?? false,
    // Backend requires a non-empty AR catalogue reference; 'chrono' is the only one.
    arWatchId: w.arWatchId || 'chrono',
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

export const watchApi = {
  async list(shopId?: string): Promise<Watch[]> {
    const q = shopId ? `?shopId=${encodeURIComponent(shopId)}` : '';
    return (await http.get<any[]>(`/api/watches${q}`, { auth: false })).map(toWatch);
  },
  async get(id: string): Promise<Watch> {
    return toWatch(await http.get<any>(`/api/watches/${id}`, { auth: false }));
  },
  async create(w: Partial<Watch>): Promise<Watch> {
    return toWatch(await http.post<any>('/api/watches', watchPayload(w)));
  },
  async update(id: string, w: Partial<Watch>): Promise<Watch> {
    return toWatch(await http.put<any>(`/api/watches/${id}`, watchPayload(w)));
  },
  async remove(id: string): Promise<void> {
    await http.del(`/api/watches/${id}`);
  },
};

// --- Shops ------------------------------------------------------------------

function shopPayload(s: Partial<Shop>) {
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

export const shopApi = {
  async list(): Promise<Shop[]> {
    return (await http.get<any[]>('/api/shops', { auth: false })).map(toShop);
  },
  async get(id: string): Promise<Shop> {
    return toShop(await http.get<any>(`/api/shops/${id}`, { auth: false }));
  },
  async create(s: Partial<Shop>): Promise<Shop> {
    return toShop(await http.post<any>('/api/shops', shopPayload(s)));
  },
  async update(id: string, s: Partial<Shop>): Promise<Shop> {
    return toShop(await http.put<any>(`/api/shops/${id}`, shopPayload(s)));
  },
  async remove(id: string): Promise<void> {
    await http.del(`/api/shops/${id}`);
  },
};

// --- Users (admin) ----------------------------------------------------------

export const userApi = {
  async list(): Promise<User[]> {
    return (await http.get<any[]>('/api/users')).map(toUser);
  },
  async get(id: string): Promise<User> {
    return toUser(await http.get<any>(`/api/users/${id}`));
  },
  async create(u: Partial<User> & { password: string }): Promise<User> {
    return toUser(await http.post<any>('/api/users', {
      name: u.name, email: u.email, password: u.password,
      role: upper(u.role), shopId: u.shopId, status: upper(u.status),
    }));
  },
  async update(id: string, u: Partial<User> & { password?: string }): Promise<User> {
    return toUser(await http.put<any>(`/api/users/${id}`, {
      name: u.name, email: u.email, password: u.password,
      role: upper(u.role), shopId: u.shopId, status: upper(u.status),
    }));
  },
  async remove(id: string): Promise<void> {
    await http.del(`/api/users/${id}`);
  },
};

// --- Leads ------------------------------------------------------------------

export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  watchId?: string;
  watchName?: string;
  watchBrand?: string;
  shopId: string;
  shopName?: string;
  type: Lead['type'];
  date?: string;
  time?: string;
  message?: string;
  channel?: Lead['channel'];
  hasTriedOn?: boolean;
  triedOnImage?: string;
}

export const leadApi = {
  /** Create a lead (public; userId attached automatically when signed in). */
  async create(input: LeadInput): Promise<Lead> {
    return toLead(await http.post<any>('/api/leads', {
      ...input,
      type: upper(input.type),
      channel: upper(input.channel) ?? 'FORM',
      hasTriedOn: input.hasTriedOn ?? false,
    }, { auth: !!getTokenSafe() }));
  },
  /** Leads for the signed-in shop/admin. */
  async list(): Promise<Lead[]> {
    return (await http.get<any[]>('/api/leads')).map(toLead);
  },
  /** The signed-in customer's own enquiry history. */
  async mine(): Promise<Lead[]> {
    return (await http.get<any[]>('/api/leads/mine')).map(toLead);
  },
  async updateStatus(id: string, status: Lead['status']): Promise<Lead> {
    return toLead(await http.patch<any>(`/api/leads/${id}/status`, { status: upper(status) }));
  },
  async remove(id: string): Promise<void> {
    await http.del(`/api/leads/${id}`);
  },
};

// --- Favorites --------------------------------------------------------------

export const favoriteApi = {
  async list(): Promise<string[]> {
    return http.get<string[]>('/api/favorites');
  },
  async toggle(watchId: string): Promise<boolean> {
    const d = await http.post<any>(`/api/favorites/${watchId}/toggle`);
    return !!d.favorited;
  },
};

// --- Closet (AR saves) ------------------------------------------------------

export const closetApi = {
  async list(): Promise<ClosetItem[]> {
    return (await http.get<any[]>('/api/closet')).map(toCloset);
  },
  async create(watchId: string, imageUrl: string, date?: string): Promise<ClosetItem> {
    return toCloset(await http.post<any>('/api/closet', { watchId, imageUrl, date }));
  },
  async remove(id: string): Promise<void> {
    await http.del(`/api/closet/${id}`);
  },
};

// --- Feedback ---------------------------------------------------------------

export interface FeedbackInput {
  target: Feedback['target'];
  shopId?: string;
  shopName?: string;
  rating: number;
  topic?: string;
  message: string;
  name: string;
  contact?: string;
}

export const feedbackApi = {
  async create(input: FeedbackInput): Promise<Feedback> {
    return toFeedback(await http.post<any>('/api/feedback', {
      ...input, target: upper(input.target),
    }, { auth: !!getTokenSafe() }));
  },
  async list(): Promise<Feedback[]> {
    return (await http.get<any[]>('/api/feedback')).map(toFeedback);
  },
};

// --- Uploads (MinIO) --------------------------------------------------------

export const uploadApi = {
  /** Upload a watch/shop image file; returns its public URL. */
  async image(file: File, folder = 'watches'): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    const d = await http.postForm<any>('/api/uploads', form);
    return d.url;
  },
  /** Upload an AR snapshot captured as a base64 data URL; returns its public URL. */
  async dataUrl(dataUrl: string, folder = 'ar'): Promise<string> {
    const d = await http.post<any>('/api/uploads/data-url', { dataUrl, folder }, { auth: false });
    return d.url;
  },
};
