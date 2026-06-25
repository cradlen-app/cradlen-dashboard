import { proxyRequest } from '@/lib/proxy';

/**
 * Authenticated passthrough to the cradlen-api `/admin/*` surface. The browser
 * calls `/api/proxy/<path>` (same origin, so no CORS); this attaches the admin
 * token from the httpOnly cookie and forwards. Query string is preserved.
 */
async function handle(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  const target = `/admin/${path.join('/')}${search}`;

  const method = req.method;
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const init: RequestInit = {
    method,
    ...(hasBody ? { body: await req.text() } : {}),
  };
  return proxyRequest(target, init);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
