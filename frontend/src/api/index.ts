/**
 * TrueWrist backend API.
 *
 * Each endpoint group returns data already normalised into the frontend view
 * types (see ./types). Components call these instead of the old localStorage
 * mock helpers.
 */
import { http, setToken, getToken as getTokenSafe, ApiError } from './client';
import { validateImageFile } from '../utils/uploads';
import type {
  AdminPlanOverview,
  AdminSubscriberRow,
  AdminTransaction,
  AppNotification,
  ClosetItem,
  ConversationSummary,
  ConversationThread,
  ConversationMessage,
  Feedback,
  Lead,
  PaymentCheckout,
  PaymentStatus,
  PlanInput,
  PlanUpgradeRequest,
  ProductComment,
  RevenueStats,
  Role,
  Shop,
  ShopSubscription,
  StartConversationInput,
  SubscriptionPlan,
  SubscriptionPlanCode,
  User,
  Watch,
} from './types';

export * from './types';
export { ApiError, getToken, setToken } from './client';

// --- Adapters: backend DTO -> frontend view ---------------------------------

const lower = (v: unknown): any => (typeof v === 'string' ? v.toLowerCase() : v);

function toUser(d: any): User {
  const roles: Role[] = Array.isArray(d.roles) && d.roles.length
    ? d.roles.map((r: unknown) => lower(r) as Role)
    : d.role
      ? [lower(d.role) as Role]
      : [];
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    role: lower(d.role) as Role,
    roles,
    shopId: d.shopId ?? null,
    status: lower(d.status) as User['status'],
    provider: lower(d.provider),
    avatar: d.avatar ?? null,
    phone: d.phone ?? null,
    emailVerified: d.emailVerified ?? true,
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
    arReviewStatus: lower(d.arReviewStatus) as Watch['arReviewStatus'],
    arReviewNote: d.arReviewNote ?? null,
    shopId: d.shopId,
    createdAt: d.createdAt,
  };
}

