# VisaWadi — UI/UX, Branding, Architecture and SEO Discovery

**Date:** 4 November 2026
**Scope:** `apps/visawadi-frontend`, `apps/visawadi-backend`, and the shared packages they consume.
**Status:** research only. No source file was modified, no package installed, no server started.

## How this was produced

| Method | Detail |
|---|---|
| Static analysis | Full read of `apps/visawadi-frontend/src` (74 files, ~4,300 lines), the shared components it imports from `packages/frontend-shared`, and the backend composition root plus the `visa`, `visa-leads`, `visa-requirements` domain schemas. |
| Live browser | **YES.** Headless Chrome over CDP against production `https://www.visawadi.com`. Pages rendered and measured at 390×844 (mobile, touch), 768×1024 (tablet) and 1440×900 (desktop). DOM queried for heading outline, tap-target sizes, overflow, computed styles, JSON-LD and image attributes. |
| Live HTTP | `curl` against production for redirects, `robots.txt` and `sitemap.xml`. |
| **Not available** | Google Search Console, GA4, Clarity, Core Web Vitals field data, Lighthouse runs, keyword rankings, indexing status. Nothing of that kind is reported or estimated below. |

Two conventions used throughout:

- **FACT** — read in the repo or observed in the rendered page.
- **RECOMMENDATION** / **RISK** — judgement, clearly separated from fact.

> **Important caveat on the working tree.** The repository has uncommitted changes to seven files that are directly in VisaWadi's redesign path: `src/components/app/PackageSegments.js`, `src/components/app/VisaDetailAppPage.js`, and the shared `sections/v1/VisaHero.js`, `VisaPricingBreakdown.js`, `VisaQualifiers.js`, `VisaSectionHead.js`, `sections/v2/Navbar.js`. **This report describes the working tree.** Production (what the browser pass measured) is one commit behind on these files. The most visible divergence: `VisaQualifiers` is commented out in the working-tree `VisaDetailAppPage` but still renders live. Resolve that diff before design work starts.

---

## 1. Executive summary

VisaWadi is a Next.js 16 App Router site in a pnpm + Turborepo monorepo, written in **JavaScript (not TypeScript)**, styled with **Tailwind CSS v4** using a CSS-first `@theme` token block, and deployed to Fly.io as a standalone Node server. It is one of seven travel brands sharing a single component library, `@travel-suite/frontend-shared`, consumed as raw source through versioned subpath exports.

The site is small and coherent in structure: **13 public page templates** producing **152 indexed URLs**, of which 83 are blog posts and 35 are programmatic visa-checker pages. The commercial core is just three templates — the homepage, the `/uae` listing and the `/uae/visa/[slug]` detail page — and the detail page is already composed from a VisaWadi-only component set that no other brand imports. **That makes the redesign unusually low-risk on the commercial side and unusually high-risk on the blog side**, for one specific reason explained below.

Four findings should shape the plan:

1. **The commercial surface is already isolated.** `VisaDetailAppPage`, `PackageSegments`, `StickyPriceBar`, `MobileTabBar`, `VisaCard`, `VisaCheckerInline`, `LeadFormModal` and all eleven `sections/v1/Visa*` components are imported by VisaWadi and nothing else. They can be rewritten freely.
2. **The chrome is not isolated.** `Navbar`, `Footer`, `Hero`, `About`, `Benefits`, `HowItWorks`, `Faqs`, `BlogPosts`, `FaqAccordion` and `PageHero` are shared with `travl-frontend` (and `PageHero` additionally with dt365, mdt, thedt). Changing them in place breaks other brands.
3. **The blog cannot be isolated by component boundaries, only by token discipline.** Blog article typography lives in a 200-line `.blog_post` block inside `apps/visawadi-frontend/src/app/globals.css`, and it references `--color-primary-*` for links, table borders, blockquote rules and header tints. Any change to the primary ramp changes the blog, even though no blog component is touched. This is the single most important constraint in the project.
4. **There is no tablet tier.** Every responsive switch in the app happens at Tailwind's `lg` (1024px). At 768px the site serves the phone layout wholesale: phone nav, bottom tab bar, tabbed package selector. A "mobile-app-inspired" redesign should decide deliberately whether that stays.

Technically the codebase is in good shape for a redesign: server components by default, ISR everywhere, metadata and JSON-LD built through shared helpers rather than hand-written per page, no CSS-in-JS, no component library to fight. The weaknesses are a fragmented type scale (arbitrary pixel values rather than tokens), an unlayered global `*` font rule that already required one documented workaround, a `Container` with no maximum width, and a non-sticky header that overlaps page content by 24px on desktop.

---

## 2. Technology stack

### 2.1 Core

| Concern | Technology | Version | Source |
|---|---|---|---|
| Framework | Next.js, App Router | **16.3.0** | `apps/visawadi-frontend/package.json` |
| UI runtime | React / React DOM | **19.2.5** (pinned repo-wide via `pnpm.overrides`) | root `package.json` |
| Language | JavaScript, ESM (`"type": "module"`) | — | no `.ts`/`.tsx` anywhere in the app |
| Path alias | `@/* → ./src/*` | — | `jsconfig.json` |
| Node | 22.x | — | `engines` |
| Package manager | pnpm 9.15.0 + Turborepo 2 | — | root `package.json`, `turbo.json` |

### 2.2 Styling

| Concern | Technology | Notes |
|---|---|---|
| CSS framework | **Tailwind CSS v4** via `@tailwindcss/postcss` | No `tailwind.config.js`. Configuration is CSS-first: `@theme inline { … }` inside `globals.css`. |
| Token source | `apps/visawadi-frontend/src/app/globals.css` | Single file, 317 lines, holds every brand token plus all blog-article CSS. |
| Shared-source scanning | `@source` directives | `globals.css` explicitly adds `packages/frontend-shared/src/{components,pages,layouts}` to Tailwind's content scan. **Any new shared directory must be added here or its classes will be purged.** |
| CSS-in-JS | none | — |
| Component library | **none** | No MUI, shadcn, Radix, Headless UI. Every primitive is hand-written. |

### 2.3 Libraries

| Concern | Package | Version | Notes |
|---|---|---|---|
| Icons | `lucide-react` | `^0.511.0` in the app, **`^1.6.0` in frontend-shared** | Version divergence. Both are installed and both are used at runtime. Worth reconciling before a redesign standardises iconography. |
| Icons | `react-icons` | `^5.6.0` | `hi2` and `md` sets, used in `Hero`, `BlogPostPage`, `Breadcrumb`, homepage. |
| Flags | `cdn.jsdelivr.net/gh/HatScripts/circle-flags` | — | Loaded as remote `<img>` in `Navbar`'s mega menu. **Third-party CDN dependency on the critical nav path.** |
| Server state | `@tanstack/react-query` | `^5.95.2` | One `QueryClient`, `staleTime: 300_000`. |
| Toasts | `react-hot-toast` | `^2.6.0` | — |
| Forms | `react-hook-form` | `^7.72.0` (frontend-shared) | — |
| Phone validation | `libphonenumber-js` | `^1.11.0` | — |
| Rich text (admin) | `@tinymce/tinymce-react` | `^6.3.0` | Admin blog editor only. |
| Charts (admin) | `recharts` | `^2.13.0` | Admin revenue/assistant only. |
| Maps (admin, unused here) | `mapbox-gl`, `@turf/*` | — | Pulled in by `frontend-shared` dependencies; not used by VisaWadi pages. |
| Analytics | `react-ga4` | `^3.0.1` | — |
| **Animation** | **none** | — | No Framer Motion, no GSAP, no `tailwindcss-animate`. All motion is CSS `transition-*` and one `animate-spin`. |

### 2.4 State, data, auth

- **State management:** no Redux/Zustand/Jotai. Server components fetch at render; client interactivity is `useState` plus React Context.
- **Contexts used on the public site:** `UserAuthContext` (from `contexts/AuthContextBase.js`). `Providers.js` supplies a frozen `GUEST_AUTH` object on every route **except** `/apply*`, which gets the real `UserAuthProvider`. The navbar's account menu is therefore dead code on the marketing site.
- **API pattern:** all calls go through `@travel-suite/frontend-shared/services/api*.js`, which wrap `apiFetch` / `apiFetchPublic` in `services/apiClient.js`. `apiFetchPublic` adds a server-only `x-internal-token` header, an 8-second `AbortSignal.timeout`, and unwraps `json.data`. `nullOn404` converts a 404 into `null` so pages can call `notFound()` themselves. Base URL is `NEXT_PUBLIC_BACKEND_URL`.
- **Authentication:** two separate systems, neither on the marketing pages.
  - Admin: JWT cookie, `createAuthRouter` on the backend, `AdminAuthContext` on the front end, roles `admin | agent | blog-manager | support`.
  - Customer: magic-link sessions (`createUsersRouter` → `userAuth`), used only by `/apply*`. There is **no public sign-up or login**.
- **Content management:** bespoke. Visa landing pages and blog posts are Mongo documents edited through `/admin`. No headless CMS, no MDX, no local content files.
- **Images:** `next/image` throughout, `formats: ['image/avif','image/webp']`, single remote pattern `res.cloudinary.com`. `<link rel="preconnect">` and `dns-prefetch` to Cloudinary in the root layout.
- **Hosting:** Fly.io, app `visawadi-frontend`, region `fra`, `shared-cpu-1x` / 512 MB, `min_machines_running = 1`, health check on `/robots.txt`. Built from `apps/visawadi-frontend/Dockerfile` with a repo-root context; `output: 'standalone'`, `outputFileTracingRoot` set to the monorepo root.
- **Build tooling / scripts:** `next dev`, `next build`, `next start`, `eslint` (flat config, `eslint-config-next/core-web-vitals`). Repo-wide: `pnpm turbo dev --filter=visawadi-frontend`.
- **Testing: there is none for this app.** The repo has tests in exactly five packages (`picturesk-backend`, `domains/assistant`, `domains/openai-ads`, `domains/tickets`, `shared/utils`), all `node --test`. **No test will catch a regression introduced by this redesign.** Visual verification is the only safety net.

### 2.5 PWA

`public/manifest.json` (standalone display, portrait, theme `#254b8e`, three shortcuts) plus a hand-written `public/sw.js` registered 2 s after mount in production only (`src/components/app/ServiceWorker.js`). The worker uses cache-first for `/_next/static/` and images, network-first with an `/offline` fallback for navigations, and explicitly skips `/admin` and `/apply`.

**RISK (MEDIUM):** cache keys are versioned by the constant `VERSION = 'vw-v1'` in `sw.js`. A redesign that changes HTML without bumping that constant will serve stale cached pages to returning visitors.

---

## 3. Project architecture and folder structure

### 3.1 Where things live

```
apps/visawadi-frontend/
├── next.config.mjs            # redirects (apex→www, /visa→/uae), standalone, image config
├── postcss.config.mjs         # @tailwindcss/postcss only
├── Dockerfile                 # repo-root build context
├── public/                    # logos, favicons, og-image, manifest, sw.js, testimonial photos
└── src/
    ├── config.js              # NEXT_PUBLIC_* reader (BACKEND, GA4, TINYMCE)
    ├── config/
    │   ├── contact.js         # EMAIL, WHATSAPP, LEGAL_NAME, ADDRESS(null), GMB_URL(null), SOCIALS
    │   ├── countries.js       # residence countries; only `uae` isLive
    │   ├── trust.js           # trust assurances + hero trust items (copy, not components)
    │   └── blogOffers.js      # blog→visa offer mapping, incl. the one external link
    ├── data/faqs.js           # homepageFaqs (7), faqPageFaqs (7) — hardcoded
    ├── lib/
    │   ├── schema.js          # JSON-LD builders bound to VisaWadi identity
    │   ├── visaCheck.js       # nationality table building, outcome resolution, ISO helpers
    │   └── lp.js              # white-label text scrubber for /lp/*
    ├── components/app/        # the only app-local components (5)
    │   ├── VisaDetailAppPage.js   # orchestrates the visa detail page + lead modal
    │   ├── PackageSegments.js     # package pricing: tabs on mobile, cards on desktop
    │   ├── StickyPriceBar.js      # mobile sticky "from AED X + CTA"
    │   ├── MobileTabBar.js        # 4-item fixed bottom nav
    │   └── ServiceWorker.js       # SW registration
    └── app/                   # App Router
        ├── layout.js          # fonts, viewport, root metadata, Providers
        ├── globals.css        # ALL design tokens + ALL blog article CSS
        ├── Providers.js       # per-route-family shell switching (see 3.2)
        ├── page.js            # homepage
        ├── [country]/page.js  # /uae listing
        ├── [country]/visa/[slug]/page.js
        ├── visa-check/{page.js,[destination]/page.js}
        ├── blog/{page.js,[slug]/page.js,tags/page.js,tags/[slug]/page.js}
        ├── authors/[slug]/page.js
        ├── lp/[slug]/page.js  # noindex white-label clone of the visa page
        ├── apply/{page.js,login/page.js,[applicationRef]/page.js}
        ├── about|contact|faq|privacy-policy|terms-and-conditions/page.js
        ├── offline/page.js
        ├── robots.js, sitemap.js
        ├── error.js, global-error.js, not-found.js, global-not-found.js
        └── admin/{login,forgot-password,(dashboard)/…}
```

