import { API_BASE_URL } from './config';

export interface ApiResult {
  status: number;
  body: unknown;
}

/** Raw server-side call to the cradlen-api. Never invoked from the browser. */
export async function apiCall(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<ApiResult> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/** Exchanges a refresh token for a fresh pair, or null if it is no longer valid. */
export async function refreshTokens(
  refreshToken: string,
): Promise<TokenPair | null> {
  const { status, body } = await apiCall('/admin/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (status !== 200) return null;
  const data = (body as { data?: TokenPair })?.data;
  return data?.access_token && data?.refresh_token ? data : null;
}