function toShop(d: any): Shop {
  return {
    id: d.id,
    ownerId: d.ownerId ?? null,
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
    mapUrl: d.mapUrl,
    services: d.services ?? [],
    rating: d.rating,
    reviewCount: d.reviewCount,
    since: d.since,
    status: lower(d.status) as Shop['status'],
    lockReason: d.lockReason ?? null,
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
    createdAt: d.createdAt,
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

function toComment(d: any): ProductComment {
  return {
    id: d.id,
    watchId: d.watchId,
    userId: d.userId,
    authorName: d.authorName,
    authorAvatar: d.authorAvatar ?? null,
    isShop: !!d.isShop,
    triedAr: !!d.triedAr,
    body: d.body,
    parentId: d.parentId ?? null,
    createdAt: d.createdAt,
    replies: Array.isArray(d.replies) ? d.replies.map(toComment) : [],
  };
}

function toUpgradeRequest(d: any): PlanUpgradeRequest {
  return {
    id: d.id,
    userId: d.userId,
    userName: d.userName ?? null,
    userEmail: d.userEmail ?? null,
    planCode: d.planCode,
    planName: d.planName,
    planPrice: d.planPrice ?? 0,
    planDurationDays: d.planDurationDays ?? 0,
    status: lower(d.status) as PlanUpgradeRequest['status'],
    note: d.note ?? null,
    createdAt: d.createdAt,
    decidedAt: d.decidedAt ?? null,
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
  /** Register — creates an UNVERIFIED account and emails a link; no auto-login. */
  async register(name: string, email: string, password: string): Promise<{ email: string; message: string }> {
    const d = await http.post<any>('/api/auth/register', { name, email, password }, { auth: false });
    return { email: d.email, message: d.message };
  },
  /** Verify the email from the link's token, then sign in. */
  async verifyEmail(token: string): Promise<AuthResult> {
    const d = await http.post<any>('/api/auth/verify-email', { token }, { auth: false });
    setToken(d.token);
    return { token: d.token, user: toUser(d.user) };
  },
  /** Resend the verification email (always resolves). */
  async resendVerification(email: string): Promise<void> {
    await http.post('/api/auth/resend-verification', { email }, { auth: false });
  },
  async me(): Promise<User> {
    return toUser(await http.get<any>('/api/auth/me'));
  },
  /** Request a password-reset email (always resolves; never reveals if email exists). */
  async forgotPassword(email: string): Promise<void> {
    await http.post('/api/auth/forgot-password', { email }, { auth: false });
  },
  /** Complete a password reset with the token from the emailed link. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await http.post('/api/auth/reset-password', { token, newPassword }, { auth: false });
  },
  /** Self-service profile edit: name, email, avatar, and/or password change. */
  async updateProfile(input: {
    name?: string;
    email?: string;
    avatar?: string | null;
    phone?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<User> {
    return toUser(await http.put<any>('/api/auth/me', { ...input }));
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
  /** Admin: AR-enabled watches awaiting/holding a moderation decision. */
  async arModeration(): Promise<Watch[]> {
    return (await http.get<any[]>('/api/watches/ar-moderation')).map(toWatch);
  },
  /** Admin: approve or reject a watch's AR/3D model. */
  async reviewAr(id: string, status: 'approved' | 'rejected', note?: string): Promise<Watch> {
    return toWatch(
      await http.post<any>(`/api/watches/${id}/ar-review`, { status: upper(status), note }),
    );
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
    mapUrl: s.mapUrl,
    services: s.services ?? [],
    since: s.since,
    status: upper(s.status) ?? 'ACTIVE',
    lockReason: s.lockReason ?? null,
  };
}

export const shopApi = {
  async list(): Promise<Shop[]> {
    return (await http.get<any[]>('/api/shops', { auth: false })).map(toShop);
  },
  /** Shops owned by the signed-in seller (management screen). */
  async mine(): Promise<Shop[]> {
    return (await http.get<any[]>('/api/shops/mine')).map(toShop);
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
  /** Set this shop as the seller's active (primary) shop. */
  async activate(id: string): Promise<Shop> {
    return toShop(await http.post<any>(`/api/shops/${id}/activate`));
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
      role: upper(u.role), roles: u.roles?.map((r) => upper(r)),
      shopId: u.shopId, phone: u.phone, status: upper(u.status),
    }));
  },
  async update(id: string, u: Partial<User> & { password?: string }): Promise<User> {
    return toUser(await http.put<any>(`/api/users/${id}`, {
      name: u.name, email: u.email, password: u.password,
      role: upper(u.role), roles: u.roles?.map((r) => upper(r)),
      shopId: u.shopId, phone: u.phone, status: upper(u.status),
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

// --- Comments (threaded; no ratings) ----------------------------------------

export const commentApi = {
  /** Public list of a watch's comments (top-level newest-first, with replies). */
  async list(watchId: string): Promise<ProductComment[]> {
    return (await http.get<any[]>(`/api/watches/${watchId}/comments`, { auth: false })).map(toComment);
  },
  /** Post a comment, or a reply when {@code parentId} is given. */
  async create(
    watchId: string,
    input: { body: string; triedAr?: boolean; parentId?: string | null },
  ): Promise<ProductComment> {
    return toComment(await http.post<any>(`/api/watches/${watchId}/comments`, {
      body: input.body,
      triedAr: input.triedAr ?? false,
      parentId: input.parentId ?? null,
    }));
  },
  /** Edit a comment's text (author or admin). */
  async update(
    watchId: string,
    commentId: string,
    input: { body: string; triedAr?: boolean },
  ): Promise<ProductComment> {
    return toComment(await http.put<any>(`/api/watches/${watchId}/comments/${commentId}`, {
      body: input.body,
      triedAr: input.triedAr ?? false,
    }));
  },
  async remove(watchId: string, commentId: string): Promise<void> {
    await http.del(`/api/watches/${watchId}/comments/${commentId}`);
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

// --- Shop subscription ------------------------------------------------------

export const subscriptionApi = {
  async get(): Promise<ShopSubscription> {
    return http.get<ShopSubscription>('/api/subscription');
  },
  /** Non-trial plans a user can request to upgrade to. */
  async plans(): Promise<SubscriptionPlan[]> {
    return http.get<SubscriptionPlan[]>('/api/subscription/plans');
  },
  /** Submit an upgrade request (queued for manual admin approval). */
  async requestUpgrade(plan: SubscriptionPlanCode): Promise<PlanUpgradeRequest> {
    return toUpgradeRequest(await http.post<any>('/api/subscription/requests', { plan }));
  },
  /** The signed-in user's own upgrade requests (latest first). */
  async myRequests(): Promise<PlanUpgradeRequest[]> {
    return (await http.get<any[]>('/api/subscription/requests/mine')).map(toUpgradeRequest);
  },
  /** Admin: queue of upgrade requests awaiting a decision. */
  async adminRequests(): Promise<PlanUpgradeRequest[]> {
    return (await http.get<any[]>('/api/subscription/admin/requests')).map(toUpgradeRequest);
  },
  /** Admin: approve a request — grants SHOP role and applies the plan. */
  async approveRequest(id: string): Promise<PlanUpgradeRequest> {
    return toUpgradeRequest(await http.post<any>(`/api/subscription/admin/requests/${id}/approve`));
  },
  /** Admin: reject a request with an optional reason. */
  async rejectRequest(id: string, note?: string): Promise<PlanUpgradeRequest> {
    return toUpgradeRequest(await http.post<any>(`/api/subscription/admin/requests/${id}/reject`, { note }));
  },
  /** Admin: real plan catalogue with active-subscriber counts. */
  async adminOverview(): Promise<AdminPlanOverview[]> {
    return http.get<AdminPlanOverview[]>('/api/subscription/admin/overview');
  },
  /** Admin: create a new plan. */
  async adminCreatePlan(input: PlanInput): Promise<AdminPlanOverview> {
    return http.post<AdminPlanOverview>('/api/subscription/admin/plans', { ...input });
  },
  /** Admin: update an existing plan. */
  async adminUpdatePlan(code: string, input: PlanInput): Promise<AdminPlanOverview> {
    return http.put<AdminPlanOverview>(`/api/subscription/admin/plans/${code}`, { ...input });
  },
  /** Admin: delete a plan (blocked while it has active subscribers). */
  async adminDeletePlan(code: string): Promise<void> {
    await http.del(`/api/subscription/admin/plans/${code}`);
  },
  /** Admin: sellers currently on a paid plan, with user + shop info. */
  async adminSubscribers(): Promise<AdminSubscriberRow[]> {
    return http.get<AdminSubscriberRow[]>('/api/subscription/admin/subscribers');
  },
  /** Admin: move a seller onto a different plan (resets the period). */
  async adminChangePlan(userId: string, plan: string): Promise<void> {
    await http.post(`/api/subscription/admin/subscribers/${userId}/change-plan`, { plan });
  },
  /** Admin: extend a seller's current period by N days. */
  async adminExtend(userId: string, days: number): Promise<void> {
    await http.post(`/api/subscription/admin/subscribers/${userId}/extend`, { days });
  },
  /** Admin: cancel a seller's plan (expires it immediately). */
  async adminCancel(userId: string): Promise<void> {
    await http.post(`/api/subscription/admin/subscribers/${userId}/cancel`, {});
  },
};

// --- Payments (PayOS QR gateway) -------------------------------------------

export const paymentApi = {
  /** Start a QR payment for a plan; returns the QR + checkout details. */
  async checkout(plan: SubscriptionPlanCode): Promise<PaymentCheckout> {
    return http.post<PaymentCheckout>('/api/payment/checkout', { plan });
  },
  /** Poll the status of one of the caller's transactions. */
  async status(orderCode: number): Promise<PaymentStatus> {
    const d = await http.get<{ orderCode: number; status: PaymentStatus }>(
      `/api/payment/status/${orderCode}`,
    );
    return d.status;
  },
  /** Fallback mode only: manually confirm payment (no PayOS configured). */
  async devConfirm(orderCode: number): Promise<PaymentStatus> {
    const d = await http.post<{ orderCode: number; status: PaymentStatus }>(
      `/api/payment/dev/confirm/${orderCode}`,
    );
    return d.status;
  },
  /** Admin: all transactions, newest first. */
  async adminTransactions(): Promise<AdminTransaction[]> {
    return http.get<AdminTransaction[]>('/api/payment/admin/transactions');
  },
  /** Admin: revenue dashboard stats. */
  async adminRevenue(): Promise<RevenueStats> {
    return http.get<RevenueStats>('/api/payment/admin/revenue');
  },
  /** Admin: manually mark a transaction as paid (and activate the plan). */
  async adminMarkPaid(id: string): Promise<AdminTransaction> {
    return http.post<AdminTransaction>(`/api/payment/admin/transactions/${id}/mark-paid`, {});
  },
  /** Admin: cancel a pending transaction. */
  async adminCancel(id: string, note?: string): Promise<AdminTransaction> {
    return http.post<AdminTransaction>(`/api/payment/admin/transactions/${id}/cancel`, { note });
  },
  /** Admin: refund a paid transaction. */
  async adminRefund(id: string, note?: string): Promise<AdminTransaction> {
    return http.post<AdminTransaction>(`/api/payment/admin/transactions/${id}/refund`, { note });
  },
};

// --- Messaging (inbox) ------------------------------------------------------

export const messagingApi = {
  /** The signed-in customer's own threads. */
  async myConversations(): Promise<ConversationSummary[]> {
    return http.get<ConversationSummary[]>('/api/conversations');
  },
  /** Open a new thread to the admins or a shop. */
  async start(input: StartConversationInput): Promise<ConversationThread> {
    return http.post<ConversationThread>('/api/conversations', { ...input });
  },
  /** A thread's full history (marks the viewer's side read). */
  async thread(id: string): Promise<ConversationThread> {
    return http.get<ConversationThread>(`/api/conversations/${id}`);
  },
  /** Append a message to a thread. */
  async reply(id: string, body: string): Promise<ConversationMessage> {
    return http.post<ConversationMessage>(`/api/conversations/${id}/messages`, { body });
  },
  /** Seller inbox: threads addressed to the seller's shops. */
  async shopInbox(): Promise<ConversationSummary[]> {
    return http.get<ConversationSummary[]>('/api/conversations/inbox/shop');
  },
  /** Admin inbox: threads addressed to the platform. */
  async adminInbox(): Promise<ConversationSummary[]> {
    return http.get<ConversationSummary[]>('/api/conversations/inbox/admin');
  },
};

// --- Notifications (bell) ---------------------------------------------------

export const notificationApi = {
  async list(): Promise<AppNotification[]> {
    return http.get<AppNotification[]>('/api/notifications');
  },
  async unreadCount(): Promise<number> {
    const d = await http.get<{ count: number }>('/api/notifications/unread-count');
    return d.count;
  },
  async markRead(id: string): Promise<void> {
    await http.post(`/api/notifications/${id}/read`, {});
  },
  async markAllRead(): Promise<void> {
    await http.post('/api/notifications/read-all', {});
  },
};

// --- Uploads (MinIO) --------------------------------------------------------

export const uploadApi = {
  /** Upload a watch/shop image file; returns its public URL. */
  async image(file: File, folder = 'watches'): Promise<string> {
    const validationError = validateImageFile(file);
    if (validationError) {
      throw new ApiError(400, validationError);
    }
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