Shared library, consumed via subpath exports declared in `packages/frontend-shared/package.json`:

```
packages/frontend-shared/src/
├── layouts/            AppMegaLayout (VisaWadi) + 6 others
├── components/
│   ├── sections/v1/    VisaHero, VisaProcess, VisaRequirements, VisaPricingBreakdown,
│   │                   VisaTrust, VisaTestimonials, VisaFaqSection, VisaFinalCta,
│   │                   VisaInlineCta, VisaQualifiers, VisaSectionHead, VisaGuideLink,
│   │                   PageHero, …
│   ├── sections/v2/    Navbar, MobileNavigation, Footer, Hero, About, Benefits,
│   │                   HowItWorks, Faqs, Contact, BlogPosts, Blog{ChipNav,OfferRail,
│   │                   RelatedPosts,TocRail}, Testimonials
│   ├── cards/          VisaCard, BlogCard, TestimonialCard, …
│   ├── ui/v2/          VisaCheckerInline, VisaSearchBar, FaqAccordion, SocialLinks,
│   │                   StickyWhatsApp, ShareButtons, AuthorBox, BlogOfferCard, BlogInlineOffer
│   ├── forms/v1/       LeadFormModal
│   ├── form-elements/  v1 (Input, NationalitySelect, PhoneInput, …), v2 (CountryPicker, …)
│   └── shared/layout/  Container, PrimarySection, Breadcrumb, BrandMark
├── pages/client/       BlogPage, BlogPostPage, BlogTagsPage, BlogTagDetailPage,
│                       AuthorPage, VisaDetailPage, Apply{Dashboard,Login,Detail}Page
├── services/           api*.js (33 files)
├── hooks/              visa/useVisaCheck, visa/useVisaDestinations, visa-leads/useCreateVisaLead, …
├── utils/              schema, publicMetadata, analytics, pixel, clarity, openaiPixel,
│                       attribution, visaOutcomes, articleHtml, cloudinary, breadcrumb
└── data/               countries.js, nationalities.js, currencyCountries.js
```

### 3.2 The shell-switching root

`src/app/Providers.js` is the most architecturally significant file in the app. It is a client component that reads `usePathname()` and returns one of **three different shells**:

| Route family | Shell |
|---|---|
| `/admin/*` | `Toaster` + `QueryClientProvider` only. No nav, no footer, no analytics. |
| `/lp/*` | Minimal white-label header (`Wadi` wordmark + WhatsApp button), `<main>`, `StickyWhatsApp`. Analytics on. No footer, no tab bar. |
| everything else | `AnalyticsInit` + `AppMegaLayout` (Navbar + spacer + children + Footer) + `MobileTabBar` + `ServiceWorker` + `StickyWhatsApp`. `/apply*` gets the real `UserAuthProvider` and loses the tab bar. |

The navigation model, footer columns and mega-menu contents are **declared as data in this one file**, not in the shared components. A redesign of navigation therefore starts here, not in `Navbar.js`.

### 3.3 Important architectural dependencies

- `transpilePackages: ['@travel-suite/frontend-shared']` — shared code ships as raw JSX and is compiled by the app. There is no build step or lint step for the shared package.
- Tailwind `@source` directives in `globals.css` are what make shared-component classes survive purging.
- `@travel-suite/config` is a declared dependency but **nothing in this app calls `getBrand`**, and `packages/shared/config/src/brands/visawadi.js` does not exist. Calling it would throw.
- `@travel-suite/utils` provides CSRF constants used by `apiClient`.
- **There is no middleware.** Next silently ignores middleware under `output: 'standalone'`, so all redirects must stay in `next.config.mjs`.

---

## 4. Complete page and route inventory

### 4.1 Public routes

All public pages are **server components with ISR**. `Layout` column refers to the shell chosen by `Providers.js`.

| Route pattern | Type | Source file | Layout | Purpose | Primary CTA | SEO weight | Key shared components | Redesign |
|---|---|---|---|---|---|---|---|---|
| `/` | Static-ish (ISR 300s) | `src/app/page.js` | Main | Visa-led homepage | Inline visa checker → `/visa-check/[dest]` | **Critical** | `Hero`(v2), `VisaCheckerInline`, `VisaCard`, `HowItWorks`, `About`, `Benefits`, `Faqs`, `BlogPosts`, `Contact` | **IN SCOPE** |
| `/[country]` | ISR 300s, `dynamicParams=false`, only `uae` | `src/app/[country]/page.js` | Main | Destination listing for a residence country | Visa checker; visa cards | **Critical** | `PrimarySection`, `Container`, `VisaCheckerInline`, `VisaCard` | **IN SCOPE** |
| `/[country]/visa/[slug]` | ISR 300s, `generateStaticParams` from API | `src/app/[country]/visa/[slug]/page.js` | Main | The money page: packages, process, requirements, cost, trust, FAQ | `LeadFormModal` (6 entry points) | **Critical** | `VisaDetailAppPage` → 11 `sections/v1/Visa*` + `PackageSegments` + `StickyPriceBar` + `LeadFormModal` | **IN SCOPE** |
| `/visa-check` | ISR 3600s | `src/app/visa-check/page.js` | Main | Checker hub + index of 35 destinations | Checker form | High | `VisaCheckerInline`, `Container` | **IN SCOPE** |
| `/visa-check/[destination]` | ISR 3600s, 2-letter ISO | `src/app/visa-check/[destination]/page.js` | Main | "Do you need a visa for X?" + 238-row nationality table | Contextual CTA to the matching visa page | High (35 URLs) | `PrimarySection`, `Container`, `OUTCOME_UI` | **IN SCOPE** |
| `/about` | Static | `src/app/about/page.js` | Main | Company story | Links to `/uae`, `/contact` | Medium | `Container`, `PrimarySection` | **IN SCOPE** |
| `/contact` | Static | `src/app/contact/page.js` | Main | Email + WhatsApp + socials | mailto / wa.me | Medium | `SocialLinks` | **IN SCOPE** |
| `/faq` | Static | `src/app/faq/page.js` | Main | 7 hardcoded FAQs | none explicit | Medium | `PageHero`(v1), `FaqAccordion`(v2) | **IN SCOPE** |
| `/privacy-policy` | Static | `src/app/privacy-policy/page.js` | Main | Legal | — | Low | hand-written | **IN SCOPE** (low priority) |
| `/terms-and-conditions` | Static | `src/app/terms-and-conditions/page.js` | Main | Legal | — | Low | hand-written | **IN SCOPE** (low priority) |
| `/blog` | ISR 3600s, `?page=N` | `src/app/blog/page.js` | Main | Post listing, 15/page | Read post | High | `pages/client/BlogPage` → `BlogCard`, `BlogPaginationBar`, `Breadcrumb` | **EXCLUDED** |
| `/blog/[slug]` | ISR 300s, `generateStaticParams` | `src/app/blog/[slug]/page.js` | Main | Article (83 live) | `getBlogOffers` rail + inline offer → visa pages | **Critical (83 URLs)** | `pages/client/BlogPostPage` → `BlogChipNav`, `BlogOfferRail`, `BlogRelatedPosts`, `AuthorBox`, `ShareButtons`, `FaqAccordion` | **EXCLUDED** |
| `/blog/tags` | ISR 300s | `src/app/blog/tags/page.js` | Main | Tag index | Browse tag | Medium | `pages/client/BlogTagsPage` | **EXCLUDED** |
| `/blog/tags/[slug]` | ISR 300s, 13 live | `src/app/blog/tags/[slug]/page.js` | Main | Posts by tag | Read post | Medium | `pages/client/BlogTagDetailPage` | **EXCLUDED** |
| `/authors/[slug]` | ISR 3600s, 1 live | `src/app/authors/[slug]/page.js` | Main | Author profile + their posts | Read post | Low | `pages/client/AuthorPage` | **EXCLUDED** (blog-adjacent; E-E-A-T surface) |
| `/lp/[slug]` | ISR 300s, **noindex** | `src/app/lp/[slug]/page.js` | LP shell | White-label paid-traffic clone of the visa page, brand scrubbed to "Wadi"/"permit" via `lib/lp.js` | `LeadFormModal` | None (noindex) | `pages/client/VisaDetailPage` | **Decide** — see §11 |
| `/apply` | Client | `src/app/apply/page.js` | Main, real auth | Customer application dashboard | Upload documents | None (noindex) | `ApplyDashboardPage` | **EXCLUDED** (functional, not marketing) |
| `/apply/login` | Client | `src/app/apply/login/page.js` | Main, real auth | Magic-link sign-in | — | None | `ApplyLoginPage` | **EXCLUDED** |
| `/apply/[applicationRef]` | Client | `src/app/apply/[applicationRef]/page.js` | Main, real auth | Document upload per application | Upload | None | `ApplyDetailPage` | **EXCLUDED** |
| `/offline` | Static | `src/app/offline/page.js` | Main | PWA offline fallback | — | None | — | Low priority |
| `/robots.txt` | Generated | `src/app/robots.js` | — | — | — | — | — | Do not change |
| `/sitemap.xml` | Generated, ISR 3600s | `src/app/sitemap.js` | — | 152 URLs | — | — | — | Do not change |

**Error boundaries:** `error.js`, `global-error.js`, `not-found.js` (custom, with a helpful-links block), `global-not-found.js`, `lp/not-found.js`, `admin/not-found.js`.

### 4.2 Admin routes — all EXCLUDED

`/admin/login`, `/admin/forgot-password`, and under `(dashboard)`: `/admin`, `visa-leads[/id]`, `visa-applications[/id]`, `document-registry`, `blog[/new|/id/edit]`, `blog-tags`, `visa[/new|/id/edit]`, `revenue`, `payment-links[/id]`, `products`, `users`, `chatgpt-ads[/new|/id]`, `assistant`, `account`.

Every one is a two-line re-export of a shared `pages/admin/*` component. Nav and roles are declared in `src/app/admin/(dashboard)/layout.js`. **Do not touch during the redesign** — the house rule is that admin pages match the `insurance-applications` styling, which is a separate consistency contract.

### 4.3 Route relationships that matter

- **`/` vs `/uae`.** Both are commercial, both target UAE residents, both open with a dark hero and the same `VisaCheckerInline`, both list `VisaCard`s. `/` shows the top 6 destinations in a curated `DESTINATION_ORDER`; `/uae` shows all 10 resolved for residence `AE`. Canonicals are distinct and self-referencing.
  **RISK (MEDIUM):** these two pages are near-duplicates in intent and content. **RECOMMENDATION:** give them clearly different jobs in the redesign — `/` as brand + checker entry, `/uae` as the full directory with filtering — rather than two versions of the same page.
- **`/uae/visa/[slug]` is the only template with 10 instances**, and it is the only page with a lead form. One reusable layout already covers all ten.
- **`/visa-check/[destination]` (35 pages) is a second template at scale** and is informational, not commercial, converting through a single contextual CTA block. It shares no components with the visa detail page today.
- **Legacy paths.** `/visa` → `/uae` and `/visa/:slug` → `/uae/visa/:slug` are permanent (308) redirects in `next.config.mjs`, verified live. Apex → www is also 308, verified live. **Internal links must use the country-prefixed canonical form.**
- **Trailing slash:** Next's default. `/uae/` 308-redirects to `/uae`. Verified live.

---

## 5. Current branding and design system

### 5.1 Brand assets

| Asset | Path | Notes |
|---|---|---|
| Dark wordmark (navbar) | `public/logo-dark.png` | 1000×176, used in `Providers.js` |
| Light wordmark (footer) | `public/logo-light.png` | 1000×179 |
| Legacy logo | `public/logo.webp` | Default in `Navbar`'s prop, not used here |
| Favicons | `favicon.ico` (32), `favicon.png` (300), `apple-touch-icon.png` (180) | |
| PWA icons | `icon-192.png`, `icon-512.png` | any + maskable |
| OG image | `og-image.png` | Referenced by every public page's metadata |
| Schema logo | `logo-dark.png` | Via `lib/schema.js` `logoUrl` |
| Photography | `happy-traveler1.webp`, `happy-traveler2.webp`, `contact-img.webp`, `travel-icon.webp`, `ahmed.webp`, `david.webp`, `maria.webp` | Generic stock; the people shots appear in `About`(v2) |
| Third-party marks | `trustpilot.webp`, `axa-logo.png`, `dirham.svg`, `sample-ticket2.webp` | `axa-logo` and `sample-ticket2` are inherited from other brands and appear unused by VisaWadi routes |

