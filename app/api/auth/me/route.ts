import { proxyRequest } from '@/lib/proxy';

/** Returns the current admin identity (used as the auth probe). */
export async function GET() {
  return proxyRequest('/admin/auth/me');
}
