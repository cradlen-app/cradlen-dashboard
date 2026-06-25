import { NextResponse } from 'next/server';
import { apiCall } from '@/lib/server-api';

/** Step 1: forward credentials; the API emails an OTP. No cookies set yet. */
export async function POST(req: Request) {
  const body = await req.json();
  const { status, body: data } = await apiCall('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(data, { status });
}