**Hero imagery** for visa pages is **not** in `public/` — it is `visa.heroImageUrl` from Cloudinary (`visawadi/visa` folder), set per visa page in the admin.

**Documented brand guidelines:** none for VisaWadi. There is no `packages/shared/config/src/brands/visawadi.js`, and no `docs/visawadi/BRAND.md` (Picturesk has one; VisaWadi does not). The closest thing to a written rationale is the comment block at the top of `globals.css` and the two prior audits in `docs/audits/`.

### 5.2 Colour tokens — FACT

Defined in `@theme inline` in `apps/visawadi-frontend/src/app/globals.css`. The file documents the rationale: cobalt replaced an inherited teal when VisaWadi split from Travl, chosen to read "institutional and document-adjacent" and to sit clear of the checker's green/amber/red result states.

**Primary — "Cobalt"**

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--color-primary-50` | `#f3f4f7` | | `--color-primary-500` | `#356dd0` |
| `--color-primary-100` | `#e1e6ef` | | `--color-primary-600` | `#2b5cb0` |
| `--color-primary-200` | `#becce4` | | `--color-primary-700` | `#254b8e` ← brand anchor |
| `--color-primary-300` | `#8fabdb` | | `--color-primary-800` | `#203d6f` |
| `--color-primary-400` | `#5e89d4` | | `--color-primary-900` | `#182c4e` |
| | | | `--color-primary-950` | `#0f1b2e` |

**Accent — coral**

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--color-accent-50` | `#fff3f0` | | `--color-accent-500` | `#F26B4E` ← CTA colour |
| `--color-accent-100` | `#fee7e1` | | `--color-accent-600` | `#e85830` |
| `--color-accent-200` | `#fccdbf` | | `--color-accent-700` | `#cc4019` |
| `--color-accent-300` | `#faae99` | | `--color-accent-800` | `#a63617` |
| `--color-accent-400` | `#f68c6f` | | `--color-accent-900` | `#762913` |
| | | | `--color-accent-950` | `#441a0e` |

Other brand-adjacent colours, **hardcoded, not tokenised**:
- `#254b8e` repeated as `themeColor` in `layout.js`, as `theme_color` in `manifest.json`, and in the backend's notification theme (`routes/index.js`: `primaryColor #254b8e`, `accentColor #F26B4E`, `linkColor #2b5cb0`). **Changing the brand colour means changing four files, one of them a backend file that styles transactional email.**
- `body { color: #111827 }`, `.blog_post` text `#334155`, headings `#0f172a`.
- Semantic states come from raw Tailwind palette classes (`green-700`, `amber-50`, `red-200`, `yellow-400`) in `visaOutcomes.js`, the visa-check page and `VisaTestimonials`. **There are no semantic tokens.**

Contrast: the file asserts white on `primary-700` measures 8.48:1. Not re-verified here.

### 5.3 Typography — FACT

Loaded in `src/app/layout.js` via `next/font/google`, all `display: 'swap'`, all self-hosted by Next:

| Role | Face | CSS variable | Weights |
|---|---|---|---|
| UI / body / headings | **Commissioner** | `--font-brand` | variable 100–900 |
| Figures (fees, dates, refs) | **IBM Plex Mono** | `--font-data` | 400, 500, 600 |
| Fallback mono | Geist Mono | `--font-geist-mono` | variable |

Token aliases in `@theme`:

```
--font-sans:         var(--font-brand), …
--font-mono:         var(--font-data), var(--font-geist-mono), …
--font-nunito:       var(--font-brand), sans-serif   ← legacy alias
--font-merriweather: var(--font-brand), sans-serif   ← legacy alias
--font-outfit:       var(--font-brand), sans-serif   ← legacy alias
```

The `--font-outfit` alias matters: **`font-outfit` is applied as a class on roughly every element in the `sections/v1/Visa*` components and in `LeadFormModal`.** It no longer means Outfit; it means "the brand face". A redesign that removes the alias without removing the classes will silently drop every one of those elements to the fallback stack.

**Two documented CSS hacks you will hit immediately:**

1. `globals.css` opens with an **unlayered** `* { font-family: var(--font-outfit), sans-serif; }`. Unlayered declarations beat everything in `@layer utilities`, so Tailwind's `font-mono` utility cannot win against it.
2. Because of (1), the file re-declares `.font-mono` at the bottom with the data font and `font-variant-numeric: tabular-nums`. The comment says removing the `*` rule would be the better fix but it is load-bearing for other brand pages.

**RECOMMENDATION:** removing that `*` rule is the single highest-value cleanup available before a redesign, and it is safe to do for VisaWadi alone because `globals.css` is per-app.

**Type scale — FACT: there isn't one.** Sizes are a mixture of Tailwind steps (`text-sm`, `text-xl`, `text-4xl`) and arbitrary values. A sample from the visa detail path: `text-[28px] md:text-[44px] lg:text-[52px]` (VisaHero h1), `text-[16px] md:text-[19px]`, `text-[15px]`, `text-[14.5px]`, `text-[13px]`, `text-[12.5px]`, `text-[11px]`, `text-[10px]`. Measured live: homepage `h1` 36px at 390px and 52px at 1440px; blog body 15px/25.5px at 390px.

### 5.4 Spacing, radii, shadows, layout

| Aspect | Current state |
|---|---|
| Spacing scale | Tailwind default. One custom utility: `@utility py-section { 56px / 72px@md / 96px@lg }` — **declared in `globals.css` but not used by any VisaWadi page.** Sections instead hand-roll `py-12 md:py-16`, `py-14 md:py-20`, `py-14 md:py-25`, `pt-16 pb-18 md:pt-18 md:pb-20 lg:pt-20 lg:pb-24`. **Vertical rhythm is inconsistent between sections.** |
| Radii | Tokens exist only for inputs: `--rounded-input-sm 5px`, `-md 8px`, `-lg 10px`. In practice components use Tailwind classes: `rounded-xl` (buttons, inputs), `rounded-2xl` (cards, panels), `rounded-3xl` (modal), `rounded-full` (pills, v1 CTAs). Already fairly "rounded"; the redesign brief is compatible with the existing vocabulary. |
| Shadows | Four unused legacy tokens (`--input-box-shadow`, `--form-shadow`, `--flight-shadow`, …) that reference `--grey-color-600`, **a variable that is never defined**. Real shadows are arbitrary inline values: `shadow-[0_4px_20px_rgba(16,24,40,0.06)]`, `shadow-[0_12px_36px_rgba(16,24,40,0.12)]`, `shadow-[0_2px_8px_rgba(16,24,40,0.04)]`, `shadow-[0_1px_4px_rgba(16,24,40,0.04)]`, plus `shadow-sm/lg/xl/2xl`. |
| Breakpoints | Tailwind defaults (`sm 640`, `md 768`, `lg 1024`, `xl 1280`). **Effectively one breakpoint:** almost every structural switch is `lg:`. |
| Container | `components/shared/layout/Container.js` — `w-[90%] md:w-[85%] lg:w-[80%] mx-auto`. **No `max-w`.** Measured at 1440px: content spans the full 80% (~1152px) with ~144px gutters; at 1920px it would be 1536px wide. |
| `PrimarySection` | A bare `<section {...props}>` passthrough. Provides no styling at all. |
| Grid | Ad hoc per section: `grid-cols-2 … lg:grid-cols-3` (homepage cards), `sm:grid-cols-2 lg:grid-cols-4` (trust), inline `gridTemplateColumns` computed from `packages.length` in `PackageSegments`. |
| Dark mode | **Not supported.** No `prefers-color-scheme` rule, no `dark:` variant anywhere. "Dark" sections are hardcoded `bg-gray-900`. |
| Motion | CSS only: `transition-colors`, `transition-transform duration-200`, `hover:-translate-y-1` on cards, `hover:-translate-y-0.5` on the v1 hero CTA, `translate-y-full` slide for `StickyPriceBar`, `rotate-90`/`rotate-180` chevrons, `animate-spin` on the submit spinner. `* { scroll-behavior: smooth }`. No `prefers-reduced-motion` guard anywhere. |

### 5.5 Component style patterns

| Pattern | Current implementation |
|---|---|
| Primary button | Two competing styles. **v2 / app pages:** `rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800`. **v1 Visa sections:** `rounded-full bg-accent-500 … text-gray-900` (note: dark text on coral) or `rounded-full bg-primary-700 text-white`. |
| Secondary button | `rounded-xl border border-gray-200 hover:border-primary-300 text-gray-700` (static pages) or `rounded-full border border-white/40` (dark heroes). |
| CTA colour conflict | `PackageSegments` and `StickyPriceBar` use `bg-accent-500 text-white`; `VisaHero`'s CTA uses `bg-accent-500 text-gray-900`. **Same button, two text colours.** |
| Input | One constant, `INPUT_CLS` in `LeadFormModal`: `border border-gray-200 rounded-xl px-4 py-2.5 text-sm … focus:ring-2 focus:ring-primary-500`. Not shared with other inputs. |
| Card | `rounded-2xl border border-gray-100 bg-white` + an arbitrary shadow. Consistent in shape, inconsistent in shadow value. |
| Accordion | Two implementations: `ui/v2/FaqAccordion` (React state, used for FAQs) and native `<details>/<summary>` (used in `VisaRequirements`, first item `open`). |
| Section heading | `sections/v1/VisaSectionHead` — `text-left md:text-center`, `text-2xl md:text-4xl`. Used only by the v1 Visa family. Other sections hand-roll their headings. |

### 5.6 Verdict: coherent or fragmented?

**Fragmented, but shallowly so.** The colour ramp is genuinely centralised and well-reasoned, the fonts are tokenised by role rather than by face, and there is no competing design system to unwind. Everything else — type scale, spacing rhythm, shadows, button variants, section padding — is expressed as literal utility strings scattered across ~40 components, with two parallel generations (v1 and v2) that look different by accident rather than intent.

The practical consequence for a redesign: **you are not refactoring a design system, you are creating the first one.** That is more work than tweaking tokens but far less risky than replacing an entrenched one.

Core style files, in the order you will need them:

1. `apps/visawadi-frontend/src/app/globals.css` — all tokens, all blog CSS
2. `apps/visawadi-frontend/src/app/layout.js` — font loading, `themeColor`
3. `apps/visawadi-frontend/src/app/Providers.js` — shell, nav data, footer data
4. `packages/frontend-shared/src/components/shared/layout/Container.js` — the only layout primitive
5. `packages/frontend-shared/src/components/sections/v1/VisaSectionHead.js` — the only shared heading primitive

---

## 6. Reusable component inventory

The **Shared with** column is the blast radius, established by grepping every app for the import path. This is the most important column in the document.

### 6.1 Global layout and navigation

| Component | Path | Purpose | Key props | Used by | Shared with | Replacing it |
|---|---|---|---|---|---|---|
| `AppMegaLayout` | `layouts/AppMegaLayout.js` | Navbar + 45/53px spacer + children + footer | `pages, logoSrc, footer, cta, ctaOnMobile, showCurrency, loginHref, signupHref` | `Providers.js` | **travl** | MEDIUM risk |
| `Navbar` | `sections/v2/Navbar.js` (436 lines) | Desktop nav with tabbed and column mega-menus, user menu, CTA | same as above | `AppMegaLayout` | **travl** | **HIGH risk** |
| `MobileNavigation` | `sections/v2/MobileNavigation.js` | Full-screen mobile drawer; flattens mega columns into an accordion | `pages, cta, showCta, showCurrency, loginHref` | `Navbar` | **travl** | **HIGH risk** |
| `Footer` | `sections/v2/Footer.js` | 4-column dark footer with logo, description, socials, optional address | `brand, logoSrc, description, copyright, columns, socials, address, addressHref` | `Providers.js` | **travl** | MEDIUM risk |
| `MobileTabBar` | `src/components/app/MobileTabBar.js` | Fixed 4-tab bottom nav (Home / Check / Apply / Guides), `lg:hidden` | none | `Providers.js` | **VisaWadi only** | **Safe** |
| `Container` | `shared/layout/Container.js` | 90/85/80% width wrapper | `className` | everywhere | **all 6 brands** | **HIGH risk** — do not edit; wrap or replace per-app |
| `PrimarySection` | `shared/layout/PrimarySection.js` | Bare `<section>` passthrough | any | everywhere | all brands | Safe (it does nothing) |
| `Breadcrumb` | `shared/layout/Breadcrumb.js` | Visual breadcrumb + optional JSON-LD | `paths, dark, includeSchema` | blog pages only | all brands | MEDIUM risk |

