# Migration: emirateslimo-nextjs → monorepo

Moving `emirateslimo/Website/emirateslimo-nextjs` into
`monorepo/apps/emirateslimo-frontend` as a Next.js app deployed as a **standalone Node
server on Fly**. The app is split:

- **Marketing + booking site** → **self-contained lift-and-shift** (bespoke limo UI stays local).
- **Admin** (`/admin`) → **hybrid on `@travel-suite/frontend-shared`**: reuse the shared admin
  shell + existing resource pages, and author the missing limo-specific admin pages **into
  `frontend-shared`**, then mount them via thin app routes.

- **Scope:** frontend only. Backend already migrated + deployed (one small change needed, see §6).
- **Status:** planning complete; implementation not started.

## Production domains
| Surface | URL |
|---|---|
| Backend API | `api.emirateslimo.com` |
| Marketing/booking site | `www.emirateslimo.com` |
| Admin dashboard | `www.emirateslimo.com/admin` (same Next app, `/admin` routes) |

---

## 1. Source vs. monorepo conventions

| | Source (`emirateslimo-nextjs`) | Monorepo frontends |
|---|---|---|
| Framework | Next 16.2.1, React 19.2.4, App Router | Next latest, React 19.2.5 (pnpm override), App Router |
| Layout root | top-level `app/` | `src/app/` |
| Path alias | `@/*` → `./*` | `@/*` → `./src/*` |
| Render mode | `output: 'export'` (static) | `output: 'standalone'` |
| Admin UI | bespoke local `app/admin/*` | shared `@travel-suite/frontend-shared` admin |
| Shared deps | none | `frontend-shared`, `config`, `utils` (`workspace:*`) |
| pkg name | `emirateslimo-nextjs` | bare `airportrides-frontend` (frontends unscoped) |
| Deploy | static export | Fly standalone, port 3000, `.env.build` bakes `NEXT_PUBLIC_*` |

---

## 2. Current scaffold state (throwaway)
`apps/emirateslimo-frontend` is a broken airportrides clone — **no `src/`**, name still
`airportrides-frontend`, Dockerfile hardcoded to airportrides, `.env.development` brand still
`airportrides`. Already in `pnpm-lock.yaml`; no `fly.emirateslimo-frontend.toml`. Overwrite all.

---

## 3. What stays local vs. consumed

**Local (lift-and-shift):** `app/(main)` (~20 limo marketing pages), `app/(booking)` (booking
flow), the components/hooks/services/context/lib/data/utils those use (Hero, Fleet, LimoForm,
VehicleCard, BookingSummary, Navigation, Footer, FormElements, HomeComponents, Currency/Booking/
Auth contexts, analytics/schema libs, etc.), `public/`, `globals.css`, `config.js`.

**Consumed from monorepo:** `@travel-suite/frontend-shared` (admin shell + admin pages),
`@travel-suite/config` (brand), `@travel-suite/utils`. → `transpilePackages` must include
`@travel-suite/frontend-shared`.

**NOT lifted from source:** `app/admin/*`, `AdminNavigation`, `AdminLayoutClient`, and the
admin-only hooks/services — these are **replaced by the shared admin**. The source admin (incl.
its `VehicleForm`, `ZoneForm` mapbox editor, `PricingForm`, `AvailabilityForm`, and
`services/api{Vehicles,Zones,PricingRule,AvailabilityRules}`, `hooks/*`) is the **spec** for the
new shared admin pages.

**Heavy deps that move with the app (marketing/booking):** Google Maps libs (`@react-google-maps/api`,
`@vis.gl/react-google-maps`, `@googlemaps/places`), `@tanstack/react-query`, `react-hook-form`,
`framer-motion`, `swiper`, GA4/GTM, `date-fns`, `universal-cookie`, fontsource fonts.

---

## 4. Admin (hybrid) detail

### Reuse from `frontend-shared` (already exist; endpoints/shapes match because emirateslimo
backend uses the same shared domain packages)
- Shell: `pages/admin/AdminDashboardLayout` (AdminShell + Sidebar + AdminAuthProvider).
- Auth: `AdminLoginPage` (`POST /api/auth/login`); auth context hits `/api/admin-users/me`.
- Resource pages: **blogs, blog-tags, currencies, admin-users (users), account**.

