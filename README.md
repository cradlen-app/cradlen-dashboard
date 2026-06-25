# Cradlen Admin

Standalone platform-administration console for Cradlen. A cross-tenant operator
dashboard to manage **all** organizations, users, and subscriptions — distinct
from the org-scoped staff app (`cradlen-web`).

It is a thin client over the cradlen-api `/v1/admin/*` surface: **cradlen-api is
the single source of truth.** There is no second database (no Supabase).

## Architecture

- **Next.js 16** (App Router) + React Query + Tailwind v4.
- **Auth:** password → email OTP (the `admin-jwt` audience in cradlen-api).
  Tokens are held in **httpOnly cookies**, never exposed to client JS.
- **No CORS:** the browser only talks to this app's own route handlers. A
  server-side proxy (`app/api/proxy/[...path]`) attaches the admin token from
  the cookie and forwards to cradlen-api, transparently rotating the refresh
  token on a 401.

```
browser ──(same origin)──▶ Next route handlers ──(Bearer admin token)──▶ cradlen-api /v1/admin/*
                           httpOnly cookies
```

## Surfaces

- **Dashboard** — org / user / active-subscription counts + the payments-to-verify queue.
- **Organizations** — list/search + detail (branch & staff counts, subscription), suspend / reactivate.
- **Users** — cross-tenant directory with memberships; deactivate / reactivate / reset password.
- **Subscriptions** — suspend / cancel / reactivate / extend / change plan.
- **Payments** — manual-proof verification queue with a proof viewer; verify / reject.
- **Audit log** — every admin write, in order.

## Running locally

1. Start cradlen-api (defaults to `http://localhost:3000`).
2. Seed the first admin in cradlen-api: set `PLATFORM_ADMIN_EMAIL` /
   `PLATFORM_ADMIN_PASSWORD` in its env and run `npx prisma db seed`.
3. In this app:

   ```bash
   npm install
   npm run dev        # http://localhost:3100
   ```

   Configure `API_BASE_URL` in `.env.local` if cradlen-api is not on
   `http://localhost:3000/v1`.

OTP codes are emailed by cradlen-api (Resend). In local dev without a reachable
inbox, read the latest `verification_codes` row for the admin (the code is
bcrypt-hashed — for testing, plant a known code as the newest unconsumed
`ADMIN_LOGIN` row).