**FACT (live, 1440×900):** `<header>` is `position: absolute`, height 77px, while `AppMegaLayout`'s spacer is 53px — **a 24px overlap**. It works today only because every first section has enough top padding. It also means **the header is not sticky**: it scrolls away on every page, on every viewport.

### 6.2 Visa commercial components — all VisaWadi-only

| Component | Path | Purpose | Key props | Replacing it |
|---|---|---|---|---|
| `VisaDetailAppPage` | `src/components/app/VisaDetailAppPage.js` | Orchestrates the whole visa page; owns lead-modal state and the `openModal(pkg, source)` contract | `visa, schema, breadcrumbJsonLd, breadcrumbPaths, whatsappUrl, trustAssurances, trustSubtitle, heroTrustItems, testimonialsSubtitle` | **Safe** |
| `PackageSegments` | `src/components/app/PackageSegments.js` | Pricing. Mobile: ARIA tablist with price in the tab. Desktop: 2–3 cards | `packages, countryName, guide, onPackageSelect` | **Safe** |
| `StickyPriceBar` | `src/components/app/StickyPriceBar.js` | Mobile sticky "From AED X + CTA", revealed by an IntersectionObserver sentinel, sits 58px above the viewport bottom to clear the tab bar | `fromPrice, currency, ctaText, hidden, onCtaClick` | **Safe** |
| `VisaHero` | `sections/v1/VisaHero.js` | Full-bleed Cloudinary image + gradient scrim; splits the headline at the first `". "` and colours the second sentence | `headline, subheadline, ctaText, imageUrl, imageAlt, trustItems, onCtaClick` | **Safe** |
| `VisaQualifiers` | `sections/v1/VisaQualifiers.js` | "Is this right for you?" checklist | `items, countryName, term` | **Safe** (currently commented out in the working tree) |
| `VisaProcess` | `sections/v1/VisaProcess.js` | Numbered steps; vertical timeline on mobile, 3-up on desktop | `steps, countryName, guide, term` | **Safe** |
| `VisaRequirements` | `sections/v1/VisaRequirements.js` | Native `<details>` accordions of document checklists | `sections, countryName, guide, term` | **Safe** |
| `VisaPricingBreakdown` | `sections/v1/VisaPricingBreakdown.js` | Fee table with computed indicative total | `rows, countryName, guide, term` | **Safe** |
| `VisaTrust` | `sections/v1/VisaTrust.js` | 4 assurance cards. Contains a **word-overlap de-duplication heuristic** that merges CMS `whyUs` items with config `assurances` and drops near-duplicates | `items, assurances, title, subtitle` | **Safe** — but preserve the de-dup logic or duplicates reappear |
| `VisaTestimonials` | `sections/v1/VisaTestimonials.js` | Up to 3 `isFeatured` testimonials with star rows | `testimonials, subtitle, term` | **Safe** |
| `VisaFaqSection` | `sections/v1/VisaFaqSection.js` | FAQ accordions, `id="faq"` | `faqs, countryName, guide, term` | **Safe** |
| `VisaInlineCta` | `sections/v1/VisaInlineCta.js` | Mid-page CTA strip (used 3×) | `text, ctaText, onCtaClick` | **Safe** |
| `VisaFinalCta` | `sections/v1/VisaFinalCta.js` | Gradient closing CTA + WhatsApp button (fires `reportWhatsappClick`) | `headline, ctaText, onCtaClick, whatsappUrl` | **Safe** — keep the conversion call |
| `VisaSectionHead` | `sections/v1/VisaSectionHead.js` | Shared section heading for the v1 family | `title, subtitle, className` | **Safe** |
| `VisaGuideLink` | `sections/v1/VisaGuideLink.js` | "Read our guide" link to a blog post; renders only if `guide.status === 'published'` | `guide, label` | **Safe** — **but it is the main commercial→blog internal link. Preserve it.** |
| `VisaCard` | `cards/VisaCard.js` | Destination card: 16:9 Cloudinary image, timeline, "From AED X" | `visa, href, basePath, features, priority` | **Safe** |
| `VisaDetailPage` | `pages/client/VisaDetailPage.js` | Alternative composition of the same v1 sections, used only by `/lp/[slug]` | `visa, term, …` | **Safe** |

**Orphans:** `sections/v1/VisaPackages.js` (274 lines) and `sections/v1/VisaStickyCta.js` have **no importer in any app**. They are the predecessors of `PackageSegments` and `StickyPriceBar`. Dead code; do not model the redesign on them.

### 6.3 Conversion components

| Component | Path | Purpose | Shared with | Replacing it |
|---|---|---|---|---|
| `LeadFormModal` | `forms/v1/LeadFormModal.js` (465 lines) | **The only conversion surface on the site.** | **VisaWadi only** | **Safe to restyle, HIGH risk to rewrite** — see §7.1 |
| `VisaCheckerInline` | `ui/v2/VisaCheckerInline.js` | Wraps `VisaSearchBar`, resolves the answer, optionally routes to `/visa-check/[dest]` | **VisaWadi only** | **Safe** |
| `VisaSearchBar` | `ui/v2/VisaSearchBar.js` | 3 × `CountryPicker` + submit; pill layout or stacked | **VisaWadi only** | **Safe** |
| `CountryPicker` | `form-elements/v2/CountryPicker.js` | Searchable country combobox | VisaWadi + travl | MEDIUM |
| `NationalitySelect` | `form-elements/v1/NationalitySelect.js` | Nationality combobox over the static `data/nationalities.js` | multiple brands | MEDIUM |
| `PhoneInput` | `form-elements/v1/PhoneInput.js` | Country code + digits, validated with libphonenumber | multiple brands | MEDIUM |
| `StickyWhatsApp` | `ui/v2/StickyWhatsApp.js` | Floating WhatsApp FAB; `hidePathPrefixes`, `bottomOffset` | multiple brands | MEDIUM |

### 6.4 Homepage / marketing sections — shared with travl

| Component | Path | Shared with | Replacing it |
|---|---|---|---|
| `Hero` (v2) | `sections/v2/Hero.js` | travl | **HIGH risk** — two layouts (`split`, `centered`), `dark` flag, `below` slot |
| `About` (v2) | `sections/v2/About.js` | travl | HIGH |
| `Benefits` (v2) | `sections/v2/Benefits.js` | travl | HIGH |
| `HowItWorks` (v2) | `sections/v2/HowItWorks.js` | travl | HIGH |
| `Faqs` (v2) | `sections/v2/Faqs.js` | travl | HIGH |
| `Contact` (v2) | `sections/v2/Contact.js` | travl | HIGH |
| `BlogPosts` (v2) | `sections/v2/BlogPosts.js` | travl, emirateslimo | HIGH |
| `FaqAccordion` (v2) | `ui/v2/FaqAccordion.js` | travl + **blog article FAQs** | **HIGH — also on the blog** |
| `PageHero` (v1) | `sections/v1/PageHero.js` | dt365, mdt, thedt, travl | **HIGH** — used by `/faq` and by `BlogPage`/`BlogTagsPage` |
| `SocialLinks` | `ui/v2/SocialLinks.js` | multiple | MEDIUM |

### 6.5 Blog components — EXCLUDED from the redesign

`pages/client/BlogPage`, `BlogPostPage`, `BlogTagsPage`, `BlogTagDetailPage`, `AuthorPage`; `sections/v2/BlogChipNav`, `BlogOfferRail`, `BlogTocRail`, `BlogRelatedPosts`; `ui/v2/BlogOfferCard`, `BlogInlineOffer`, `AuthorBox`, `ShareButtons`; `cards/BlogCard`; `ui/v1/BlogPaginationBar`; `utils/articleHtml.js`.

