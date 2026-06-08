# emirateslimo-frontend

User-facing Next.js app for **emirateslimo.com** — a Dubai luxury limo / chauffeur booking
platform. Serves the marketing site, the booking flow, and the admin dashboard (`/admin`).

- **Marketing + booking**: bespoke UI, local to this app.
- **Admin** (`/admin`): built on `@travel-suite/frontend-shared` (shared admin shell + pages),
  with limo-specific resource pages (vehicles, zones, pricing-rules, availability-rules,
  bookings) authored in `frontend-shared`.

## Run locally

```bash
# from the monorepo root
pnpm install
pnpm --filter emirateslimo-frontend dev
```

Defaults to http://localhost:3000.

## Env vars (`NEXT_PUBLIC_*`, baked at build time)

| Var | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | yes | emirateslimo-backend base URL (`https://api.emirateslimo.com`) |
| `NEXT_PUBLIC_BRAND` | yes | brand key for `@travel-suite/config` (`emirateslimo`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | yes | admin zone-drawing map |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | no | GA4 |
| `NEXT_PUBLIC_TINYMCE_API_KEY` | no | blog editor |

## Deploy

Multi-stage Dockerfile builds an `output: standalone` image (port 3000). Fly config at the
monorepo root: `fly.emirateslimo-frontend.toml`.
