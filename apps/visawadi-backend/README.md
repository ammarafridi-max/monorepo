# visawadi-backend

Express 5 + Mongoose API for **VisaWadi**, a visa-only brand serving UAE residents. Part of the `travel-suite` monorepo: the business logic lives in `packages/domains/*` and is composed here.

VisaWadi handles visa applications and nothing else. It does not sell travel insurance, travel itineraries, dummy flight tickets or hotel reservations.

## Running it

Node 22, pnpm 9. From the repo root:

```bash
pnpm install
pnpm turbo dev --filter=visawadi-backend
```

Or from this directory:

```bash
pnpm dev      # node --env-file=.env.development --watch src/server.js
pnpm start    # node --env-file=.env.production src/server.js
```

There is no test suite in this repo yet.

## Scripts

```bash
node --env-file=.env.development scripts/seed-admin.js              # create the first admin user
node --env-file=.env.development src/scripts/seedVisas.js           # seed visa landing pages
node --env-file=.env.development scripts/seed-schengen-checklist.mjs # seed the Schengen document checklist
node --env-file=.env.development scripts/verify/verify-reminders.mjs # dry-run the reminder sweep
```

## API surface

Everything is mounted under `/api`.

| Route | Purpose |
|---|---|
| `/auth` | Admin authentication |
| `/admin-users` | Admin user management |
| `/users` | Customer accounts, magic-link sign-in |
| `/visas` | Visa landing pages (public reads, admin writes) |
| `/visa-leads` | Consultation enquiries from the public site |
| `/visa-applications` | The application system: applicants, documents, checklists, reminders |
| `/blogs`, `/blog-tags` | Blog content, AI-assisted authoring |
| `/currencies` | Currency reference data |
| `/payments` | Admin-created Stripe payment links |

`GET /health` returns `{ status: "ok", brand: "visawadi" }`.

## Architecture notes

**Domains are factories.** Nothing imports a database connection or config directly; each domain receives `db`, `auth`, `storage` and friends as arguments. `src/routes/index.js` is the composition root and the best map of the app.

**The Stripe webhook is mounted in `src/app.js` before `express.json()`** because signature verification needs the raw body. Don't move it behind the JSON parser. Handlers must be idempotent — Stripe retries and resends events.

**Customer documents are private.** Passports and bank statements upload to an authenticated Cloudinary space (`visawadi/visa-applications`) and are served through signed, short-lived URLs, never public ones.

**Model and collection names are kebab-case** (`visa-application`, `visa-lead`, `document-type`). A model name change moves the underlying collection, so it needs a data migration alongside it.

## Environment

Configuration is read in `src/utils/config.js` from these variables:

`NODE_ENV`, `PORT`, `MONGO_URI`, `CORS_ORIGINS`, `FRONTEND_URL`, `BACKEND_URL`, `SITE_URL`, `ADMIN_EMAIL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_COOKIE_EXPIRES_IN`, `USER_JWT_SECRET`, `USER_JWT_EXPIRES_IN`, `USER_COOKIE_EXPIRES_IN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `BREVO_API_KEY`, `ANTHROPIC_API_KEY`, `ENABLE_REMINDER_CRON`, `GMAIL_*`.

Secrets live only in Fly.io secrets. Never commit them or write them into a `fly.*.toml`.

## Deployment

Fly.io, from the repo root:

```bash
flyctl deploy -c fly.visawadi-backend.toml
```

The config builds `apps/visawadi-backend/Dockerfile` with a repo-root build context, runs on port 3001 in `fra`, and keeps one machine warm so the reminder sweep always has somewhere to run.

`ENABLE_REMINDER_CRON` is not set in the toml on purpose. Set it as a secret on exactly one machine, or the daily 09:00 Asia/Dubai sweep will fan out and send duplicate reminders.
