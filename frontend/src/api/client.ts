/**
 * Thin fetch wrapper for the TrueWrist Spring backend.
 *
 * - Prepends VITE_API_URL.
 * - Attaches the stored JWT as a Bearer token.
 * - Parses JSON and turns the backend's {error, message} shape into ApiError.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8081').replace(/\/$/, '');

const TOKEN_KEY = 'truewrist-token';

/** The OAuth backend redirects here; also where the bearer token lives. */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore storage failures (private mode etc.) */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function apiUrl(path: string): string {
  return path.startsWith('http') ? path : `${BASE_URL}${path}`;
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** JSON body — serialized automatically. */
  body?: unknown;
  /** Skip attaching the bearer token (e.g. public login). */
  anonymous?: boolean;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, anonymous, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };

  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (!anonymous) {
    const token = getToken();
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Không thể kết nối máy chủ. Kiểm tra backend đang chạy ở cổng 8081.');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : null) ?? `Lỗi máy chủ (${res.status}).`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