### Build NEW in `frontend-shared` (limo-specific — confirmed: all 5)
`vehicles`, `zones`, `pricing-rules`, `availability-rules`, `bookings`. For each, follow the
shared add-a-resource template:
```
packages/frontend-shared/src/
  services/api<Resource>.js          # apiFetch/apiUpload → /api/<resource>
  hooks/<resource>/use{Get,GetOne,Create,Update,Delete}<Resource>.js   # react-query
  pages/admin/Admin<Resource>Page.js (+ Form / Modal / DetailPage as needed)
```
Exports are already covered by the wildcard `exports` map (`./pages/admin/*`, `./hooks/*/*`,
`./services/*`) — no package.json change needed.

Per-resource UI to replicate from source:
- **vehicles** — 3 tabs (info / pricing / images); selects type∈[Sedan,Crossover,SUV,Van],
  fuel, class; 8 hourly-rate tiers + initialPrice + pricePerKm; featured image + gallery via
  `apiUpload` (multipart); duplicate; delete-image (`DELETE /api/vehicles/:id/images`).
- **zones** — `mapbox-gl` + `@mapbox/mapbox-gl-draw` polygon editor (Dubai default center),
  GeoJSON Polygon/MultiPolygon, name; duplicate. → adds mapbox deps to `frontend-shared`.
- **pricing-rules** — multi-select pickupZones[], dropoffZones[], vehicles[]; oneWay/return;
  list filters by vehicle/zone/name; auto-generated name from backend.
- **availability-rules** — multi-select zones; per-vehicle Available/Unavailable toggle →
  `vehicles: [{ vehicle, available }]`; isActive.
- **bookings** — list + detail + calendar; limo shape (bookingRef, trip, orderSummary,
  payment.status, handledBy).

**Response-shape note:** the new shared services must match emirateslimo backend envelopes —
most are `{status,data}`, but `zones` GET-one returns `{status,data:{zone}}` (unwrap), and list
endpoints include `results`/`page`. `apiFetch` returns `json.data`.

### App wiring (in `apps/emirateslimo-frontend`)
- `src/app/admin/(dashboard)/layout.js` → `AdminDashboardLayout` with a limo `nav` (Dashboard,
  Bookings, Fleet→Vehicles/Zones/Pricing Rules/Availability Rules, Content→Blogs/Blog Tags,
  Settings→Currencies/Users/Account) + brand `{ name: 'Emirates Limo', icon }`.
- `src/app/admin/(dashboard)/<resource>/page.js` (+ `[id]`) → `export { default } from
  '@travel-suite/frontend-shared/pages/admin/Admin<Resource>Page'`.
- `src/app/admin/login/page.js` → shared `AdminLoginPage`.

---

## 5. Phased plan (with gates)

### Guardrails
- Source stays untouched (rollback). Copy code only (no `node_modules`/`.next`/`out`/lockfile/`.git`).
- `NEXT_PUBLIC_*` are build-time baked → `.env.build`.

### Phase 1 — Reset scaffold + manifest/config  ✅ COMPLETE
- `package.json` — name `emirateslimo-frontend` (unscoped); source deps + `@travel-suite/{frontend-shared,
  config,utils}` (`workspace:*`); Next pinned `16.2.1`, react/react-dom `19.2.4` (root override → 19.2.5);
  `react-query-devtools` pinned `5.99.2` to match deduped react-query (cleared a peer warning);
  `type:module`; `engines.node 22.x`.
- `next.config.mjs` — `output:'standalone'`, `outputFileTracingRoot:'../../'`,
  `transpilePackages:['@travel-suite/frontend-shared','mapbox-gl']`, `images.unoptimized:true`.
- `jsconfig.json` (`@/*`→`./src/*`) + `postcss.config.mjs` (Tailwind v4) — scaffold already correct, kept.
- `README.md` rewritten. eslint config deferred to Phase 2 (ported with the source copy).
**Gate:** ✅ `pnpm install` resolves cleanly (no peer warnings); app registered in workspace.

### Phase 2 — Lift-and-shift marketing/booking  ✅ COMPLETE
- Copied source `app/` (minus `app/admin/`), `components/ hooks/ services/ context/ lib/ data/
  utils/ config.js globals.css` → `src/`; `public/` → app root; `eslint.config.mjs` → app root.
