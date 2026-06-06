/**
 * Thin fetch wrapper around the TrueWrist backend.
 *
 * - Base URL comes from VITE_API_BASE_URL (e.g. http://localhost:8888).
 * - A JWT is persisted in localStorage and attached as a Bearer token.
 * - Errors throw {@link ApiError} carrying the backend message + status.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'tw_token';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

type Json = Record<string, unknown> | unknown[] | null;

interface RequestOptions {
  /** Attach the bearer token (default true). */
  auth?: boolean;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data === 'object') {
      const msg = (data as any).message ?? (data as any).error;
      if (typeof msg === 'string' && msg) return msg;
    }
  } catch {
    /* not json */
  }
  return res.statusText || `Lỗi ${res.status}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: Json | FormData,
  opts: RequestOptions = {},
): Promise<T> {
  const { auth = true } = opts;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // browser sets multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  } catch (e) {
    throw new ApiError(0, 'Không kết nối được máy chủ. Kiểm tra backend đang chạy?');
  }

  if (res.status === 401 && auth) {
    // Token invalid/expired — clear it so the UI can redirect to login.
    setToken(null);
  }
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: Json, opts?: RequestOptions) => request<T>('POST', path, body, opts),
  put: <T>(path: string, body?: Json, opts?: RequestOptions) => request<T>('PUT', path, body, opts),
  patch: <T>(path: string, body?: Json, opts?: RequestOptions) => request<T>('PATCH', path, body, opts),
  del: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, undefined, opts),
  postForm: <T>(path: string, form: FormData, opts?: RequestOptions) => request<T>('POST', path, form, opts),
};
