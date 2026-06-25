/** Server-side configuration. These values are only read in route handlers. */
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/v1';

/** httpOnly cookie names holding the admin session tokens. */
export const ACCESS_COOKIE = 'cad_access';
export const REFRESH_COOKIE = 'cad_refresh';

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};