- Dropped `app/admin/*` and `layouts/AdminLayoutClient.js` (admin replaced by shared in Phase 3).
- Admin-only files still present in `src/{components,hooks,services}` (e.g. AdminNavigation,
  hooks/vehicles, services/apiVehicles…) are **dead code** — not imported by any route, so Next
  doesn't compile them. They double as the spec for Phase 3, then get pruned.
**Gate:** ✅ `next build` (Next 16.2.1 / Turbopack) compiled clean — TypeScript passed, **30
marketing/booking routes** prerendered (incl. `blog/[slug]` SSG), zero admin routes, no
unresolved imports.

### Phase 3 — Shared admin (the hybrid core)  ✅ COMPLETE (code) / interactive CRUD pending admin account
- Authored 5 new resource sets in `packages/frontend-shared` (52 files: service + hooks + list/
  new/edit pages + form per resource): **vehicles** (3-section form, Cloudinary image upload),
  **zones** (mapbox-gl-draw polygon editor), **pricing-rules**, **availability-rules**,
  **limo-bookings** (list/detail/calendar — named `apiLimoBookings`/`limo-bookings`/
  `AdminLimoBooking*` to avoid clobbering the existing shared `apiBookings`). Added `mapbox-gl` +
  `@mapbox/mapbox-gl-draw` to frontend-shared deps. Extended `AdminSidebar` ICON_MAP (additive:
  Car, MapPin, SlidersHorizontal, CalendarDays).
- App wiring: `src/app/admin/(dashboard)/layout.js` (limo nav + brand), `login`, `not-found`,
  `(dashboard)/page.js`, and 21 thin route re-exports for reused (blog/blog-tags/currencies/
  users/account) + new resources.
- `@travel-suite/config`: added + registered the `emirateslimo` brand.
- App `globals.css`: added `@source` directives so Tailwind generates the shared admin classes;
  kept the marketing palette intact (so admin currently renders with the marketing's grayscale
  `primary-*`, not teal — cosmetic, themeable later).
- **Backend:** moved admin-users `/api/users` → `/api/admin-users` and **redeployed** (live).
- **Gate:** ✅ `next build` compiles all admin + marketing routes; ✅ runtime smoke — server boots,
  `/`, `/fleet`, `/admin/login`, `/admin/vehicles`, `/admin/zones` all serve 200 (admin pages
  serve the auth shell, client-redirect to login when unauthenticated).
- **Pending (needs your admin account + real browser):** interactive login → CRUD on each
  resource (incl. drawing a zone with a real `NEXT_PUBLIC_MAPBOX_TOKEN`). Subagent-authored pages
  are faithful to the source but not yet exercised against live data.

Follow-ups noted:
- Admin primary color is grayscale (marketing palette) — re-theme if a teal admin is wanted.
- `AdminShell` (shared) `ROLE_DEFAULT_PATH.agent`/`blog-manager` point at other brands' routes
  (e.g. `/admin/dummy-tickets`) — only matters if a non-admin role hits an admin-only route;
  emirateslimo should use `admin`-role accounts (or we extend the shared shell later).

### Phase 4 — Dependency & version alignment  ✅ COMPLETE
- Verified: no stray `package-lock.json`/`yarn.lock`; react/react-dom resolve to **19.2.5** (root
  override), Next **16.2.1**.
