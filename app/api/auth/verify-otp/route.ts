import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiCall } from '@/lib/server-api';
import { ACCESS_COOKIE, COOKIE_OPTS, REFRESH_COOKIE } from '@/lib/config';

/** Step 2: verify the OTP; on success, store the token pair as httpOnly cookies. */
export async function POST(req: Request) {
  const body = await req.json();
  const { status, body: data } = await apiCall('/admin/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (status !== 200) {
    return NextResponse.json(data, { status });
  }

  const tokens = (data as { data?: { access_token: string; refresh_token: string } })
    ?.data;
  const jar = await cookies();
  if (tokens?.access_token) jar.set(ACCESS_COOKIE, tokens.access_token, COOKIE_OPTS);
  if (tokens?.refresh_token)
    jar.set(REFRESH_COOKIE, tokens.refresh_token, COOKIE_OPTS);

  // Never leak the tokens to client JS.
  return NextResponse.json({ ok: true }, { status: 200 });
}
