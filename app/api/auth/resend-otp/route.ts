import { NextResponse } from 'next/server';
import { apiCall } from '@/lib/server-api';

export async function POST(req: Request) {
  const body = await req.json();
  const { status, body: data } = await apiCall('/admin/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(data ?? { ok: true }, { status });
}