- Dedup: removed **3 unused** deps (`@react-google-maps/api`, `@vis.gl/react-google-maps`,
  `@googlemaps/places` — 0 imports in src; location search goes via the backend). Pruned ~81
  transitive packages (lockfile 799 → 718). Kept `react-toastify` (3 files) + `react-hot-toast`
  (41 files) — both used; kept mapbox (needed for the app's `transpilePackages` resolution).
- **Gate:** ✅ `pnpm install --frozen-lockfile` clean (Docker-ready); ✅ rebuild compiles (48 routes).

### Phase 5 — Build & run
`pnpm --filter emirateslimo-frontend build` (standalone) + `dev`; smoke test marketing pages,
booking flow, `/admin/login` → dashboard → each resource. **Gate:** prod build succeeds; key
pages render; admin CRUD works end-to-end.

### Phase 6 — Infra  ✅ COMPLETE (code) / image build runs at deploy
- `apps/emirateslimo-frontend/Dockerfile` — multi-stage standalone (deps → builder → runner),
  COPYs config/utils/frontend-shared + app package.json, `pnpm install --frozen-lockfile`,
  `cp .env.build .env.production`, `pnpm --filter emirateslimo-frontend build`, copies
  `.next/static` + `public` into the standalone output, runs `node
  apps/emirateslimo-frontend/server.js`. Port 3000.
- `fly.emirateslimo-frontend.toml` (root) — app `emirateslimo-frontend`, region `fra`, port 3000,
  512mb shared-cpu-1x.
- `.env.build` — prod `NEXT_PUBLIC_*` (backend `https://api.emirateslimo.com`, brand emirateslimo,
  google maps, mapbox, GTM, GA4, tinymce). Allow-listed in `.dockerignore` + app `.gitignore`.
- **Gate:** ✅ all Dockerfile COPY paths + `.env.build` present; ✅ frozen-lockfile clean (deps
  stage) and `next build` passes (builder stage). Local `docker build` not run (daemon down) —
  the image builds on Fly's remote builder at Phase 7, same as the backend.

### Phase 7 — Deploy & verify  ✅ DEPLOYED / DNS + interactive admin pending
- Created Fly app `emirateslimo-frontend` (org personal, region fra). No Fly secrets needed —
  all `NEXT_PUBLIC_*` are baked at build via `.env.build`.
- `flyctl deploy -c fly.emirateslimo-frontend.toml --remote-only` — remote build succeeded
  (75 MB standalone image; this validated the Dockerfile, daemon being down notwithstanding).
  2 machines in fra.
- Live at **https://emirateslimo-frontend.fly.dev** — verified `/`, `/fleet`,
  `/chauffeur-service`, `/admin/login`, `/admin/vehicles` all serve 200 (admin = auth shell).

**Custom domains — DONE & verified:**
- DNS A/AAAA added: `api` → backend IPs (66.241.125.33), `www` → frontend IPs (66.241.125.74).
- `fly certs add` for both → Let's Encrypt certs **Issued & active**.
- Verified live: `https://api.emirateslimo.com/health` 200, `/api/currencies` 200;
  `https://www.emirateslimo.com/`, `/fleet`, `/admin/login` 200.
- **CORS verified:** backend returns `Access-Control-Allow-Origin: https://www.emirateslimo.com`
  + `Allow-Credentials: true` → authenticated www→api calls work.

**Remaining (user-owned):**
- Interactive admin verification: log in with an **admin**-role account (the schema defaults new
  accounts to `agent`, which hides admin-only sidebar items) → CRUD each resource, draw a zone.
- Stripe webhook → point the Stripe dashboard at `https://api.emirateslimo.com/api/webhook`.
- (Optional) add `admin.emirateslimo.com` if a separate admin host is wanted; today admin lives
  at `www.emirateslimo.com/admin`.

## STATUS: migration COMPLETE — backend + frontend live on custom domains.

---

## 6. Cross-cutting / decisions
- **Backend admin-users route (decided):** move `/api/users` → `/api/admin-users` + redeploy
  (matches shared admin + sibling backends; no public user routes exist so nothing else breaks).
- **CORS:** add the new frontend origin to backend `CORS_ORIGINS` (currently
  `www`/`admin.emirateslimo.com`) — use the real `www.emirateslimo.com` domain, or add the
  `*.fly.dev` origin during testing.
- **`NEXT_PUBLIC_BACKEND_URL`:** point at `https://api.emirateslimo.com` (custom domain on the
  backend Fly app) or `https://emirateslimo-backend.fly.dev` until DNS is set.
- **Custom domains:** map `www.emirateslimo.com` → frontend Fly app, `api.emirateslimo.com` →
  backend Fly app (+ TLS certs).
- **mapbox in `frontend-shared`:** only imported by the zones admin page (route-level), so other
  brands don't pay the bundle cost unless they route to it — acceptable.
- **Domain hardcoding:** `metadataBase`/`sitemap`/`robots` hardcode `www.emirateslimo.com`
  (correct) — optionally move to `NEXT_PUBLIC_SITE_URL`.
- **Images:** `unoptimized:true` (no `sharp`); revisit with cloudinary `remotePatterns` later.
- **Optional cleanup:** dedupe toast/maps libraries.

## 7. Out of scope
- Refactoring the **marketing/booking** UI into `frontend-shared` (only admin is shared).
- Static-export deploy (replaced by Fly standalone).
