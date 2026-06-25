import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, COOKIE_OPTS, REFRESH_COOKIE } from './config';
import { apiCall, refreshTokens } from './server-api';

/**
 * Proxies an authenticated request to the cradlen-api using the admin access
 * cookie. On a 401 it transparently rotates the refresh cookie once and retries,
 * writing the fresh pair back as httpOnly cookies. A 401 with no usable refresh
 * returns 401 so the client can redirect to login.
 */
export async function proxyRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  if (!access && !refresh) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let result = await apiCall(path, init, access);

  if (result.status === 401 && refresh) {
    const pair = await refreshTokens(refresh);
    if (!pair) {
      jar.delete(ACCESS_COOKIE);
      jar.delete(REFRESH_COOKIE);
      return NextResponse.json({ error: 'session_expired' }, { status: 401 });
    }
    jar.set(ACCESS_COOKIE, pair.access_token, COOKIE_OPTS);
    jar.set(REFRESH_COOKIE, pair.refresh_token, COOKIE_OPTS);
    result = await apiCall(path, init, pair.access_token);
  }

  return NextResponse.json(result.body, { status: result.status });
}
