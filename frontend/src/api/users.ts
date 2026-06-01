import { api } from './client';
import { normUser, upper } from './normalize';
import type { User } from '../data/types';

export type UserInput = Omit<User, 'id' | 'createdAt'>;

export async function listUsers(): Promise<User[]> {
  const res = await api<any[]>('/api/users');
  return res.map(normUser);
}

export async function createUser(input: Partial<UserInput>): Promise<User> {
  const body = {
    name: input.name,
    email: input.email,
    password: input.password,
    role: upper(input.role),
    shopId: input.shopId || null,
    status: upper(input.status) ?? 'ACTIVE',
  };
  return normUser(await api<any>('/api/users', { method: 'POST', body }));
}

export async function updateUser(id: string, patch: Partial<UserInput>): Promise<User> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.email !== undefined) body.email = patch.email;
  if (patch.password) body.password = patch.password;
  if (patch.role !== undefined) body.role = upper(patch.role);
  if (patch.shopId !== undefined) body.shopId = patch.shopId ?? '';
  if (patch.status !== undefined) body.status = upper(patch.status);
  return normUser(await api<any>(`/api/users/${id}`, { method: 'PUT', body }));
}

export async function deleteUser(id: string): Promise<void> {
  await api<void>(`/api/users/${id}`, { method: 'DELETE' });
}
