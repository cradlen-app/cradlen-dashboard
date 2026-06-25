import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiCall } from '@/lib/server-api';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/config';

export async function POST() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    await apiCall('/admin/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refresh }),
    });
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  return NextResponse.json({ ok: true });
}
