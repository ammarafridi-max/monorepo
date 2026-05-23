# airportrides-frontend

User-facing Next.js app for airportrides.com — a global airport transfer booking platform.

## Run locally

```bash
# from the monorepo root
pnpm install
pnpm --filter airportrides-frontend dev
```

Defaults to http://localhost:3000 (auto-bumps if the port is taken).

## Env vars

Copy `.env.example` to `.env.development` (or `.env.local`) and fill in:

| Var | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | yes | airportrides-backend base URL |
| `NEXT_PUBLIC_SITE_URL` | yes | public site URL (metadata, sitemap, robots) |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | no | GA4 init — blank to skip in dev |
| `NEXT_PUBLIC_META_PIXEL_ID` | no | Meta Pixel — only for paid social |
| `NEXT_PUBLIC_BRAND` | yes | brand key for `@travel-suite/config` (`airportrides`) |

## Deploy

Dockerfile builds a `next start` standalone image suitable for Fly. Fly TOML config is managed at the monorepo root (TBD).
