import type { Paginated } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string } })?.error;
    throw new ApiError(res.status, err?.code, err?.message ?? res.statusText);
  }
  return json;
}

/** GET a single resource from the admin proxy and unwrap `{ data }`. */
export async function getOne<T>(path: string): Promise<T> {
  const json = await parse(await fetch(`/api/proxy/${path}`));
  return (json as { data: T }).data;
}

/** GET a paginated list from the admin proxy (`{ data: [], meta }`). */
export async function getList<T>(path: string): Promise<Paginated<T>> {
  const json = await parse(await fetch(`/api/proxy/${path}`));
  return json as Paginated<T>;
}

/** POST an action to the admin proxy. */
export async function postAction<T = unknown>(
  path: string,
  body?: unknown,
): Promise<T> {
  const json = await parse(
    await fetch(`/api/proxy/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }),
  );
  return (json as { data?: T })?.data as T;
}

/** PATCH a resource on the admin proxy and unwrap `{ data }`. */
export async function patchAction<T = unknown>(
  path: string,
  body?: unknown,
): Promise<T> {
  const json = await parse(
    await fetch(`/api/proxy/${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }),
  );
  return (json as { data?: T })?.data as T;
}

/** Build a `?key=value` query string from defined params. */
export function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
