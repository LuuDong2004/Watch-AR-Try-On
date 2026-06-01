import { api } from './client';
import { normCloset, normFeedback, normLead, upper } from './normalize';
import type { ClosetItem, Feedback, Lead } from '../data/types';

// --- Favorites (user-scoped) -----------------------------------------------

export async function getFavorites(): Promise<string[]> {
  return api<string[]>('/api/favorites');
}

export async function toggleFavorite(watchId: string): Promise<boolean> {
  const res = await api<{ favorited: boolean }>(`/api/favorites/${watchId}/toggle`, {
    method: 'POST',
  });
  return res.favorited;
}

// --- Leads -----------------------------------------------------------------

export type LeadInput = Omit<Lead, 'id' | 'status' | 'timestamp'>;

export async function listLeads(): Promise<Lead[]> {
  return (await api<any[]>('/api/leads')).map(normLead);
}

export async function myLeads(): Promise<Lead[]> {
  return (await api<any[]>('/api/leads/mine')).map(normLead);
}

/** Public contact-form submission; works signed-in or anonymous. */
export async function createLead(input: Partial<LeadInput>): Promise<Lead> {
  const body = {
    name: input.name,
    phone: input.phone,
    email: input.email,
    watchId: input.watchId,
    watchName: input.watchName,
    watchBrand: input.watchBrand,
    shopId: input.shopId,
    shopName: input.shopName,
    type: upper(input.type),
    date: input.date,
    time: input.time,
    message: input.message,
    channel: upper(input.channel) ?? 'FORM',
    hasTriedOn: input.hasTriedOn ?? false,
    triedOnImage: input.triedOnImage,
  };
  return normLead(await api<any>('/api/leads', { method: 'POST', body }));
}

export async function updateLeadStatus(id: string, status: Lead['status']): Promise<Lead> {
  return normLead(
    await api<any>(`/api/leads/${id}/status`, { method: 'PATCH', body: { status: upper(status) } }),
  );
}

export async function deleteLead(id: string): Promise<void> {
  await api<void>(`/api/leads/${id}`, { method: 'DELETE' });
}

// --- Feedback --------------------------------------------------------------

export type FeedbackInput = Omit<Feedback, 'id' | 'timestamp'>;

export async function listFeedback(): Promise<Feedback[]> {
  return (await api<any[]>('/api/feedback')).map(normFeedback);
}

export async function createFeedback(input: Partial<FeedbackInput>): Promise<Feedback> {
  const body = {
    target: upper(input.target),
    shopId: input.shopId,
    shopName: input.shopName,
    rating: input.rating,
    topic: input.topic,
    message: input.message,
    name: input.name,
    contact: input.contact,
  };
  return normFeedback(await api<any>('/api/feedback', { method: 'POST', body }));
}

// --- Closet (AR try-on history, user-scoped) -------------------------------

export async function listCloset(): Promise<ClosetItem[]> {
  return (await api<any[]>('/api/closet')).map(normCloset);
}

export async function addCloset(watchId: string, imageUrl: string, date?: string): Promise<ClosetItem> {
  return normCloset(
    await api<any>('/api/closet', { method: 'POST', body: { watchId, imageUrl, date } }),
  );
}

export async function deleteCloset(id: string): Promise<void> {
  await api<void>(`/api/closet/${id}`, { method: 'DELETE' });
}
