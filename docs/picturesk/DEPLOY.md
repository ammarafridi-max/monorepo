# Deploying Picturesk.ai to Fly.io

> Written for the standalone picturesk repo. It now lives in the travel-suite
> monorepo, so the `pnpm deploy:*` shortcuts are gone (run `fly deploy -c ...`
> from the monorepo root) and the Dockerfiles still need rewriting for the new
> layout before a deploy will build.

Three Fly apps, one per service, all built from the monorepo root:

| Fly app | Source | Public? | Notes |
|---|---|---|---|
| `picturesk-api` | `apps/picturesk-api` | Yes (`:3001`) | Stripe webhook + web calls. Keep 1 machine up. |
| `picturesk-web` | `apps/picturesk-web` | Yes (`:3000`) | Next.js. NEXT_PUBLIC_* are baked at build. |
| `picturesk-worker` | `apps/picturesk-worker` | No | Drains the BullMQ queue. Runs continuously. |

MongoDB and Redis are **external managed services** (e.g. MongoDB Atlas + Upstash
Redis), reused via their connection strings; nothing is provisioned on Fly for
them. R2 (storage), Stripe, Replicate, and Brevo are the other external providers.

Rename the apps and set `primary_region` in each `fly.*.toml` to match your setup.

## 0. Prerequisites

```sh
# flyctl installed and logged in
fly version && fly auth whoami
# from the repo root
cd /path/to/picturesk
```

## 1. Create the three apps (one time)

```sh
fly apps create picturesk-api
fly apps create picturesk-web
fly apps create picturesk-worker
```

## 2. Set secrets (one time, and whenever a value changes)

Secrets are per-app. Runtime config lives here; only the web's `NEXT_PUBLIC_*`
values are the exception (they are build args, see step 3). Fill in real values.

**API** (`picturesk-api`):

```sh
fly secrets set -a picturesk-api \
  MONGODB_URI="mongodb+srv://..." \
  REDIS_URL="rediss://..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  REPLICATE_API_TOKEN="r8_..." \
  REPLICATE_DESTINATION_MODEL="youruser/picturesk-headshots" \
  R2_ACCOUNT_ID="..." R2_ACCESS_KEY_ID="..." R2_SECRET_ACCESS_KEY="..." \
  R2_BUCKET="picturesk" R2_PUBLIC_BASE_URL="https://pub-xxxx.r2.dev" \
  WEB_BASE_URL="https://picturesk-web.fly.dev" \
  ADMIN_TOKEN="$(openssl rand -hex 32)" \
  TRUST_PROXY_HOPS="1"
# Optional: UPLOAD_MODERATION, REPLICATE_MODERATION_*, RATE_LIMIT_*, SENTRY_DSN
```

`WEB_BASE_URL` is used for CORS and the Stripe success/cancel URLs, so it must be
the web app's public origin. `TRUST_PROXY_HOPS=1` is correct behind Fly's proxy
(so the rate limiter sees the real client IP, not the proxy).

**Worker** (`picturesk-worker`):

```sh
fly secrets set -a picturesk-worker \
  MONGODB_URI="mongodb+srv://..." \
  REDIS_URL="rediss://..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  REPLICATE_API_TOKEN="r8_..." \
  REPLICATE_DESTINATION_MODEL="youruser/picturesk-headshots" \
  R2_ACCOUNT_ID="..." R2_ACCESS_KEY_ID="..." R2_SECRET_ACCESS_KEY="..." \
  R2_BUCKET="picturesk" R2_PUBLIC_BASE_URL="https://pub-xxxx.r2.dev" \
  BREVO_API_KEY="xkeysib-..." BREVO_SENDER="Picturesk.ai <hello@picturesk.ai>" \
  WEB_BASE_URL="https://picturesk-web.fly.dev"
# Optional: GEN_LORA_SCALE, DELIVER_COUNT, SENTRY_DSN
# Identity culling stays OFF unless you set REPLICATE_FACE_EMBED_MODEL (see README).
```

**Web** (`picturesk-web`) — runtime secrets only (server components read these):

```sh
fly secrets set -a picturesk-web \
  MONGODB_URI="mongodb+srv://..." \
  AUTH_SECRET="$(openssl rand -hex 32)"
# Optional: SENTRY_DSN (server), and OAuth: GOOGLE_CLIENT_ID/SECRET, etc.
```

The web app's browser-facing config (`NEXT_PUBLIC_API_BASE_URL`, analytics DSN,
etc.) is baked at build time via `fly.picturesk-web.toml [build.args]`, not here.

## 3. Point the web build at the API

Edit `fly.picturesk-web.toml` -> `[build.args]` -> `NEXT_PUBLIC_API_BASE_URL` to the API's
public origin (e.g. `https://picturesk-api.fly.dev`, or your custom domain). This
is what the browser calls for presign / checkout / order polling. Because it is
inlined at build, you must redeploy the web app after changing it.

## 4. Deploy (order matters the first time)

Deploy the API first so its URL exists, then the web (whose build points at it),
then the worker:

```sh
fly deploy -c fly.picturesk-api.toml
fly deploy -c fly.picturesk-web.toml
fly deploy -c fly.picturesk-worker.toml
```

(Each is just `fly deploy -c fly.<svc>.toml` from the repo root.)

## 5. Post-deploy wiring

1. **Stripe webhook.** In the Stripe dashboard, add an endpoint at
   `https://picturesk-api.fly.dev/webhooks/stripe` for the
   `checkout.session.completed` event, copy its signing secret, and set it:
   `fly secrets set -a picturesk-api STRIPE_WEBHOOK_SECRET="whsec_..."`.
2. **R2 CORS.** The browser uploads photos to R2 via presigned PUT, so the bucket
   must allow `PUT` from the web origin. Add `https://picturesk-web.fly.dev` (and
   any custom domain) to the bucket's CORS `AllowedOrigins`, with `PUT` allowed.
3. **Public read on R2.** The face gate + delivery email fetch the uploaded and
   generated images by URL, so the bucket must be publicly readable at
   `R2_PUBLIC_BASE_URL` (r2.dev or a custom domain).
4. **Custom domains (optional).** `fly certs add <domain> -a picturesk-web`, then
   update `WEB_BASE_URL` (api + worker), `NEXT_PUBLIC_API_BASE_URL` (web build
   arg), the Stripe URLs, and R2 CORS to match.

## Everyday commands

```sh
pnpm deploy:api            # redeploy after a code change
fly logs -a picturesk-worker
fly status -a picturesk-api
fly secrets list -a picturesk-api
fly ssh console -a picturesk-api
fly scale count 1 -a picturesk-worker   # exactly one worker (queue concurrency is 1)
```

## Notes

- The services load the monorepo-root `.env` in dev; in the image there is no
  `.env`, so `dotenv` is a no-op and everything reads Fly secrets from the
  environment. No code change is needed between dev and prod.
- Keep the worker at **one machine**: the queue processes one order at a time and
  the pipeline is idempotent, but running two workers wastes compute. The pipeline
  is resumable, so a deploy/restart safely reattaches to in-flight Replicate work.
- The API and web keep `min_machines_running = 1` so the Stripe webhook and the
  results-polling page are always reachable.