`BlogPostPage` is imported by **six apps** (dt365, emirateslimo, mdt, thedt, travl, visawadi, plus picturesk's own blog route). Editing it is the highest-blast-radius change available in this repository.

### 6.6 Duplication worth consolidating — RECOMMENDATION

1. **Three separate accordion implementations** (`ui/v2/FaqAccordion`, `ui/v1/FaqAccordion`, native `<details>` in `VisaRequirements`). One primitive would do.
2. **Breadcrumb exists three times**: the shared `Breadcrumb` component (blog only), a hand-rolled inline version in `Hero` (v2), and JSON-LD-only on the visa detail page with **no visual breadcrumb at all**.
3. **Button styles** are re-declared inline in at least eight places with three different radii and two text colours on the same background.
4. **Dark hero markup** (`bg-gray-900` + eyebrow + h1 + lede) is hand-written separately in `/uae`, `/visa-check`, `/visa-check/[destination]` while the homepage uses `Hero` with `layout="centered" dark`. One component should cover all four.
5. **"From AED X"** price formatting is implemented independently in `VisaCard`, `PackageSegments`, `StickyPriceBar` and `LeadFormModal`.
6. **Section padding** — six different vertical rhythms across the visa page; the `py-section` utility already exists and is unused.

---

## 7. User journeys and conversion flows

Traced from source and, where noted, exercised in the browser.

### 7.1 The one conversion: visa detail → lead

**This is the only lead-generation mechanism on the entire site.** There is no self-serve checkout, no public account creation, no quote-and-pay flow.

**Entry points into the modal (6), all calling `openModal(packageName, source)` in `VisaDetailAppPage`:**

| Trigger | `source` value | Package preselected |
|---|---|---|
| Hero CTA | `hero_cta` | `undecided` |
| Sticky mobile price bar | `sticky_bar` | `undecided` |
| Package "Choose X" button | `package_card` | that package's name |
| Three inline CTA strips | `inline_cta` | `undecided` |
| Final CTA | `final_cta` | `undecided` |

**Sequence**

1. `trackVisaLeadOpen({ visaSlug, packageRequested, source })` → GA4 `lead_form_open`.
2. Modal mounts: body scroll locked, focus moved to the first field, opener element stored for focus restore, `Escape` and backdrop click both guarded by a `window.confirm` when the form is dirty.
3. Fields: `firstName*`, `lastName*` (max 50), `nationality*` (combobox over the static list), `email` (**optional**, regex-validated), `phone*` (`{code, digits}`, validated with `libphonenumber-js`, defaults to `+971`), `packageRequested*` (radio list of the visa's packages plus "I haven't decided yet"), `applicantCount` (1–20), and a hidden `website` honeypot.
4. Submit → `useCreateVisaLead` → `POST /api/visa-leads` with `getMetaBrowserIds()` (`fbp`/`fbc`) merged in.
5. On success: Meta Pixel `Lead` with `eventId = visa-lead:<id>`, OpenAI pixel `lead_created` with the same id, GA4 `generate_lead`. Then a success panel ("Thanks, {firstName}") replaces the form.
6. Server-side the backend fans the same lead out to Meta CAPI, OpenAI CAPI and a Google Ads lead conversion, and emails the team via the notifications service.

**Modal title and button text change with `source`:** `package_card` renders "Apply for X Visa" / "Submit application"; everything else renders "Free consultation: X visa" / "Request my call-back". **Same endpoint, same payload — only the copy differs.**

**States.** Loading: disabled button + spinner + "Sending…". Error: red panel, with a WhatsApp fallback link when `whatsappUrl` is set; timeouts get a distinct message. Success: as above. **There is no inline validation on blur** — errors surface on submit.

**UX friction visible in the code — RECOMMENDATION, not measured:**
- Eight fields for what is positioned as a free consultation. Nationality and applicant count are asked before any value is delivered.
- `window.confirm()` for discard-on-dismiss is a native browser dialog in an otherwise custom UI, and fires on both Escape and backdrop click.
- The package radio list duplicates the choice the user just made by clicking "Choose X".
- No progress indication; the form is a single long scroll inside a `max-h-[90vh]` panel.

### 7.2 Homepage → visa checker → result

1. `/` hero renders `VisaCheckerInline` with `resultPath="/visa-check"`.
2. `useVisaCheck` holds `{nationality, residence, destination}`; residence is optional; destination list comes from `useVisaDestinations` (API) plus a synthetic `XS` "Schengen Area" option.
3. Submit → `checkVisaRequirementApi` → on success `router.push('/visa-check/<dest>?nationality=XX&residence=YY')`.
4. The destination page re-resolves server-side from the same rule and renders: a toned verdict card, the full 238-nationality table with the user's row highlighted and floated to the top, a residence note, the official source link and "last checked" date.
5. If the outcome needs action **and** the destination is serviced, a dark CTA block links to `/uae/visa/<visaSlug>`.

**Because `resultPath` is set, the inline result card inside `VisaCheckerInline` never renders on VisaWadi** — the component always navigates instead. That branch of the component is dead code here.

**Friction — RECOMMENDATION:** the verdict arrives on a *new page load* after a round trip, rather than inline; the 238-row table is the dominant element on the result page and is not the answer the user came for.

### 7.3 Homepage → country visa page

`/` → `VisaCard` (`basePath="/uae"`) or "See all destinations" → `/uae` → `VisaCard` → `/uae/visa/[slug]`. Mega menu and footer link straight to the ten detail pages. `MobileTabBar`'s "Apply" tab also lands on `/uae`.

### 7.4 Package selection

Mobile: `role="tablist"` with price under each tab name; one panel visible; "Choose {name}" at the bottom. Desktop: 2–3 cards, `isHighlighted` gets `border-primary-300 shadow-lg`. Both call `onPackageSelect(pkg.name)` → modal with that package preselected and `source="package_card"`.

**FACT:** the mobile tab strip uses `gridTemplateColumns: repeat(packages.length, 1fr)` with `text-[13px]`. With three packages at 390px each tab is ~115px wide.

### 7.5 Blog → commercial

`src/config/blogOffers.js` maps a post to an offer by slug token (`france` → `/uae/visa/france-visa`, `schengen|netherlands|switzerland|greece` → `/uae/visa/schengen`, …), defaulting to `/uae`. Posts tagged `Dummy Ticket`/`Flight Itinerary` or slugged `dummy-ticket|pnr|onward|real-ticket` get a **second, deliberately external offer** to `dummyticket365.com`.

Rendered as: a sidebar `BlogOfferRail` (desktop), an inline offer injected after the second heading by `prepareArticleHtml`, and a CTA inside the "Short Answer" box on mobile. **Verified live:** six CTAs on a sample post, all pointing at `/uae/visa/united-kingdom`.

The reverse direction is `VisaGuideLink`, which renders under five sections of the visa page when the CMS has linked a published guide.

**This two-way link set is the site's internal-linking backbone between the commercial silo and the content silo. It must survive the redesign.**

### 7.6 Contact actions

- **WhatsApp:** `StickyWhatsApp` FAB on every non-`/apply` public page, offset 124px from the bottom to clear the tab bar and price bar; the `VisaFinalCta` button, which calls `reportWhatsappClick` (fires a server-side OpenAI CAPI event via `/api/openai-events`); `/contact`; the LP header.
- **Email:** `mailto:info@visawadi.com` from the nav ("Email Us"), `/contact`, the `Contact` homepage section, and the empty-state on `/uae`.
- **No phone number is published** anywhere (the WhatsApp number is not rendered as a `tel:` link).

### 7.7 Document upload (post-sale)

`/apply/login` (magic link emailed by the backend) → `/apply` dashboard → `/apply/[applicationRef]` upload. `noindex`, disallowed in robots, excluded from the service worker, no tab bar. **The reminder cron emails `/apply/...` URLs, so these routes must stay reachable at their current paths.**

### 7.8 Mobile-specific behaviour

- `MobileTabBar`: 4 tabs, `min-h-[58px]`, `env(safe-area-inset-bottom)` padding, `lg:hidden`. `.has-tabbar` adds matching bottom padding to `<main>`.
- `StickyPriceBar`: slides up once the hero sentinel leaves the viewport; hidden while the modal is open.
- `LeadFormModal`: bottom sheet (`items-end`, `rounded-t-3xl`) on mobile, centred dialog on `sm+`.
- `MobileNavigation`: full-screen white overlay that flattens the mega-menu into an accordion.

---

## 8. SEO architecture and technical findings

### 8.1 Rendering and crawlability

| Aspect | Finding |
|---|---|
| Rendering | **Server-side / ISR for every public page.** Content is in the initial HTML. `revalidate`: 300s (home, `/uae`, visa detail, blog post, tags), 3600s (`/visa-check*`, `/blog`, authors, sitemap). |
| Dynamic params | `/uae/visa/[slug]`, `/blog/[slug]`, `/blog/tags/[slug]`, `/authors/[slug]` are pre-rendered from API calls at build time. `/[country]` sets `dynamicParams = false` — any country slug other than `uae` 404s. `/visa-check/[destination]` is on-demand ISR validated against a 2-letter ISO regex. |
| Client-only content | None on public pages. The only client components are the nav, the checker, the modal, the sticky bar and the tab bar. |
| Internal links | Real `<a>`/`next/link` anchors throughout. **No JavaScript-only navigation.** Verified live: 45 anchors on the homepage at 390px. |
| Build-time data | `generateStaticParams` calls the live backend. **A backend outage at build time silently produces a site with zero visa pages** (the `catch` swallows the error and returns `[]`). |

### 8.2 Metadata

Every public page exports `metadata` or `generateMetadata` with title, description, self-referencing canonical, `robots`, Open Graph and Twitter `summary_large_image`. Root template: `"%s | VisaWadi"`, default `"VisaWadi — Visa Assistance for UAE Residents"`, `metadataBase` set.

| Page | Title source | Canonical | Notes |
|---|---|---|---|
| `/` | hardcoded | `SITE_URL` | `title.absolute` not used, so the template appends — verified live as "Schengen, UK, US & Canada Visa Help for UAE Residents" with no suffix because the root template is only applied to child `title` strings. |
| `/[country]` | templated from `countries.js` | `/uae` | |
| `/[country]/visa/[slug]` | `visa.metaTitle` → fallback | `/uae/visa/<slug>` | OG image = `visa.heroImageUrl` |
| `/visa-check/[destination]` | generated from the rule, includes the visa-free count | `/visa-check/<iso>` | **The `?nationality=&residence=` query variants all canonicalise to the bare path — correct.** |
| `/blog` | `"… | Page N"` for N>1 | `?page=N` self-canonical | |
| `/blog/[slug]` | `blogPostMetadata` helper | from the helper | |
| `/lp/[slug]` | `title.absolute` with the `Wadi` brand | `/lp/<slug>` | `robots: noindex, nofollow` |
| `/apply*`, `/admin*` | — | — | `noindex, nofollow` |

**Gaps found:**
- `/privacy-policy` and `/terms-and-conditions` — not re-read for metadata completeness; they are hand-written and sit outside the shared helper. **Verify before launch.**
- `/offline` has no metadata and is not in the sitemap or robots — it is reachable and indexable in principle.
- No `hreflang`. Single-locale site, so correct today; it becomes relevant the moment a second `[country]` goes live.

### 8.3 Information architecture

```
/                                   brand + checker entry
├── /uae                            residence hub  ← the country silo root
│   └── /uae/visa/{10 slugs}        commercial detail pages
├── /visa-check                     informational hub
│   └── /visa-check/{35 ISO codes}  programmatic answers → CTA into /uae/visa/*
├── /blog                           content silo
│   ├── /blog/{83 posts}            → offers into /uae/visa/*
│   ├── /blog/tags, /blog/tags/{13}
│   └── /authors/{1}
└── /about /contact /faq /privacy-policy /terms-and-conditions
```

- **Geographic targeting** is URL-segment based (`/uae/...`) and schema based (`Service.areaServed = 'AE'`, `Organization.address.addressLocality = 'Dubai'`). The architecture is built for more residence countries; only `uae` is live.
- **Breadcrumbs:** `BreadcrumbList` JSON-LD on `/uae`, `/uae/visa/[slug]`, `/visa-check*`, all blog pages, authors. **Visual breadcrumbs exist only on blog pages** (verified live: the Schengen page emits `BreadcrumbList` but renders no breadcrumb UI). The visa detail page passes `breadcrumbPaths` into `VisaDetailAppPage`, which **accepts the prop and never renders it**.
- **Internal linking:** footer links all 10 visa pages + 5 Schengen countries; the mega menu links all 10 with descriptions; `/visa-check/[dest]` cross-links into the matching visa page; `VisaGuideLink` links visa sections into blog guides; `blogOffers` links posts back. The 404 page links the five main hubs.
- **Silos:** cleanly separated and deliberately cross-linked. This is the healthiest part of the SEO setup.

### 8.4 On-page

| Aspect | Finding (verified live) |
|---|---|
| H1 | Exactly one per page on every page checked. |
| Heading order | Clean on `/uae/visa/schengen`: H1 → eight H2s, with H3s only inside the process steps. Homepage: H1 → H2 sections with H3 card titles. Blog post: H1 → 13 H2s (question-shaped, matching the house GEO style). |
| Question-as-H2 | Present on blog posts and on `/visa-check/[dest]` ("Who needs a visa for France?"). |
| Hidden / collapsed content | `VisaRequirements` uses `<details>` with only the first open; `VisaFaqSection` and `/faq` use a React accordion. **In both cases the text is in the DOM and crawlable.** |
| FAQs | `FAQPage` JSON-LD on `/`, `/faq`, visa detail pages (when the CMS has FAQs), `/visa-check/[dest]` (generated, 2 entries) and blog posts. |
| Pricing on page | Package prices and a full fee breakdown table with an indicative total, plus `Offer` entries inside the `Service` schema. |
| Semantic HTML | `<header> <nav> <main> <section> <article> <footer> <table> <details> <address>` all used appropriately. `aria-label="Main"` on the tab bar, `aria-label="Breadcrumb"`, `role="tablist"`/`tab`/`tabpanel` on packages, `role="dialog" aria-modal` on the lead form. |
| Duplication risk | `/` and `/uae` overlap substantially (see §4.3). The 35 `/visa-check/*` pages share the same 238-row table and differ only in outcomes, source and notes — **thin-content risk if the rule data is sparse for a destination**. |

### 8.5 Technical

| Item | Finding |
|---|---|
| Sitemap | `src/app/sitemap.js`, ISR 3600s. **Verified live: 152 URLs** — 83 blog posts, 35 visa-check destinations, 13 tag pages, 10 visa detail pages, 1 author, `/uae`, `/blog`, `/blog/tags`, `/visa-check`, and 6 static pages. Every section is wrapped in try/catch and **fails silently to an empty array**, so a backend hiccup during revalidation can shrink the sitemap without any signal. |
| robots.txt | Verified live: `Allow: /`, `Disallow: /admin`, `Disallow: /apply`, sitemap declared. **`/lp` is not disallowed** — it relies on the page-level `noindex` only. |
| Structured data | Built by `createSchemaBuilders` in `frontend-shared/utils/schema.js`, bound to VisaWadi in `src/lib/schema.js`. Verified live graphs: homepage `Organization, WebSite, WebPage, Service, FAQPage`; visa detail `Organization, WebSite, WebPage, Service, FAQPage` + separate `BreadcrumbList`; visa-check `… WebPage, FAQPage, BreadcrumbList`; blog post `Organization, WebSite, WebPage, BlogPosting, Person, FAQPage` + `BreadcrumbList`. All parsed without error. |
| Redirects | Verified live: apex→www **308**, `/visa`→`/uae` **308**, `/visa/schengen`→`/uae/visa/schengen` **308**, `/uae/`→`/uae` **308**. |
| Trailing slash | Next default (no trailing slash), enforced by 308. |
| WWW | `www` canonical, enforced by host-matched redirect in `next.config.mjs`. |
| Image alt text | **Verified live: 14 images on the homepage, 0 missing alt; 3 on the visa page, 0 missing.** Mega-menu flag images are correctly `alt="" aria-hidden`. |
| Image optimisation | `next/image` with avif/webp; Cloudinary sources; `priority` on the first visa card and the hero; `loading="lazy"` on the rest. **One issue:** `/_next/image?url=%2Flogo-dark.png&w=2048` — the logo is requested at 2048px wide to render at ~110px, because `logoWidth={1000}` is passed with a CSS-constrained height. Same for `happy-traveler*.webp` at `w=3840`. |
| Font loading | `next/font/google`, self-hosted, `display: swap`, explicit fallback stacks. **Three families are loaded on every page; Geist Mono is only a fallback for `--font-mono` and is loaded unconditionally.** |
| Lazy loading | Images yes. **No code splitting beyond Next's defaults** — no `next/dynamic` anywhere. |
| Preconnect | `res.cloudinary.com` only. **No preconnect for `cdn.jsdelivr.net`**, which the mega menu hits for ten flag SVGs. |

### 8.6 SEO risk assessment for the redesign

| Must remain stable | Why | Difficulty |
|---|---|---|
| All 152 sitemap URLs and the 3 redirect rules | Any URL change costs the equity on 83 ranking posts and 10 commercial pages | Easy — the redesign is presentational |
| `generateMetadata` output per route | Titles/descriptions/canonicals are generated, not authored in JSX; they survive a visual rewrite **as long as the page files keep their exports** | Easy |
| JSON-LD graphs | Built in `lib/schema.js` and injected via `<script>` tags inside page components. **If a page component is replaced, the `<script>` injection must move with it.** | **Medium — easiest thing to lose** |
| Indexable copy | Every word on the visa pages comes from MongoDB (`visa.*`) or `src/config/trust.js` / `src/data/faqs.js`. **The redesign does not need to touch copy at all.** | Easy |
| `<details>` requirement sections | Content stays in the DOM. If the redesign swaps to a JS accordion that mounts content on open, that text leaves the initial HTML. | **Medium — real regression risk** |
| `VisaGuideLink` and `blogOffers` links | The commercial↔content internal link graph | Medium |
| Heading hierarchy | One H1, question-shaped H2s | Easy if specified |
| Visual breadcrumbs on blog pages | Already rendered; blog is out of scope | Easy |

**Answer to the brief's question:** yes — routes, internal links, metadata, structured data and indexable copy can all be preserved without rewriting any content, because content and presentation are already separated (CMS → props → components). The two places where that separation is thin are the JSON-LD `<script>` tags (which live inside page components) and the `<details>` elements (where presentation choice affects crawlable HTML).

**Requires external validation (not available from the repo):** current rankings, indexing coverage, impressions/clicks, Core Web Vitals field data, and whether the 83 migrated posts are all indexed. Prior audits exist at `docs/audits/VisaWadi-SEO_AUDIT-08-09-2026.md` and `docs/audits/VISAWADI-UX_AUDIT-12-09-2026.md` and include GSC-derived findings from September 2026.

---

## 9. Responsive and mobile UX analysis

**Browser-verified.** Production site, headless Chrome, three viewports.

### 9.1 Measurements

| Check | 390×844 (mobile) | 768×1024 (tablet) | 1440×900 (desktop) |
|---|---|---|---|
| Horizontal overflow | **None.** `scrollWidth === clientWidth` on `/`, `/uae/visa/schengen`, `/visa-check/fr`, `/blog/[slug]` | None | None |
| `body` overflow-x | `hidden` (set in `globals.css`) — **masks overflow rather than preventing it** | same | same |
| Desktop nav | hidden | **hidden** (switches at `lg`) | visible, 5 items |
| Bottom tab bar | visible, 59px | **visible** | hidden |
| Package selector | tabs | **tabs** | 3 cards |
| H1 size | 36px (home), hero h1 28px→52px by breakpoint | — | 52px |
| Header | `position: absolute`, scrolls away | same | **77px tall vs a 53px spacer → 24px overlap** |
| Container | 90% | 85% | 80% (~1152px), no max-width |

### 9.2 Findings

**FACT — tap targets below 44×44 on the homepage at 390px (8 elements):**

| Element | Measured |
|---|---|
| Logo link | 114×20 |
| "See all destinations" | 146×20 |
| "Talk to our team →" | 119×17 |
| Footer brand link | 351×28 |
| Footer links "France" / "Italy" / "Spain" / "Blog" | 43×44, 28×44, 35×44, 29×44 — **tall enough but narrow**, because `inline-flex min-h-11` sizes the box to the text width |

The visa detail page shows the same pattern (6 under-size targets, all links rather than buttons). Buttons and form controls are consistently `min-h-11`/`min-h-12` and pass.

**FACT — `/visa-check/[destination]` table.** 119 `<tbody>` rows × 6 columns, intrinsic width **515px inside a 390px viewport**, in a wrapper with `overflow-x: auto`. The table scrolls horizontally on every phone. Cell font 14px. The two-column pairing that makes this compact on desktop is what makes it overflow on mobile.

**FACT — `/uae/visa/[slug]` cost table** measures 349px at 390px and fits, but its wrapper is `overflow: hidden` rather than `auto`, so a longer fee label would be clipped rather than scrollable.

**FACT — three fixed layers stack at the bottom of the mobile viewport** on a visa page: tab bar (58px), sticky price bar (above it, `bottom: calc(58px + safe-area)`), WhatsApp FAB (`bottom: calc(124px + safe-area)`). Together they occupy roughly 180px of a 844px viewport. The offsets are hand-coordinated magic numbers spread across three files.

**FACT — `/uae/visa/schengen` hero at 390px** renders a five-line subheadline (`heroSubheadline` from the CMS) above the fold, pushing the CTA to roughly 900px down the page.

**FACT — forms.** `LeadFormModal` is a bottom sheet on mobile with `max-h-[90vh]` and an internally scrolling body with a pinned footer button — this is the most app-like surface already in the codebase. `inputMode="numeric"` on applicant count, correct `autoComplete` on names/email. **No `inputMode="tel"` on the phone digits field** (it is inside `PhoneInput`, not re-checked here).

**FACT — dropdowns.** `CountryPicker` and `NationalitySelect` are custom comboboxes, not native `<select>`. On mobile this means no native picker wheel.

**FACT — modal/drawer behaviour.** `MobileNavigation` renders a full-screen `fixed inset-x-0 top-0 bottom-0` white panel with its own close button; it does **not** lock body scroll (only `LeadFormModal` does).

### 9.3 Accessibility observations — static + live

| Finding | Severity |
|---|---|
| **No skip-to-content link** anywhere in the app or the shared layouts | Medium |
| **No `prefers-reduced-motion` handling**, while `* { scroll-behavior: smooth }` is global | Medium |
| `MobileNavigation` drawer: no focus trap, no body scroll lock, no `role="dialog"` | Medium |
| `Navbar` mega menu opens on `mouseenter` only — **no keyboard path to the mega-menu items on desktop**; the top-level link is focusable but the panel never opens on focus | **High** |
| `PackageSegments` tablist has correct `role`/`aria-selected`/`aria-controls` but **no arrow-key handling** | Medium |
| `StickyPriceBar` sentinel is `aria-hidden` — correct | — |
| `LeadFormModal` has `role="dialog" aria-modal`, initial focus, focus restore, Escape handling. **No focus trap** inside the dialog | Medium |
| Error text is `text-xs text-red-500` on white — **likely below 4.5:1**; not measured | Medium |
| `VisaHero` CTA is `bg-accent-500` (#F26B4E) with `text-gray-900` — passes; the same button elsewhere uses white text, which on #F26B4E is around 2.8:1 and **would fail AA** | **High** |
| Native `window.confirm()` used for discard confirmation | Low |
| Images: 0 missing alt across the pages checked | — |

### 9.4 Desktop vs mobile differences

| Surface | Mobile | Desktop |
|---|---|---|
| Nav | hamburger → full-screen accordion | mega menu + CTA button |
| Primary CTA in nav | **suppressed** (`ctaOnMobile={false}`) because the tab bar carries "Check" | "Check your visa" button |
| Packages | tablist, one at a time | 2–3 cards side by side |
| Price | sticky bar | in the cards |
| Process steps | vertical timeline with connector rules | 3-up centred with numbered circles |
| Blog offers | inline after heading 2 + mobile card grid | sticky right rail (`BlogOfferRail`) |
| Trust cards | 1-up / 2-up | 4-up |

**The mobile experience is already the more deliberate of the two.** The tab bar, sticky price bar, bottom-sheet modal and tabbed packages are all app-idiom choices someone made on purpose. The redesign brief's "mobile-app-inspired" direction is therefore an *extension* of the current trajectory, not a reversal — and the bigger opportunity may be the tablet and desktop tiers, which currently inherit phone or desktop layouts wholesale with nothing designed for 768–1023px.

---

## 10. Blog isolation strategy

### 10.1 What belongs to the blog

| Layer | Items |
|---|---|
| Routes | `/blog`, `/blog/[slug]`, `/blog/tags`, `/blog/tags/[slug]`, `/authors/[slug]` |
| Page components | `pages/client/{BlogPage, BlogPostPage, BlogTagsPage, BlogTagDetailPage, AuthorPage}` |
| Sections | `sections/v2/{BlogChipNav, BlogOfferRail, BlogTocRail, BlogRelatedPosts, BlogPosts}` |
| UI | `ui/v2/{BlogOfferCard, BlogInlineOffer, AuthorBox, ShareButtons}`, `ui/v1/BlogPaginationBar`, `cards/BlogCard` |
| Utils | `utils/articleHtml.js` (heading extraction + inline-offer splitting), `utils/cloudinary.js` |
| App config | `src/config/blogOffers.js` |
| **Styles** | **`.blog_post` — ~200 of the 317 lines in `apps/visawadi-frontend/src/app/globals.css`** |

### 10.2 What the blog shares with the rest of the site

| Shared thing | How the blog depends on it |
|---|---|
| `Providers.js` shell | Blog pages render inside the same `AppMegaLayout` — **same navbar, same footer, same mobile tab bar, same WhatsApp FAB, same `.has-tabbar` padding** |
| `Container`, `PrimarySection`, `Breadcrumb` | Layout and breadcrumbs on every blog page |
| `PageHero` (v1) | The hero on `/blog` and `/blog/tags` |
| `FaqAccordion` (v2) | Article FAQ blocks |
| Fonts | The article body carries `className="blog_post font-outfit"` — **it depends on the `--font-outfit` alias** |
| **Colour tokens** | `.blog_post` references `--color-primary-600` (links), `--color-primary-700` (link hover), `--color-primary-500` (blockquote rule), `--color-primary-200/100/50` (table borders, header fill, zebra stripes) |
| Tailwind utilities | `BlogPostPage` uses `primary-*` and `accent-*` classes for the "Short Answer" box, tag pills and offer cards |

**Verified live on `/blog/uk-visa-pakistani-passport-holders-living`:** article link colour computes to `rgb(43, 92, 176)` — exactly `--color-primary-600`. Body 15px/25.5px, `rgb(51,65,85)`; H2 27px. All of it from `globals.css`.

### 10.3 How to redesign the site without changing the blog

The component boundary is clean. **The style boundary is not.** Four leak paths, in order of likelihood:

| # | Leak | Mechanism | Containment |
|---|---|---|---|
| 1 | **Colour token change** | Any edit to `--color-primary-*` repaints blog links, blockquote rules, table chrome and the Short Answer box | Introduce a **new** token namespace for the redesign (`--color-brand-*`) and leave `--color-primary-*` untouched; or snapshot the six values the blog depends on into literal hex inside the `.blog_post` block before changing the ramp |
| 2 | **Font change** | Dropping or repointing `--font-outfit` changes the article face, because `.blog_post` inherits from `font-outfit` and from the global `*` rule | Keep `--font-outfit` pointing at whatever the blog should use; introduce new role tokens for the redesign rather than repurposing the old aliases |
| 3 | **Shared chrome change** | A new `Navbar`/`Footer`/`Container` changes the frame around every article | Build the new chrome as **new components** in the app (or new files in `frontend-shared`), and switch only the non-blog branch of `Providers.js` — see below |
| 4 | **Global element resets** | New rules on `h2`, `a`, `table`, `p` in `globals.css` cascade into `.blog_post` unless `.blog_post` wins on specificity | Scope every new reset under a redesign root class; **never add bare element selectors to `globals.css`** |

### 10.4 Isolation options — RECOMMENDATION, not implemented

**Option A — Route-group shells (recommended).** `Providers.js` already switches shells by path prefix. Add a fourth branch so that `/blog*` and `/authors*` keep the current `AppMegaLayout` + current tokens, while everything else gets the new shell. Cost: the two halves of the site look different during the migration, and the navbar differs between a blog page and a visa page. Benefit: **zero risk to the blog**, and the redesign can ship page by page.

**Option B — Token namespacing.** Keep one shell. Add `--color-brand-*`, `--font-ui-*`, etc. alongside the existing tokens; redesigned components consume only the new ones; `.blog_post` continues to consume the old ones. Cost: two live palettes. Benefit: one navigation, one footer, incremental component migration.

**Option C — Freeze the blog CSS.** Before any token work, replace the `var(--color-primary-*)` references inside `.blog_post` with their current literal hex values and move the whole block to a separate `blog.css` imported only by the blog routes. Cost: one mechanical edit. Benefit: cuts leak path 1 permanently. **This is worth doing regardless of which option is chosen.**

**Verdict: blog isolation is feasible and not difficult**, provided the team treats `globals.css` as a shared contract rather than a scratchpad. The thing that makes it feasible is that no blog component is shared with the commercial pages, and no commercial component is shared with the blog — only tokens, chrome and the two offer-link modules are.

---

## 11. Content and data architecture

### 11.1 Where each kind of content lives

| Content | Storage | Editable by | Reused across pages |
|---|---|---|---|
| Visa landing page content (hero, packages, process, requirements, pricing, whyUs, testimonials, FAQs, meta, section guides) | **MongoDB `visa` collection** via `@travel-suite/visa` | `/admin/visa` | Per-slug; 10 documents |
| Residence overrides | **MongoDB `visa-overlay` collection**, keyed `(residence, visaSlug)` | `/admin/visa` overlay form | Merged over the base by `resolveVisaForResidence` — scalars and whole lists replace, nothing deep-merges |
| Visa requirement rules (the checker) | **MongoDB `visa-rule` collection** via `@travel-suite/visa-requirements` | admin / seed scripts | 35 destination rules; each has `groups`, `residenceOverrides`, `defaultOutcome`, `officialSourceUrl`, `lastVerifiedAt` |
| Blog posts, tags, authors | **MongoDB** via `@travel-suite/blog` | `/admin/blog` (TinyMCE) | 83 posts, 13 tags, 1 author |
| Leads | **MongoDB `visa-lead`** | written by the public form, read in `/admin/visa-leads` | — |
| Residence countries | `src/config/countries.js` | code | One entry (`uae`, `isLive: true`) |
| Contact details, legal name, socials | `src/config/contact.js` | code | Footer, `/contact`, schema, nav "Email Us" |
| Trust assurances + hero trust items | `src/config/trust.js` | code | Every visa detail page and `/lp/*` |
| Homepage + FAQ-page FAQs | `src/data/faqs.js` | code | 7 + 7, hardcoded |
| Homepage benefits, how-it-works, about copy | **inline in `src/app/page.js`** | code | Homepage only |
| Blog offer mapping | `src/config/blogOffers.js` | code | Every blog post |
| Nationality list | `frontend-shared/src/data/nationalities.js` | code | Lead form |
| Country list (checker) | `frontend-shared/src/data/countries.js` | code | Checker, nationality table |
| Outcome labels/tones | `frontend-shared/src/utils/visaOutcomes.js` | code | Checker and result pages |
| Destination ordering | `DESTINATION_ORDER` in `src/app/page.js` | code | Homepage card order |

### 11.2 Reusable vs per-destination

**Reusable across all destination pages:** trust assurances, hero trust items, the testimonial subtitle, `VisaCard`'s `DEFAULT_FEATURES`, the inline CTA copy in `VisaDetailAppPage`, every section's subtitle (hardcoded in the `sections/v1/Visa*` components, templated with `countryName`).

**Per-destination (CMS):** everything else on the visa page.

**Business rule encoded in copy, not code:** the Schengen-family packages (`schengen`, `france-visa`, `germany-visa`, `italy-visa`, `spain-visa`, `greece-visa`) include a flight reservation, hotel reservation, 9 days of insurance and an itinerary. The UK/US/Canada packages offer *guidance* on the flight reservation only. This distinction lives in `packages[].features` and in the FAQ text of individual CMS documents.

### 11.3 Data that must not be touched by a UI redesign

| Data | Why |
|---|---|
| `visa.packages[]` prices, currencies, `features`, `exclusions` | Commercial terms; the Schengen/UK split above is load-bearing |
| `visa.pricingBreakdown[]` | Fees are passed through at cost; the page states this explicitly |
| `visa-rule` documents, `lastVerifiedAt`, `officialSourceUrl` | The checker's credibility claim is built on them |
| `visa.sectionGuides` | Drives `VisaGuideLink`; an internal-linking asset |
| `visa.testimonials` | Quoted from Trustpilot "as written" |
| `src/config/blogOffers.js` external link to `dummyticket365.com` | A deliberate cross-brand exception, fixed by a migration script in August 2026 |
| `src/config/trust.js` | Deliberately contains no numeric claims — a prior audit flagged unsourced stats |
| `LEGAL_NAME = "City Tours LLC"` | Appears in schema |

**Schema validation to respect:** at most 3 packages, 7 process steps, 10 requirement sections (15 items each), 15 pricing rows, 6 `whyUs`, 10 testimonials, 30 FAQs, `metaDescription` ≤ 160 chars, `excerpt` ≤ 200. A redesign that assumes "exactly 3 packages" or "always 4 trust cards" will break on a CMS edit.

### 11.4 Feature flags

There is no flag system. The closest things are `countries.js` `isLive`, `visa.status === 'published'`, `VisaOverlay.isPublished`, `VisaRule.isPublished`, `servicedSlugs` (hardcoded in the backend composition root) and `testimonial.isFeatured`.

---

## 12. Analytics, performance and accessibility

### 12.1 Analytics stack — FACT

Initialised by `components/shared/AnalyticsInit.js`, mounted in `Providers.js` for public and LP routes. **All four tools are deferred to `requestIdleCallback` (1200ms `setTimeout` fallback) and are skipped entirely when `NODE_ENV !== 'production'` or the path starts with `/admin`.**

| Tool | Env var | Notes |
|---|---|---|
| GA4 (`react-ga4`) | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | `ReactGA.initialize()` only — **pageviews are auto-tracked; there is deliberately no manual route-change wiring** |
| Microsoft Clarity | `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Session recording / heatmaps. Set in all three env files. |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | Set in `.env.build` only |
| OpenAI pixel (ChatGPT Ads) | `NEXT_PUBLIC_OPENAI_PIXEL_ID` | `oaiq` SDK; `page_viewed` on init |
| Attribution capture | — | `utils/attribution.js` stores first/last touch in `localStorage` for 90 days: utm_*, gclid, gbraid, wbraid, fbclid, msclkid, ttclid, oppref; ignores Stripe/PayPal/Google referrers |

**No Google Tag Manager. No frontend Sentry. No cookie consent banner or CMP of any kind** — every tag fires on load with no opt-in gate. (The word "consent" appears in the codebase only inside the terms-and-conditions copy.)

**Custom events on the public site — there are exactly two:**

| Event | Fired by | Parameters |
|---|---|---|
| `lead_form_open` | `trackVisaLeadOpen` in `VisaDetailAppPage` | `visa_slug`, `package`, `lead_source` |
| `generate_lead` | `trackVisaLeadSubmit` in `LeadFormModal` | `visa_slug`, `package`, `applicant_count`, `lead_source` |

Plus `pixelEvent('Lead', …, 'visa-lead:<id>')`, `openaiLeadCreated({ eventId })` with the same deduplication id, and `reportWhatsappClick` → `/api/openai-events`. Server-side the backend additionally uploads the lead to Meta CAPI, OpenAI CAPI and Google Ads.

**No event is fired for:** visa-checker submissions, package tab switches, blog offer clicks, phone/email clicks, scroll depth. **RECOMMENDATION:** the checker is the primary top-of-funnel interaction and is currently invisible in GA4. See also `docs/analytics-visa-lead-tracking.md`, which describes a planned Phase 2 for offline revenue attribution.

**Redesign constraint:** `trackVisaLeadOpen`, `trackVisaLeadSubmit`, `pixelEvent`, `openaiLeadCreated`, `getMetaBrowserIds()` and `reportWhatsappClick` must all survive, with the same `source` string vocabulary (`hero_cta`, `sticky_bar`, `package_card`, `inline_cta`, `final_cta`) — those strings are segmentation dimensions in GA4 and changing them breaks historical comparison.

### 12.2 Performance — code-level observations only

**No measurements are reported here.** Lighthouse was not run and field data is unavailable.

| Observation | Assessment |
|---|---|
| Server components by default; client bundles limited to nav, checker, modal, sticky bar, tab bar | Good |
| Analytics deferred to idle | Good |
| `next/font` self-hosting with `swap` and explicit fallbacks | Good |
| **Three font families** loaded on every page, one of which (Geist Mono) is only a fallback | Avoidable weight |
| `lucide-react` present at **two different major versions** across the app and the shared package | Possible duplicate bundle |
| `frontend-shared` depends on `mapbox-gl`, `@turf/*`, `recharts`, `@tinymce/tinymce-react` | Admin-only, but they are dependencies of a package the public app transpiles — worth confirming they tree-shake out |
| **No `next/dynamic` anywhere** | `LeadFormModal` (465 lines + react-hook-form + libphonenumber-js) ships with every visa page even though it is closed by default — **the clearest code-splitting opportunity on the site** |
| `/_next/image?url=%2Flogo-dark.png&w=2048` | The logo is fetched at 2048px to render at ~110px. Same pattern for `happy-traveler*.webp` at `w=3840`. **Fix the `width`/`height` props, not the images.** |
| Mega-menu flags load from `cdn.jsdelivr.net` with no preconnect | Third-party on the nav path |
| `VisaHero` uses a `fill` Cloudinary image with `priority` | Likely LCP element on visa pages; correct treatment |
| `/visa-check/[destination]` renders a 238-row table | Measured 1,283 DOM nodes on `/visa-check/fr` — large but not extreme |
| `dangerouslySetInnerHTML` for article HTML | No hydration cost; fine |
| Layout shift risks | The `absolute` header with a short spacer, and the `StickyPriceBar` appearing on scroll, are both candidates. Not measured. |

### 12.3 Accessibility summary

Consolidated from §9.3. Ranked:

1. **Mega menu is mouse-only** — no keyboard access to ten nav destinations on desktop. (They are reachable via the footer, so it is not a dead end, but it is a WCAG 2.1.1 failure.)
2. **`bg-accent-500` with white text** (`PackageSegments`, `StickyPriceBar`) is roughly 2.8:1 — fails AA for normal text. The same colour with `text-gray-900` in `VisaHero` passes.
3. **No skip link.**
4. **Mobile nav drawer**: no focus trap, no scroll lock, no dialog role.
5. **Lead modal**: no focus trap (has focus-in, focus-restore, Escape).
6. **No `prefers-reduced-motion`** with global smooth scroll and translate-on-hover cards.
7. **Narrow tap targets** on text links (§9.2).
8. **Package tablist** has no arrow-key support.
9. Error text contrast (`text-xs text-red-500`) unverified and likely marginal.

All nine are fixable within a redesign at near-zero marginal cost if they are written into the component specs up front.

---

## 13. Redesign risks and protected functionality

### 13.1 Protected list

| # | Must be preserved | Where it lives |
|---|---|---|
| 1 | All 152 public URLs | `sitemap.js` + route files |
| 2 | The three redirect rules | `next.config.mjs` |
| 3 | `generateMetadata` / `metadata` exports on every route | each `page.js` |
| 4 | JSON-LD `<script>` injection per page | page components + `lib/schema.js` |
| 5 | Indexable copy in initial HTML, including inside accordions | `<details>` in `VisaRequirements` |
| 6 | Blog article and listing appearance | `.blog_post` in `globals.css` + blog components |
| 7 | `POST /api/visa-leads` payload shape | `LeadFormModal` → `useCreateVisaLead` |
| 8 | GA4 / Meta / OpenAI event names, parameters and `source` vocabulary | `utils/analytics.js`, `pixel.js`, `openaiPixel.js` |
| 9 | `getMetaBrowserIds()` in the lead payload and `eventId` dedup keys | `LeadFormModal` |
| 10 | `reportWhatsappClick` on the final-CTA WhatsApp button | `VisaFinalCta` |
| 11 | Honeypot `website` field | `LeadFormModal` |
| 12 | Phone validation via libphonenumber, nationality from the **static** list | `LeadFormModal` — switching to `useGetNationalities` hits the insurance domain, which this backend does not mount, and yields a silently unsubmittable form |
| 13 | Package/pricing display rules, including "indicative total" and the at-cost disclaimer | `PackageSegments`, `VisaPricingBreakdown` |
| 14 | Checker outcome resolution: residence override → nationality group → default | `lib/visaCheck.js`, `useVisaCheck` |
| 15 | Source + "last checked" attribution on every checker answer | `visa-check/[destination]/page.js`, `VisaCheckerInline` |
| 16 | `VisaTrust`'s de-duplication heuristic | `sections/v1/VisaTrust.js` |
| 17 | `VisaGuideLink` and `blogOffers` internal links | both files |
| 18 | `/apply*` reachability (the reminder cron emails these URLs) | route files |
| 19 | `/lp/[slug]` noindex + brand scrubbing | `lp/page.js`, `lib/lp.js` |
| 20 | Safe-area insets and the tab bar / price bar / FAB offset stack | `globals.css`, three components |
| 21 | Service-worker cache version bump on release | `public/sw.js` |
| 22 | Admin section untouched | `src/app/admin/**` |
| 23 | Other brands' use of `Navbar`, `Footer`, `Hero`, `PageHero`, `BlogPostPage`, `Container` | `packages/frontend-shared` |

### 13.2 Ranked risks

| Risk | Level | Why it matters | Mitigation |
|---|---|---|---|
| **Editing shared `frontend-shared` components in place** breaks travl, dt365, mdt, thedt, emirateslimo — none of which have tests | **HIGH** | `Navbar`, `Footer`, `Hero`, `PageHero`, `Container`, `BlogPostPage` are consumed by up to six apps | Create new components (`v3/` or app-local) and switch VisaWadi's imports; never modify a shared file that another app imports |
| **Token changes leaking into blog articles** | **HIGH** | `.blog_post` consumes six `--color-primary-*` values and the `--font-outfit` alias | Freeze `.blog_post` to literal values, or namespace new tokens (§10.4) |
| **Losing JSON-LD** when page components are replaced | **HIGH** | The `<script type="application/ld+json">` tags are hand-placed inside page bodies; a rewritten component silently drops them, and nothing fails | Make schema injection part of the new layout primitive; add a post-deploy crawl that asserts each template's expected `@type` set |
| **Breaking the lead form's event/payload contract** | **HIGH** | It is the only conversion. Google Ads and Meta optimisation depend on CAPI dedup ids | Restyle `LeadFormModal`; do not rewrite its submit path |
| **Moving content out of initial HTML** (JS accordions, tabs that mount on demand, client-only sections) | **HIGH** | Would remove requirement lists and FAQ answers from the crawlable page | Keep `<details>` or render all panels and hide with CSS |
| **URL or trailing-slash changes** | **HIGH** | 83 ranking posts, 10 commercial pages, 35 programmatic pages | Treat routes as frozen |
| **Removing the `--font-outfit` alias while `font-outfit` classes remain** | **MEDIUM** | ~40 components carry the class; they would fall back to `sans-serif` | Remove classes and alias in the same change, or keep the alias |
| **Removing the unlayered `*` font rule without auditing** | **MEDIUM** | It is why `.font-mono` is re-declared; other rules may depend on it | Safe for VisaWadi alone (`globals.css` is per-app) but verify the mono figures still render |
| **Service-worker staleness** | **MEDIUM** | Returning visitors get cached old HTML | Bump `VERSION` in `sw.js` on release |
| **Package-count assumptions in a new pricing layout** | **MEDIUM** | Schema allows 1–3 packages; overlays can change the count per residence | Design for 1, 2 and 3 |
| **Regressing the three-layer fixed bottom stack** | **MEDIUM** | Overlapping CTAs on phones | Centralise the offsets in CSS variables |
| **Losing `VisaTrust`'s de-dup heuristic** | **MEDIUM** | Duplicate trust cards reappear on every visa page | Port the function as-is |
| **Tablet (768–1023px) regressions** | **MEDIUM** | Nothing is designed for this range today; a redesign will expose it | Add a real `md` tier deliberately |
| **Build-time backend dependency** | **MEDIUM** | `generateStaticParams` swallows failures; a bad build ships a site with no visa pages | Add a build assertion that the visa list is non-empty |
| **Accessibility regressions** | **MEDIUM** | Nine known issues already; a rebuild can add more or fix them all | Write the nine into the component specs |
| **Analytics event drift** (renamed `source` strings) | **MEDIUM** | Breaks GA4 segmentation continuity | Freeze the vocabulary |
| **`/lp/*` divergence** | **LOW** | It uses `pages/client/VisaDetailPage`, a *different* composition from `VisaDetailAppPage`. Redesigning one and not the other leaves two visually different visa pages | Decide early whether `/lp` follows the redesign |
| **Orphaned components** (`VisaPackages`, `VisaStickyCta`) | **LOW** | Wasted effort if someone redesigns them | Delete or ignore |
| **Legal pages unreviewed** | **LOW** (for design) | Adapted from another brand; flagged as needing a lawyer | Out of design scope, but do not let a redesign imply they were reviewed |

---

## 14. Implementation readiness

**1. Is the codebase well structured enough for a full visual redesign?**
Yes, with one qualification. Content and presentation are already separated (MongoDB → props → components), routing and metadata are generated rather than hand-authored, and there is no component library or CSS-in-JS to unwind. The qualification is that there is **no design system to extend** — the redesign has to create one, and it has to create it in a file (`globals.css`) that the blog also reads from.

**2. Which components should be redesigned first?**
In dependency order:
1. **Tokens** — a new namespace in `globals.css`, plus the `.blog_post` freeze.
2. **Layout primitives** — `Container` (app-local replacement with a max-width), a real `Section` with the `py-section` rhythm, a `SectionHead`.
3. **`VisaCard`** — smallest self-contained unit, appears on two of the three commercial templates, VisaWadi-only.
4. **`PackageSegments`** — highest conversion leverage, VisaWadi-only, already the most app-like component.
5. **`LeadFormModal`** — restyle only; the submit path is frozen.
6. **`VisaDetailAppPage` + the eleven `sections/v1/Visa*`** — the main template, all VisaWadi-only.
7. **Navbar / Footer / tab bar** — last, because they are shared and because they frame the blog too.

**3. Which templates could share reusable components?**
- `/`, `/uae`, `/visa-check`, `/visa-check/[dest]` all open with the same dark hero pattern, written four times. **One hero component.**
- `/`, `/uae` both render a `VisaCard` grid. **One destination grid.**
- `/uae/visa/[slug]` and `/lp/[slug]` are the same page with different copy. **One template, two compositions.**
- `/about`, `/contact`, `/faq`, `/privacy-policy`, `/terms-and-conditions` are five one-off prose pages. **One content-page layout.**
- `/visa-check/[dest]` and `/uae/visa/[slug]` share nothing today but could share the CTA block, the trust strip and the source/verified footer.

**4. Biggest implementation constraints?**
In order: (a) `frontend-shared` is consumed by six other travel brands plus Picturesk's admin UI, and has no tests; (b) `globals.css` is simultaneously the design-token file and the blog stylesheet; (c) the unlayered `*` font rule and the `--font-outfit` alias that ~40 components depend on; (d) no test coverage of any kind for this app; (e) `Container` has no max-width and is shared by all seven brands.

**5. Can a new design system coexist with the blog?**
Yes — see §10.4. Token namespacing (Option B) plus freezing `.blog_post` (Option C) achieves it without route-level forking. Route-group shells (Option A) is the zero-risk fallback if the team wants the blog completely sealed.

**6. Dependencies that might limit the visual direction?**
Very few. There is **no animation library**, so "smooth, purposeful micro-interactions" needs a decision: CSS/Tailwind only, or add Motion (~34 kB gz) with `prefers-reduced-motion` handling. `lucide-react` at two major versions should be unified before iconography is standardised. The flag SVGs come from a third-party CDN. Tailwind v4's CSS-first config is a help, not a constraint. Nothing in the stack blocks a rounded, card-based, app-like direction — the existing radii vocabulary is already `xl`/`2xl`/`3xl`/`full`.

**7. Are there significant SEO risks?**
Four, all manageable and all listed in §13.2: lost JSON-LD, content moved out of initial HTML, URL changes, and metadata exports dropped during component rewrites. None is intrinsic to redesigning; each is a thing a careless rewrite does. The mitigation is a post-deploy crawl that asserts, per template: one H1, a canonical, the expected `@type` set, and the presence of known body strings.

**8. What needs browser-based visual verification?**
- The 24px header/spacer overlap at every breakpoint.
- The 768–1023px band on every template (currently undesigned).
- The three-layer fixed bottom stack on a notched device.
- `/visa-check/[dest]`'s 238-row table at 390px.
- The lead modal as a bottom sheet with the keyboard open.
- Blog article rendering before and after any token change (the regression canary).
- Long-content cases: a five-line CMS `heroSubheadline`, a 15-item requirement section, a 30-FAQ visa page, a 1-package visa.
- Contrast on `bg-accent-500` wherever white text is used.

**9. What key information is still missing?**
See §15.

**10. What must be decided before design begins?**
See §15.2.

### 14.1 Existing documentation found

| Document | Content |
|---|---|
| `CLAUDE.md` (repo root) | Monorepo conventions, brand list, house style for copy, the no-comments rule |
| `apps/visawadi-frontend/CLAUDE.md` | VisaWadi scope, route map, the Schengen-vs-UK package distinction, the deliberate cross-brand links, known gaps. **Partly stale:** it does not mention `/visa-check`, `/lp`, `/authors`, `/offline`, the PWA or `MobileTabBar` |
| `apps/visawadi-backend/CLAUDE.md` | Mounted domains, Cloudinary namespaces, the reminder cron, the Stripe-webhook ordering constraint |
| `apps/visawadi-frontend/README.md` | Setup and route tables. **Stale:** lists `/visa` and `/visa/[slug]` as live and says the logo and og-image are still placeholders |
| `docs/audits/VisaWadi-SEO_AUDIT-08-09-2026.md` | Full SEO/AEO/GEO audit with GSC data, Sept 2026 |
| `docs/audits/VISAWADI-UX_AUDIT-12-09-2026.md` | Full UX/conversion audit with browser evidence, Sept 2026 |
| `docs/analytics-visa-lead-tracking.md` | Phase 1 `generate_lead` shipped; Phase 2 offline revenue attribution planned |
| `docs/VISA-APPLICATIONS.md` | The `/apply` document-upload system |
| **No design documentation** | No brand book, no component catalogue, no Figma reference in the repo |

---

## 15. Open questions and unknowns

### 15.1 Unknown from the repository — requires external data

1. Current organic performance: rankings, impressions, clicks, CTR by template. **GSC access needed.**
2. Indexing coverage — are all 152 sitemap URLs indexed? Are the 35 checker pages indexed or treated as thin?
3. Core Web Vitals field data (CrUX / GA4). No Lighthouse run was performed and none is reported.
4. Actual mobile/tablet/desktop traffic split, and device models.
5. Lead conversion rate by `lead_source`, and which of the six modal entry points actually converts. **The data exists in GA4 today.**
6. Checker usage volume — currently untracked entirely.
7. Whether Clarity recordings show the known friction points.
8. Which paid channels drive `/lp/*` and how much traffic it carries.
9. Whether the legal pages have been through the lawyer review flagged in `CLAUDE.md`.
10. Whether `ADDRESS` / `GMB_URL` will be populated (the footer address block and a `LocalBusiness` schema opportunity both depend on it).

### 15.2 Decisions needed before design starts

1. **Blog isolation strategy** — route-group shells, token namespacing, or both? This determines whether the new navbar appears on blog pages.
2. **Does `/lp/[slug]` follow the redesign?** It is a separate composition of the same sections and will visibly diverge otherwise.
3. **Tablet.** Does 768–1023px get a designed tier, or does the phone layout continue to extend to 1024px?
4. **Is the header sticky in the new design?** Today it is not, on any viewport. This is the single biggest navigation change available.
5. **Does the bottom tab bar stay**, and if so, does it extend to tablet? It currently costs 58px of every mobile viewport on every page.
6. **Brand colours.** The brief says the identity is undecided. The cobalt/coral ramp is documented and reasoned; if it changes, four files change (`globals.css`, `layout.js`, `manifest.json`, backend `routes/index.js`) and the blog freeze must happen first.
7. **Animation library** — Tailwind/CSS only, or add Motion?
8. **`/` vs `/uae`** — do they keep separate jobs, or does one absorb the other? (A merge is a URL change; see risk table.)
9. **Lead form length.** Eight fields for a free consultation. Shortening it changes the `visa-lead` payload and the admin workflow, so it is a product decision, not a design one.
10. **Checker result presentation** — stay with a full page navigation and a 238-row table, or move to an inline answer with the table behind a disclosure?
11. **`v3` or app-local?** Where do the new components live — a new `components/*/v3/` generation in `frontend-shared`, or `apps/visawadi-frontend/src/components/`? This decides whether other brands can adopt the system later.
12. **Scope of the icon unification** — one `lucide-react` version, and does `react-icons` go away?

---

## 16. Recommended next discovery steps

1. **Resolve the working-tree diff** on the seven modified files, especially whether `VisaQualifiers` is in or out. Design should start from a known state.
2. **Pull 90 days of GA4 and GSC** for: `lead_form_open` → `generate_lead` by `lead_source` and `visa_slug`; landing-page performance by template; device split. This converts most of §15.1 into fact and will tell you which of the six CTA entry points to keep.
3. **Watch ten Clarity sessions** on `/uae/visa/schengen` at mobile width — specifically whether the sticky price bar or the tab bar gets tapped, and where people abandon the modal.
4. **Run Lighthouse against production** for all three commercial templates plus one blog post, and record the numbers. This report deliberately contains none.
5. **Build the "blog canary"**: screenshot `/blog/[slug]` at 390 and 1440 now, and diff after every token change.
6. **Write the template contract crawler**: for each of the 13 public templates, assert one H1, a canonical, the expected JSON-LD `@type` set, and a known body string. Run before and after every deploy. This is the cheapest substitute for the tests the app does not have.
7. **Inventory the `font-outfit` class** across `frontend-shared` and the app (`grep -r "font-outfit"`), so the alias removal can be planned as one change.
8. **Decide the component home** (`v3` vs app-local) and create one example component end to end — `VisaCard` is the right candidate — to validate tokens, Tailwind `@source` scanning, and the isolation strategy before scaling up.
9. **Audit the 10 visa CMS documents** for content extremes: longest subheadline, most requirement items, fewest packages, most FAQs. Design against the extremes, not the Schengen page.
10. **Confirm with the owner**: brand colours, blog isolation option, `/lp` scope, sticky header, tab bar — the five decisions in §15.2 that block layout work.

---

*End of discovery. No source file was modified. No design or implementation work has begun.*
