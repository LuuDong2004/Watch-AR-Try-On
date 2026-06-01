import { api, apiUrl, clearToken, setToken } from './client';
import { normUser } from './normalize';
import type { User } from '../data/types';

interface AuthResponse {
  token: string;
  user: User;
}

/** Email + password login. Stores the JWT on success. */
export async function login(email: string, password: string): Promise<User> {
  const res = await api<any>('/api/auth/login', {
    method: 'POST',
    anonymous: true,
    body: { email: email.trim(), password },
  });
  setToken(res.token);
  return normUser(res.user);
}

/** Self-service customer registration. Stores the JWT on success. */
export async function register(name: string, email: string, password: string): Promise<User> {
  const res = await api<any>('/api/auth/register', {
    method: 'POST',
    anonymous: true,
    body: { name: name.trim(), email: email.trim(), password },
  });
  setToken(res.token);
  return normUser(res.user);
}

/** Rehydrate the current user from the stored bearer token. */
export async function me(): Promise<User> {
  const res = await api<any>('/api/auth/me');
  return normUser(res);
}

export function logout(): void {
  clearToken();
}

/** Full URL the browser is sent to in order to start the Google OAuth flow. */
export function googleLoginUrl(): string {
  return apiUrl('/oauth2/authorization/google');
}

export type { AuthResponse };
