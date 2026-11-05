# Travel Suite — Multi-Brand Travel Monorepo

Seven travel brands, each a separate business, built from shared code. Every
brand ships as two apps: a Next.js frontend and an Express 5 + Mongoose /
MongoDB backend. All the real logic lives in `packages/` and is composed per
brand.

| Brand | What it sells |
|---|---|
| `airportrides` | Airport transfers |
| `dt365` | Dummy / verifiable flight tickets, plus hotel bookings |
| `emirateslimo` | Limo and chauffeur bookings |
| `mdt` | Dummy tickets and travel documents |
| `thedt` | Dummy tickets and travel documents |
| `travl` | AXA travel insurance, plus travel itineraries |
| `visawadi` | Visa application assistance |

`travelshield` was discontinued in August 2026 and its apps deleted. Its brand
config and registry entry are gone too; the only mentions left are in dated
files under `docs/audits/`.

**Picturesk is in this repo but is not a travel brand.** It is an AI headshot
generator with its own Mongo database, its own brand identity
(`docs/picturesk/BRAND.md`) and its own docs tree under `docs/picturesk/`. It
is three workspaces (`apps/picturesk-frontend`, `apps/picturesk-backend`,
`packages/picturesk-shared`) and three Fly apps (`picturesk-web`,
`picturesk-api`, `picturesk-worker`). It does not use `@travel-suite/config`,
its customer site is plain CSS rather than Tailwind, and it is the only thing
here with a queue worker (Redis + BullMQ), R2 storage and Sentry. Don't pull it
into the brand machinery or let its dependencies leak into the travel packages.

Everything is ESM (`"type": "module"`), Node 22, React 19, Tailwind v4.

> Working on this with an AI agent? Read `CLAUDE.md` — it carries the
> conventions and the rules that matter. Six apps also have a scoped one of
> their own: `travl-frontend`, `travl-backend`, `visawadi-frontend`,
> `visawadi-backend`, `picturesk-frontend` and `picturesk-backend`. The other
> ten apps have none, so the root file is all there is for them.

## Layout

```
/
├── apps/
│   ├── <brand>-frontend / <brand>-backend    # thin shells over packages/
│   └── picturesk-frontend / picturesk-backend    # not a travel brand
├── automations/          # every scheduled job, one workspace, one CLI
├── packages/
│   ├── domains/          # one self-contained package per business domain (26)
│   │   ├── auth, admin-users, users
│   │   ├── blog, currencies, payments, assistant
│   │   ├── tickets, pricing-rules, affiliates, openai-ads
│   │   ├── insurance, itineraries                      (travl, mdt, thedt)
│   │   ├── visa, visa-leads, visa-applications,
│   │   │   visa-requirements                           (visawadi)
│   │   ├── transfer-bookings, limo-bookings, vehicles,
│   │   │   zones, availability-rules                   (transfers, limos)
│   │   ├── hotel-bookings, conversations               (dt365)
│   │   └── flights, locations                          (flight search)
│   ├── integrations/     # 12 thin clients: airlabs, brevo, cloudinary,
│   │                     #   google-ads-conversions, meta-capi, openai-ads,
│   │                     #   openai-capi, paypal, serpapi, transferz,
│   │                     #   whatsapp, wis
│   ├── shared/           # backend-app (the shared Express app + bootstrap),
│   │                     #   config (brand resolution), notifications, utils
│   ├── frontend-shared/  # React components, hooks, contexts, services, pages,
│   │                     #   and src/seo/ (root metadata, robots, sitemap, schema)
│   └── picturesk-shared/
├── tools/face-embed/     # the Cog source for Picturesk's face-embed model
├── docs/                 # Picturesk docs, feature write-ups, audit archive
├── fly.<brand>-<tier>.toml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Workspaces are `apps/*`, `automations`, `packages/*`, `packages/domains/*`,
`packages/integrations/*` and `packages/shared/*` (`pnpm-workspace.yaml`).

Not every brand mounts every domain, and the sets differ a lot. The set is
chosen per brand in `apps/<brand>-backend/src/routes/index.js`, which is the
map when you need to know what a given backend actually exposes. Read it rather
than assuming from another brand.

## Scheduled jobs

Every cron lives in `automations/`: blog generation per brand, the blog backlog
scheduler, the Emirates Limo pricing sync. One entrypoint
(`node src/cli.mjs <job> [--target <key>]`), one reusable GitHub workflow with
thin per-job callers, and a config schema that validates every target at load.
Every job supports `--dry-run`, and a dry run needs no credentials, so CI can
exercise it on a pull request. Add a job there rather than dropping a script at
the repo root or under an app. See `automations/README.md`.

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
```

There is no seed-admin script in any backend any more. The first admin is
created directly against the database.

Only one backend at a time. They share port 3001, and two running together will
bind different IP stacks and answer each other's requests, which is a confusing
way to lose an hour.

## Adding a dependency

```bash
pnpm add <pkg> --filter=<workspace-name>
```

## Brand configuration

Brand identity (name, domain, currency, timezone, emails, theme colours, SEO
defaults, legal details) resolves from a single env var: `BRAND` on backends,
`NEXT_PUBLIC_BRAND` on Next.js. `getBrand(key)` reads
`packages/shared/config/src/brands/<brand>.js` and **validates at module load**,
so a misconfigured brand fails at startup rather than at request time.

There is no `features` block. The flags were removed once nothing turned out to
read them; a brand's product surface is what its backend mounts and what its
frontend routes. Don't add flags back to gate a feature.

Some frontends also keep a thin local `src/config.js` reading `NEXT_PUBLIC_*`
vars (backend URL, GA4, TinyMCE): airportrides, mdt and thedt do. The rest
read the env directly or use a `src/config/` directory, so don't assume one
exists.

## Testing

```bash
pnpm test        # turbo run test; 294 tests, all passing
```

Six workspaces have suites, all `node --test`, none needing a database or
network: `apps/picturesk-backend` (86), `packages/domains/assistant` (70),
`packages/domains/tickets` (79), `packages/domains/openai-ads` (23),
`packages/integrations/google-ads-conversions` (11) and
`packages/shared/utils` (25). Everything else has none, the travel apps
included, so don't claim tests pass for code they don't cover.

Linting exists on frontends only, as a bare `"lint": "eslint"` against a flat
`eslint.config.mjs` per app (`picturesk-frontend` has none). `frontend-shared`
lints too; the other shared packages have no lint or build step and are
consumed as raw source through subpath exports.

## Deployment

Fly.io, one config per app at the repo root:

```bash
flyctl deploy -c fly.visawadi-backend.toml --remote-only
```

Secrets live only in Fly secrets. Never commit one, never echo an `.env` file,
and never put a Mongo URI or an `sk_` / `whsec_` key in a `fly.*.toml`.
