# Travel Suite — Multi-Brand Travel Monorepo

Six travel brands, each a separate business, built from shared code. Every brand
ships as two apps: a Next.js frontend and an Express 5 + Mongoose / MongoDB
backend. All the real logic lives in `packages/` and is composed per brand.

| Brand | What it sells |
|---|---|
| `airportrides` | Airport transfers |
| `dt365` | Dummy / verifiable flight tickets |
| `emirateslimo` | Limo and chauffeur bookings |
| `mdt` | Dummy tickets and travel documents |
| `travl` | AXA travel insurance, plus travel itineraries |
| `visawadi` | Visa application assistance |

`travelshield` was discontinued in August 2026 and its apps deleted. Dead
references remain in `packages/shared/config` and a couple of domains; ignore
them and don't build against them.

Everything is ESM (`"type": "module"`), Node 22, React 19, Tailwind v4.

> Working on this with an AI agent? Read `CLAUDE.md` — it carries the
> conventions and the rules that matter, and each app has its own scoped one.

## Layout

```
/
├── apps/
│   └── <brand>-frontend / <brand>-backend    # thin shells over packages/
├── packages/
│   ├── domains/          # one self-contained package per business domain
│   │   ├── auth, admin-users, users
│   │   ├── blog, currencies, payments, tickets
│   │   ├── insurance, itineraries                      (travl)
│   │   ├── visa, visa-leads, visa-applications,
│   │   │   visa-requirements                           (visawadi)
│   │   ├── bookings, limo-bookings, vehicles,
│   │   │   zones, pricing-rules, availability-rules    (transfers)
│   │   ├── flights, locations                          (flight search)
│   │   └── affiliates
│   ├── integrations/     # thin clients: airlabs, brevo, cloudinary,
│   │                     #   paypal, serpapi, transferz, wis
│   ├── shared/           # config (brand resolution), notifications, utils
│   └── frontend-shared/  # React components, hooks, contexts, services, pages
├── docs/                 # system maps and the audit archive
├── fly.<brand>-<tier>.toml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Not every brand mounts every domain. The set is chosen per brand in
`apps/<brand>-backend/src/routes/index.js`, which is the map when you need to
know what a given backend actually exposes.

## Prerequisites

- Node 22 (`nvm use`)
- pnpm 9 — pinned via the `packageManager` field

## Install

```bash
pnpm install
```

## Development

The normal loop is one app at a time:

```bash
pnpm turbo dev --filter=visawadi-frontend        # one app
pnpm turbo dev --filter=travl-backend...         # app + its workspace deps in watch
pnpm turbo build --filter=mdt-frontend
```

Backends run on Node's built-in watcher and env-file loader — no nodemon, no
dotenv:

```bash
# from apps/<brand>-backend
pnpm dev      # node --env-file=.env.development --watch src/server.js
pnpm start    # node --env-file=.env.production src/server.js

node --env-file=.env.development scripts/seed-admin.js
```

Only one backend at a time. They share port 3001, and two running together will
bind different IP stacks and answer each other's requests, which is a confusing
way to lose an hour.

## Adding a dependency

```bash
pnpm add <pkg> --filter=<workspace-name>
```

## Brand configuration

Brand identity — name, theme colours, feature flags — resolves from a single env
var: `BRAND` on backends, `NEXT_PUBLIC_BRAND` on Next.js. `getBrand(key)` reads
`packages/shared/config/src/brands/<brand>.js` and **validates at module load**,
so a misconfigured brand fails at startup rather than at request time.

Frontends also keep a thin local `src/config.js` reading `NEXT_PUBLIC_*` vars
(backend URL, GA4, TinyMCE).

## Testing

There isn't a test suite. `turbo test` is wired but no test files exist. Don't
claim tests pass. Linting exists on frontends only (`next lint`); shared
packages have no build step and are consumed as raw source through subpath
exports.

## Deployment

Fly.io, one config per app at the repo root:

```bash
flyctl deploy -c fly.visawadi-backend.toml --remote-only
```

Secrets live only in Fly secrets. Never commit one, never echo an `.env` file,
and never put a Mongo URI or an `sk_` / `whsec_` key in a `fly.*.toml`.
