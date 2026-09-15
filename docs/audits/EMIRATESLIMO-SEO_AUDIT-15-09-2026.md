# Emirates Limo SEO / AEO / GEO Audit

Date: 15 September 2026
Site: https://www.emirateslimo.com
Apps: `apps/emirateslimo-frontend` (Next 16.2.1, App Router), `apps/emirateslimo-backend` (Express 5, Mongoose 9)

## Environment audited

| Item | Value |
|---|---|
| Branch / commit | `master` @ `202268a` (working tree, uncommitted changes in other apps only) |
| Frontend | started by the audit at http://localhost:3100 with `NEXT_PUBLIC_BRAND=emirateslimo`, `NEXT_PUBLIC_BACKEND_URL=http://localhost:3101` |
| Backend | started by the audit at http://localhost:3101 (`PORT=3101`, `CORS_ORIGINS=http://localhost:3100`) |
| Production | reachable; used for redirects, `robots.txt`, `sitemap.xml`, asset weights and four spot-checked pages |
| Database | **dev and prod `.env` point at the same Mongo URI and database (`emirateslimo`).** There is no rehearsal environment. Any follow-up script that writes runs against production. |
| Pre-existing servers | ports 3000 (mdt-frontend) and 3001 (picturesk-backend) belong to other sessions and were not touched |

Note for whoever runs the app locally next: `apps/emirateslimo-frontend/.env.development` sets `NEXT_PUBLIC_BRAND=airportrides`. The audit overrode it. `.env.build` and `.env.production` are correct.

## Instruments

| Instrument | Status |
|---|---|
| Real browser | **No.** `chrome-devtools` MCP failed to connect. Core Web Vitals, LCP/CLS/INP, tap targets, hydration behaviour and visual rendering are **not measured**. Anything below about performance is inferred from payload sizes, not from a render. |
| GSC export | **None provided.** Phase 6 skipped. Query, impression and click data is absent; nothing here is based on traffic. |
| Analytics | GA4 is configured (`G-9FH4BVPKVE`) but never initialised in the app (see T-9), so there is no behavioural data either. |
| Live rendered HTML | Yes. All 26 public routes fetched from the local server and parsed; 4 pages, both crawl files, and 7 redirect cases fetched from production. |
| Backend API | Yes. `/api/blogs` and `/api/vehicles` queried against the live (shared) database. |
| Codebase | Yes. Full read of `src/app`, `src/data`, `src/components`, `next.config.mjs`, brand config. |

Known symptom: none given. Treated as a baseline audit.

## Inferred house facts (please correct)

These are inferred from config, copy, terms and the live vehicle collection. Contradictions between them are findings, not typos, and are listed in Phase 2.

| Fact | Where it comes from | Conflicts found |
|---|---|---|
| Brand: Emirates Limo, Dubai, UAE. Legal entity in footer: "TRAVL Technologies". `legal.companyName` in config: "Emirates Limo". | config, Footer | Footer and config disagree on the legal name |
| Phone +971 56 996 4924, contact@emirateslimo.com, A Block, Abraj Al Mamzar, Dubai | Footer, schema, contact page, WhatsApp CTA | Consistent everywhere |
| Fleet (live DB, 6 vehicles): BMW 7-Series, GMC Yukon, Kia Carnival, Lexus ES300, Mercedes-Benz S-Class, Mercedes-Benz V-Class | `/api/vehicles` | `brandFaqs` also lists a Toyota Highlander, which does not exist in the fleet |
| Pricing is per vehicle: base AED 100 (S-Class AED 400) plus AED 2 to 10/km; hourly from AED 150 to 300 for hour 1 | `/api/vehicles` pricing | No page publishes a price. Every `Service` schema has an `Offer` with currency and no price. |
| Airport waiting time: 60 min free | terms, FAQs, hero | Consistent |
| Non-airport waiting time | terms 15 min, `brandFaqs` 15 min | `chauffeurFaqs` says 20 min |
| Cancellation | Terms: 12 hours or more "may be eligible for a partial or full refund depending on operational commitments"; within 12 hours non-refundable; payments otherwise non-refundable | Home and 8 landing pages: "100% refund when you cancel at least 24 hours before"; `chauffeurFaqs`: "24 hours or more, full refund"; hero trust strip: "Free Cancellation" |
| Service area: Dubai, Abu Dhabi, Sharjah | LocalBusiness schema, brandFaqs | `dubaiTransferFaqs` adds Ras Al Khaimah, Ajman "and other Emirates" |
| 24/7 operation, flight tracking, meet and greet with name board, child seats on request, Stripe payment | FAQs, terms | Consistent |
| Blog: 0 published posts. No blog automation target for this brand in `automations/targets`. | `/api/blogs`, `automations/` | The site still advertises "From Our Blog" on the homepage and "Blog" in the footer |

## Executive summary

| Bucket | Score | Weight |
|---|---|---|
| Technical SEO | 48 / 100 | 30% |
| On-page SEO | 56 / 100 | 20% |
| Content and Blog | 22 / 100 | 20% |
| AEO / GEO | 41 / 100 | 20% |
| Internal Linking | 58 / 100 | 10% |
| **Overall (weighted)** | **44 / 100** | |

Read the number as "fundamentals with several live bugs", not as a traffic verdict. There is no GSC or GA4 data, so nothing here says how the site is performing in search; it says how ready it is to. The domain age is unknown to the audit and is not scored.

Why the score sits where it does, in one paragraph: the indexable surface is 19 landing and utility pages that are technically well formed (canonicals, robots meta, OG, Service and FAQ schema on every service page) but structurally thin, 83 to 93 percent shared with each other, and carrying policy claims that contradict the site's own terms. The crawl files served in production are stale static copies that shadow the Next route handlers. The blog, which is the only realistic engine for AI citation and long-tail rankings, has zero posts, an empty homepage section, a post template that cannot render in Next 16, and a listing frozen at build time. Analytics is wired but never switched on, so none of this can be measured after fixing.

### Top 10 fixes

| # | Fix | Serves |
|---|---|---|
| 1 | Fix `params` access in `blog/[slug]/page.js` (Next 16 async params); every post URL currently 404s | Rankings, AI |
| 2 | Delete `public/robots.txt` and `public/sitemap.xml` so `app/robots.js` and `app/sitemap.js` actually serve; prod sitemap is frozen at 05 Feb 2026 and can never list posts | Rankings |
| 3 | Reconcile the cancellation policy: pages promise 100% refund at 24h, terms say 12h and "may be eligible" | Conversion, AI trust |
| 4 | Fix the double brand suffix in titles (`… | Emirates Limo | Emirates Limo`) on 17 pages | Rankings, CTR |
| 5 | Call `initializeGA()` (and load the Meta Pixel base code, or remove the pixel calls); no GA4 data exists today | Measurement |
| 6 | Add ISR (`export const revalidate`) to `/blog` and `blog/[slug]`; both are `force-cache` at build, and the build container cannot reach the API, so the listing is permanently empty | Rankings, AI |
| 7 | Write a unique intro section (150 to 250 words, verdict first) and a page-specific FAQ set for each of the 12 service pages; currently 7 to 17 percent unique | Rankings, AI |
| 8 | Link `/dubai-airport-transfer-to-hotel` and `/abu-dhabi-airport-to-dubai-transfer` from somewhere; both have zero inbound internal links | Rankings |
| 9 | Publish prices: put "from AED x" on service pages and fill `Offer.price` in the Service schema from live vehicle pricing | Conversion, AI |
| 10 | Server-render the fleet on `/fleet` and the homepage; vehicle names, capacities and images are client-only today | Rankings, AI |

## Phase 0: Stack and route inventory

Next 16.2.1 App Router, `output: "standalone"`, `images.unoptimized: true`, `trailingSlash: false`, Turbopack dev. No middleware/proxy file; the apex redirect lives in `next.config.mjs`. All metadata is static per page except the blog post template. JSON-LD is hand-rolled per page plus a sitewide `SitewideSchema` component in the root layout.

| Route | Type | Robots meta | In sitemap (prod static) | In sitemap (app/sitemap.js) |
|---|---|---|---|---|
| `/` | home | index | yes | yes |
| `/dubai-airport-transfer` | service | index | yes | yes |
| `/dubai-airport-transfer-to-hotel` | service | index | yes | yes |
| `/abu-dhabi-airport-transfer` | service | index | yes | yes |
| `/abu-dhabi-airport-to-dubai-transfer` | service | index | yes | yes |
| `/chauffeur-service` | service | index | yes | yes |
| `/chauffeur-service-abu-dhabi` | service | index | yes | yes |
| `/hourly-chauffeur` | service | index | yes | yes |
| `/car-hire-with-driver-dubai` | service | index | yes | yes |
| `/limo-service-dubai` | service | index | yes | yes |
| `/dubai-transfer` | service | index | yes | yes |
| `/abu-dhabi-to-dubai-transfer` | service | index | yes | yes |
| `/dubai-to-abu-dhabi-transfer` | service | index | yes | yes |
| `/services` | hub | index | yes | yes |
| `/fleet` | hub | index | yes | yes |
| `/about-us` | company | index | yes | yes |
| `/contact-us` | company | index | yes | yes |
| `/frequently-asked-questions` | FAQ | index | yes | yes |
| `/blog` | listing | index | **no** | yes |
| `/blog/[slug]` | post | index | **no** (0 posts, and static file cannot list them) | yes when API reachable |
| `/blog/tags` | listing | **noindex,nofollow** | no | **yes** (contradiction) |
| `/terms-and-conditions` | legal | **noindex,follow** | **yes** (contradiction) | **yes** (contradiction) |
| `/privacy-policy` | legal | index | yes | yes |
| `/payment` | transactional | noindex,nofollow | no | no |
| `/book/select-limo`, `/book/booking-details` | funnel | noindex,nofollow, robots Disallow | no | no |
| `/admin/*` | admin | not disallowed in prod robots.txt | no | no |
| unknown path | 404 | noindex, real 404 status | | |

## Phase 1: Technical SEO

### 1.1 Crawl files (live bug)

`public/robots.txt` and `public/sitemap.xml` exist alongside `src/app/robots.js` and `src/app/sitemap.js`.

- Locally, both `/robots.txt` and `/sitemap.xml` return **HTTP 500** ("A conflicting public file and page file was found").
- In production the static `public/` copies are served (verified: prod `/sitemap.xml` has `lastmod 2026-02-05` on every URL and 20 entries; `app/sitemap.js` would emit `new Date()` and 21 static entries plus posts). The route handlers are dead code in prod.
- Consequences: the sitemap can never include blog posts; every `lastmod` is a seven-month-old constant, so Google will learn to ignore it; `/blog` is not in the sitemap; `/terms-and-conditions` is in the sitemap while carrying `noindex`; prod `robots.txt` does not disallow `/admin/` (the route handler does).

Fix: delete the two `public/` files. Then fix the route handlers: remove `/blog/tags` (noindex) and `/terms-and-conditions` (noindex) from `sitemap.js`, and stop emitting `lastModified: new Date()` for static pages (use a real per-page date or omit the field).

### 1.2 Redirects and canonicalisation (verified on production)

| Request | Result |
|---|---|
| `http://emirateslimo.com/` | 301 → `https://emirateslimo.com/` → 308 → `https://www.emirateslimo.com/` (two hops) |
| `https://emirateslimo.com/` | 308 → www |
| `http://www.emirateslimo.com/` | 301 → https |
| `/dubai-airport-transfer/` (trailing slash) | 308 → no slash |
| unknown path | true 404 with `noindex` |

Sound. The two-hop apex chain is worth collapsing at the edge (Fly/Cloudflare) if convenient, but is not a ranking problem. Every indexable page emits a self-referencing absolute canonical that matches the sitemap URL. `/blog/tags` has no canonical (noindex anyway).

### 1.3 Rendering

- Service pages, FAQs, legal, about, contact: fully server-rendered. Metadata, JSON-LD, H1 and copy all present in raw HTML.
- **Fleet is client-only.** `Fleet.js` and `FleetClient.js` fetch via `useGetVehicles()`. In prod `/fleet` HTML the only occurrences of vehicle names are in the meta description. `/fleet` ships 150 words of visible text. Googlebot will render it in the second wave; most AI crawlers will not.
- **Homepage "From Our Blog" is client-only** and, with zero posts, renders a heading over an empty slider.
- `/blog` and `/blog/[slug]` use `fetch(…, { cache: 'force-cache' })` with no `revalidate`. They are generated once at build. The Dockerfile's own comment in `sitemap.js` says the build container "usually can't reach" the backend. So `/blog` is a permanently empty page until the next deploy that happens to reach the API. `sitemap.js` got `revalidate = 3600` for exactly this reason; the blog pages did not.

### 1.4 Blog post template cannot render (live bug, confirmed by code and dev log)

`src/app/(main)/blog/[slug]/page.js` reads `params.slug` synchronously in both `generateMetadata` and the page component. In Next 16.2.1 `params` is a plain Promise with no property shadowing (checked `next/dist/server/request/params.js`: `makeUntrackedParams` returns `Promise.resolve(underlyingParams)`; only the dev proxy logs the warning). `params.slug` is therefore `undefined`, `fetchPostBySlug(undefined)` returns null, and the page calls `notFound()`. Dev log during the audit:

```
Error: Route "/blog/[slug]" used `params.slug`. `params` is a Promise and must be unwrapped with `await` or `React.use()` …
GET /blog/some-post 404
```

Every post URL will 404 in production the moment a post is published. Not observable on the live site today only because there are no posts. Fix: `const { slug } = await params;` in both functions.

### 1.5 Performance (inferred, not measured)

- Homepage in prod: 23 JS/CSS assets, **1.26 MB uncompressed** JS+CSS. Not measured post-gzip, and no LCP/INP measured. For a marketing page whose above-the-fold is a form, this is heavy but not unusual for a Next + Swiper + Mapbox + TinyMCE dependency set. Worth checking whether Mapbox and TinyMCE (admin-only) leak into public chunks.
- **Four font families** loaded in the root layout: Outfit Variable, Inter Variable, DM Sans Variable, and Google Sans in 4 weights. The prod CSS has 111 `woff2` references and 100 `font-family: Google Sans` rules. Only Outfit and Inter appear in the page CSS more than twice. Drop DM Sans and Google Sans unless something uses them.
- Images are webp and small (hero 82 KB, service cards 23 KB, logo 3 KB). `images.unoptimized: true` means no responsive `srcset`; acceptable at these sizes.
- Hero image is a CSS background (not an `<img>`), so no `fetchpriority` hint. Unverified whether it is the LCP element.

### 1.6 Structured data

Every page carries `LimousineService` + `WebSite` from the root layout. Service pages add `Service` + `BreadcrumbList` + `FAQPage`. Blog pages add a second `@graph` with `Organization` + `WebSite` + `WebPage` + `Blog`/`BlogPosting`.

Issues:

| Issue | Where | Detail |
|---|---|---|
| Two `WebSite` entities | `/blog`, `/blog/*` | Root layout emits `WebSite` without `@id`; `buildWebsite()` emits `WebSite @id …/#website` with `publisher → #organization`. Two entities, no link between them. |
| Two business entities | sitewide vs blog | `LimousineService @id …/#localbusiness` in layout vs `Organization @id …/#organization` in blog graph. `Service.provider` on service pages is a third, id-less `LocalBusiness`. Pick one `@id` and reference it. |
| `postalCode: '00000'` with a TODO | LocalBusiness | Dubai has no postal codes. Remove the field. |
| `Offer` with no price | all 12 `Service` schemas | `priceCurrency: 'AED'`, `availability: InStock`, no `price`/`priceSpecification`. Live pricing exists in the DB. |
| `FAQPage` duplicated across pages | 4 pages share `airportTransferFaqs`, 5 share `chauffeurFaqs`, 3 share `dubaiTransferFaqs` | Same questions and answers marked up on multiple URLs. Google's FAQ rich result is restricted anyway; for AI answer extraction the duplicate is the bigger problem. |
| `FAQs` component slices to 8 but page data has 10 to 14 | service pages | Fine, but the schema only covers the 8 shown; that is correct behaviour. |
| `/frequently-asked-questions` marks up `allFaqs` (46 questions) with repeats | "Do you provide child seats?" three times, "Are your chauffeurs professionally trained?" twice, waiting time with two different numbers | Contradictory answers inside one `FAQPage` |
| `BreadcrumbList` on service pages with no visible breadcrumb | 12 service pages | Schema describes a UI that is not on the page. Either render the breadcrumb (the `Breadcrumb` component exists and `PageHero` pages use it) or drop the schema. |
| `sameAs` Facebook and Instagram URLs | LocalBusiness | Not verified reachable by this audit. Check by hand. |
| `hasMap` is a Google Maps search URL, not a place URL | LocalBusiness | Weak but harmless. |

### 1.7 Crawl hygiene and misc

- `<html lang="en">`, viewport present, no hreflang (single language, fine).
- `openGraph.locale` is `en_AE`; title/description OG present on all pages; default OG image is the logo (3 KB webp, not 1200×630 as declared). Service pages use `hero-bg.webp`. Provide a real 1200×630 share image.
- Favicon: `/favicon.png` only. No `apple-touch-icon`, no `manifest`.
- No `Article`/`BlogPosting` `author` entity beyond a name string.
- `/blog/tags` is `noindex,nofollow`; nofollow on an internal hub is pointless. Use `noindex, follow` or just index it once it has content.

## Phase 2: On-page SEO

Title measured from rendered `<title>`. The root layout sets `template: '%s | Emirates Limo'` and 17 pages hard-code the brand again inside `title`, producing `… | Emirates Limo | Emirates Limo`. Only `/blog`, `/limo-service-dubai` (both use `title: { absolute }`), `/payment`, `/privacy-policy`, `/terms-and-conditions` are clean. This is live in production (verified on `/`, `/dubai-airport-transfer`, `/fleet`).

| Page | Rendered title (chars) | Desc chars | H1 | H2s | Words | Notes |
|---|---|---|---|---|---|---|
| `/` | Emirates Limo \| Luxury Chauffeur & Transfers Dubai \| Emirates Limo (70) | 145 | Book Your Dubai Chauffeur & Airport Transfer | 8 | 814 | Double brand. Empty blog section. CTA "Book Now" links to `/` (self). |
| `/dubai-airport-transfer` | Dubai Airport Transfer \| Emirates Limo Pickup & Dropoff \| Emirates Limo (75) | 144 | Dubai Airport Transfer | 7 | 823 | Double brand. 7% unique content. |
| `/dubai-airport-transfer-to-hotel` | Dubai Airport to Hotel Transfer \| Emirates Limo \| Emirates Limo (63) | 154 | Dubai Airport Transfer to Hotel | 6 | 842 | Double brand. **Zero inbound links.** |
| `/abu-dhabi-airport-transfer` | Abu Dhabi Airport Transfer \| Emirates Limo \| Emirates Limo (58) | 163 | Abu Dhabi Airport Transfer | 6 | 822 | Double brand. FAQ set is the Dubai one ("What is a Dubai airport transfer?", "Where will I meet my driver at Dubai Airport?"). |
| `/abu-dhabi-airport-to-dubai-transfer` | Abu Dhabi to Dubai Airport Transfer \| Emirates Limo \| Emirates Limo (67) | 165 | Abu Dhabi to Dubai Airport Transfer | 6 | 847 | Double brand. **Zero inbound links.** Dubai airport FAQs. |
| `/chauffeur-service` | Chauffeur Service Dubai \| Private Chauffeur & Luxury Rides \| Emirates Limo (78) | 156 | Chauffeur Service in Dubai | 6 | 798 | Double brand, title truncates in SERP. |
| `/chauffeur-service-abu-dhabi` | Abu Dhabi Chauffeur Service \| Emirates Limo \| Emirates Limo (59) | 169 | Luxury Chauffeur Service in Abu Dhabi | 6 | 805 | Double brand. 69% shingle overlap with `/chauffeur-service`. |
| `/hourly-chauffeur` | Hourly Chauffeur Dubai \| Flexible Chauffeur Service \| Emirates Limo (67) | 140 | Hourly Chauffeur Service in Dubai | 7 | 796 | Double brand. No hourly rates published though the DB has them. |
| `/car-hire-with-driver-dubai` | Car Hire With Driver Dubai \| Car With Driver for Rent \| Emirates Limo (69) | 152 | Car Hire With Driver in Dubai | 6 | 839 | Double brand. |
| `/limo-service-dubai` | Limo Service Dubai \| Emirates Limo (34) | 162 | Limo Service Dubai | 6 | 799 | Clean title. 66% overlap with `/chauffeur-service`. Not in main nav. |
| `/dubai-transfer` | Dubai Transfer Service \| Emirates Limo \| Emirates Limo (54) | 167 | Luxury Dubai Transfer Service | 7 | 853 | Double brand. |
| `/abu-dhabi-to-dubai-transfer` | Abu Dhabi to Dubai Transfer \| Emirates Limo \| Emirates Limo (59) | 169 | Abu Dhabi to Dubai Private Transfer | 7 | 870 | Double brand. **77% overlap** with the reverse-direction page; 7% unique. |
| `/dubai-to-abu-dhabi-transfer` | Dubai to Abu Dhabi Transfer \| Emirates Limo \| Emirates Limo (59) | 145 | Dubai to Abu Dhabi Private Transfer | 7 | 879 | Double brand. See above. |
| `/services` | Dubai Chauffeur & Airport Transfer Services \| Emirates Limo \| Emirates Limo (79) | 140 | Chauffeur & Airport Transfer Services in Dubai | 4 | 362 | Double brand, truncates. |
| `/fleet` | Luxury Fleet \| Chauffeur Service Cars \| Emirates Limo \| Emirates Limo (69) | 147 | Our Luxury Fleet | 0 | 150 | Double brand. Vehicles client-only. No H2s. |
| `/about-us` | About Emirates Limo \| Luxury Chauffeur Dubai \| Emirates Limo (60) | 153 | About Emirates Limo \| Luxury Chauffeur Dubai | 4 | 426 | Double brand. **H1 is the meta title with a pipe in it.** No founding year, no licence, no fleet size, no team. |
| `/contact-us` | Contact Emirates Limo \| Dubai Chauffeur & Transfers \| Emirates Limo (71) | 136 | Contact Us | 1 | 230 | Double brand. |
| `/frequently-asked-questions` | FAQs \| Emirates Limo Dubai Chauffeur & Transfers \| Emirates Limo (68) | 145 | Frequently Asked Questions | 3 | 1094 | Double brand. Contradictory answers (see below). |
| `/blog` | Blog \| Emirates Limo (20) | 146 | Blog | 0 | 154 | Empty. Frozen at build. |
| `/privacy-policy` | Privacy Policy \| Emirates Limo (30) | 137 | Privacy Policy | 10 | 558 | Fine. |
| `/terms-and-conditions` | Terms & Conditions \| Emirates Limo (38) | 150 | Terms & Conditions | 13 | 915 | noindex but in sitemap. |

Images: every `<img>` has alt text. The hourly chauffeur service card reuses `chauffeur-service.webp` with alt "Hourly Chauffeur" (same image, different alt, on every page that renders `Services`).

### 2.1 Claim contradictions (credibility, conversion, AI trust)

These are the findings HOUSE FACTS exists to catch. Each one is a place where the site disagrees with itself in text an LLM will read verbatim.

| Claim | Version A | Version B | Recommended single truth |
|---|---|---|---|
| Cancellation | Home + 8 service pages benefit block: "Receive 100% refund when you cancel at least 24 hours before the pick up time." `chauffeurFaqs`: "24 hours or more before pickup receive a full refund." Hero strip: "Free Cancellation". `/hourly-chauffeur`: "Free cancellation when done at least 24 hours before pickup." | Terms §Cancellation: "12 hours or more … may be eligible for a partial or full refund depending on operational commitments. Within 12 hours … non-refundable." Terms §Payments: "non-refundable except when a duplicate payment occurs or … system error." | Decide the real policy. If it is "full refund at 24h+", rewrite the terms to say exactly that and delete the "may be eligible" and "non-refundable except" language. If it is the terms version, remove "100% refund" and "Free Cancellation" from every page and the FAQ. This is the single highest-risk copy on the site: it is a chargeback argument and an AI-visible contradiction. |
| Waiting time (non-airport) | Terms and `brandFaqs`: 15 minutes | `chauffeurFaqs`: "up to 20 minutes free for city and intercity transfers" | Terms are the contract: change `chauffeurFaqs` to 15. |
| Fleet | Live DB: 6 vehicles, no Toyota | `brandFaqs`: "Lexus ES, Kia Carnival, Toyota Highlander, Mercedes S-Class, BMW 7-Series, GMC Yukon, and Mercedes V-Class" | Remove Toyota Highlander, or build the FAQ answer from the vehicles API. |
| Service area | Schema `areaServed`: Dubai, Abu Dhabi, Sharjah. `brandFaqs`: same three. | `dubaiTransferFaqs`: "Abu Dhabi, Sharjah, Ras Al Khaimah, Ajman, and other Emirates" | Pick the list you actually serve and put it in both places. |
| Legal entity | Config `legal.companyName: 'Emirates Limo'`, schema `name: 'Emirates Limo'` | Footer: "© TRAVL Technologies. All Rights Reserved." | Add `legalName` to the Organization schema and say once, on About, that Emirates Limo is operated by TRAVL Technologies. |
| Airport FAQs on Abu Dhabi pages | `/abu-dhabi-airport-transfer` and `/abu-dhabi-airport-to-dubai-transfer` render `airportTransferFaqs`: "What is a Dubai airport transfer?", "Where will I meet my driver at Dubai Airport?", "Dubai International Airport" | Page is about AUH | Write `abuDhabiAirportFaqs` (AUH terminal meeting point, Zayed International, 60 min waiting, AUH to Dubai drive time). |
| "Decades of experience" | `chauffeurFaqs`: "Our chauffeurs have decades of experience" | About page has no founding date, no fleet size, no chauffeur count | Either substantiate on About or soften. |
| Pricing | Hero: "Fixed Pricing". About: "Fixed rates with no hidden charges". FAQs: "Prices are fixed at the time of booking" | No price anywhere on any page; the DB has base + per km + hourly per vehicle | Publish "from AED …" per service using the live minimums. |

## Phase 3: Content and blog

There are **0 published posts** in the shared database (`/api/blogs?status=published` returns `total: 0`; unfiltered `/api/blogs` also returns 0, so no drafts either). There is no `automations/targets/emirateslimo` blog target. The per-post table is therefore empty.

Collection-level findings:

| Finding | Evidence |
|---|---|
| Homepage renders "From Our Blog / Travel Tips & Insights" heading above nothing | `BlogPosts` client component, 0 posts |
| `/blog` shows "No posts available at the moment. Check back soon." and is indexable, in `app/sitemap.js`, linked from every footer | rendered HTML |
| Post template 404s on every slug (Phase 1.4) | code + dev log |
| `/blog` and post pages are build-time static with `force-cache` and no revalidate | code |
| Post schema: `BlogPosting` uses `post.excerpt || post.metaDescription` while `WebPage` uses the reverse order; `author` is a bare name; `quickAnswer` field exists and renders as a "Quick Answer" box, which is exactly the GEO pattern to keep | code |
| Sidebar "recent posts" fetches 10 and slices 3 with `force-cache`, so it is frozen too | code |

Service page content: measured 3-word-shingle uniqueness per page against the other 12 (rendered `<main>` text, scripts removed):

| Page | Unique shingles | Highest overlap with |
|---|---|---|
| `/dubai-airport-transfer` | 7% | `/abu-dhabi-airport-transfer` (0.63) |
| `/abu-dhabi-to-dubai-transfer` | 7% | `/dubai-to-abu-dhabi-transfer` (0.77) |
| `/` | 9% | `/hourly-chauffeur` (0.63) |
| `/abu-dhabi-airport-transfer` | 9% | `/dubai-airport-transfer-to-hotel` (0.73) |
| `/dubai-to-abu-dhabi-transfer` | 10% | `/abu-dhabi-to-dubai-transfer` (0.77) |
| `/dubai-airport-transfer-to-hotel` | 13% | `/abu-dhabi-airport-transfer` (0.73) |
| `/abu-dhabi-airport-to-dubai-transfer` | 13% | `/abu-dhabi-airport-transfer` (0.66) |
| `/chauffeur-service` | 13% | `/chauffeur-service-abu-dhabi` (0.69) |
| `/chauffeur-service-abu-dhabi` | 14% | `/chauffeur-service` (0.69) |
| `/hourly-chauffeur` | 16% | `/chauffeur-service` (0.63) |
| `/car-hire-with-driver-dubai` | 16% | `/chauffeur-service` (0.63) |
| `/limo-service-dubai` | 17% | `/chauffeur-service` (0.66) |
| `/dubai-transfer` | 17% | `/abu-dhabi-to-dubai-transfer` (0.65) |

Each page is Hero (1 sentence) + 4 benefit blurbs + shared `Process` + shared `Services` + shared `Fleet` + one of three shared FAQ sets + one of two shared testimonial sets. The ~800 word count is real but ~700 of it is the same on every page. Google will consolidate most of these into one or two representative URLs; the rest will sit in "Crawled, currently not indexed" or "Duplicate, Google chose different canonical". That cannot be verified without GSC, which is the main reason to attach an export next time.

What each service page needs to earn its URL (in house style, verdict first):

- An H2 that repeats the query the page targets ("How much does a Dubai airport transfer cost?" / "How long is the drive from Abu Dhabi to Dubai?") followed by a 40 to 80 word direct answer with a number in it.
- 150 to 250 words that only make sense on that page: the airport (terminals, meeting point, which airport code), the route (distance, typical duration, toll note), or the use case (what an hourly booking includes, minimum hours).
- A FAQ set written for the page, not shared.
- "From AED …" using the live minimum (BMW/Lexus/Kia base AED 100 + AED 2/km; hourly from AED 150). Cite the vehicle it applies to.

Testimonials: six named reviews with job titles and countries, no dates, no source, no aggregate rating, and identical sets on every page. Either back them with a Google Business Profile / Trustpilot source (and add `AggregateRating` from real data) or drop them. Fabricated-looking social proof is a trust cost with LLMs as much as with humans.

## Phase 4: AEO / GEO

What is in place (keep):

- `FAQPage` JSON-LD on every service page and the FAQ hub, answers in plain declarative sentences with concrete numbers where they exist (60 minutes, 24/7, name board).
- `LimousineService` entity with phone, email, address, geo, opening hours, `areaServed`.
- Blog template has a `quickAnswer` box and per-post FAQ schema.
- Answers use the brand name in the first sentence often enough for attribution.

What blocks citation:

| Gap | Why it matters for AI answers |
|---|---|
| Contradictory policy statements (Phase 2.1) | An LLM asked "what is Emirates Limo's cancellation policy" can retrieve both "100% refund at 24h" and "non-refundable, 12h, may be eligible". Contradiction lowers the chance of being cited at all. |
| No prices anywhere | "How much is an airport transfer in Dubai with Emirates Limo" cannot be answered from the site. Competitors that publish "from AED X" get quoted. |
| No unique facts per page | The shared FAQ answers are generic ("Yes. Our chauffeurs are fully licensed, professionally trained…"). Nothing on the Abu Dhabi to Dubai page says 130 km, ~90 minutes, Sheikh Zayed Road, or Salik. |
| Fleet is client-rendered | Vehicle names, seats and luggage capacity are exactly the specifics an LLM would quote and they are not in the HTML. |
| No entity consolidation | Three business entities with different `@id`s (Phase 1.6). Knowledge-graph style extraction cannot merge them confidently. |
| No blog | Zero long-form content, so zero chance of being the source for informational queries (DXB terminal guides, Abu Dhabi to Dubai transport options, chauffeur vs taxi). |
| `sameAs` unverified, no `AggregateRating`, no third-party review source | Nothing corroborates the entity off-site from the site's own markup. |
| About page has no dates, licence, or people | E-E-A-T signals are declarative ("Founded with a passion for hospitality") rather than factual. |
| No `llms.txt`, no plain-text policy page | Optional, low effort: a `/llms.txt` listing the 12 service pages with one-line summaries and the policy facts. |

Priority AEO copy, ready to paste once the policy is decided (assumes the 24h full refund is the real policy; if the terms are correct, swap the numbers):

`chauffeurFaqs` → "What is your cancellation policy?"
"Cancel 24 hours or more before pickup and you get a full refund to the original payment method. Cancellations inside 24 hours and no-shows are charged in full. To cancel, reply to your confirmation email or message us on WhatsApp at +971 56 996 4924."

`chauffeurFaqs` → "Is the waiting time included?"
"Yes. Airport pickups include 60 minutes of free waiting from the actual landing time. All other pickups include 15 minutes. After that, waiting is billed at the hourly rate of the vehicle you booked."

`brandFaqs` → "What vehicles does Emirates Limo offer?"
"Six vehicles: Lexus ES300 and BMW 7-Series sedans (3 to 4 passengers), Mercedes-Benz S-Class (3 passengers), GMC Yukon SUV (6 passengers), and Kia Carnival and Mercedes-Benz V-Class vans (5 to 6 passengers). Every car is chauffeur-driven; there is no self-drive."

## Phase 5: Internal linking

Link graph built from rendered HTML of all 26 routes.

| Signal | Finding |
|---|---|
| Orphans | `/dubai-airport-transfer-to-hotel` and `/abu-dhabi-airport-to-dubai-transfer` have **zero inbound internal links**. They are reachable only via the sitemap. Both are priority 0.9 in the sitemap. |
| Nav coverage | Main nav: 4 dropdowns covering 12 of the 13 money pages. `/limo-service-dubai` is footer-only. `/services` is linked from `Services` section cards only. |
| Footer | 15 links, consistent on every page, includes all three transfer pages and four service pages. Good. |
| Home CTA | Bottom `ServiceCta` "Book Now" links to `/` (self). Should be `/book/select-limo` like every other page. |
| Contextual links | None. No service page links to a sibling in body copy; all cross-links are nav, footer, and the shared `Services` cards (which link the same three pages from every page: airport transfer, chauffeur, hourly). |
| Breadcrumbs | Visible on `PageHero` pages (about, contact, FAQ, blog, fleet, services). Not visible on the 12 service pages, which nonetheless emit `BreadcrumbList` schema. |
| Anchor text | Nav and footer anchors are exact-match page names. Fine. |
| Blog → service | Template has no "related service" block, so future posts will not pass equity to money pages unless the author links by hand. |

Fixes: add the two orphans to the "Airport Transfers" and "Transfers" dropdowns; add a 2 to 3 link "Related" strip under each service page's benefits block (airport page → hotel transfer, Abu Dhabi airport; each direction page → the reverse direction, `/dubai-transfer`); render the breadcrumb on service pages; point the home CTA at the booking flow.

## Phase 6: GSC opportunities

Skipped. No export provided. Without it the audit cannot say which of the 13 near-duplicate pages Google chose as canonical, whether any are indexed at all, or what queries they draw. Attach a Performance export (pages + queries, 16 months) and a Coverage/Indexing export for the next run.

## Scores

Weights: Technical 30, On-page 20, Content 20, AEO/GEO 20, Linking 10.

**Technical SEO: 48.** Canonicals, robots meta, redirects, 404 handling and OG are correct and were verified in production. Against that: crawl files are shadowed static copies (500 locally, stale in prod), the blog post route cannot render in Next 16, blog pages are frozen at build, fleet is client-only, three unlinked business entities in schema, 1.26 MB script payload and four font families. CWV not measured; scored only what was verified.

**On-page SEO: 56.** Every page has a unique title, description, single H1 and self canonical. Against that: 17 of 22 titles carry the brand twice (live in prod), the About H1 is a meta title with a pipe, service pages are 7 to 17 percent unique, Abu Dhabi airport pages run Dubai airport FAQs, no prices, and the policy copy contradicts the terms.

**Content and Blog: 22.** Zero posts, empty homepage section, empty indexable `/blog`, a template that 404s, no automation target. The service pages' shared blocks are the only content and they are shared. Testimonials are unsourced. Scored low because the fundamentals for content do not exist yet, not because the site is young.

**AEO / GEO: 41.** FAQ schema, a real business entity, and answer-shaped FAQ copy are in place, which is more than most sites in the category. Contradictory policy facts, no prices, no page-specific facts, client-only fleet, and no long-form content cap it.

**Internal Linking: 58.** Nav and footer are complete and consistent, and every page but two is reachable in one click. Two orphaned priority pages, zero contextual links, a self-linking home CTA, and schema breadcrumbs with no visible counterpart.

**Overall: 44 (weighted).** Measured, not projected. If the top 10 are shipped, re-run against live pages before quoting a new number.

## Master fix list

Impact judged across rankings (R), AI presence (A) and conversion (C). Effort: S under an hour, M a half day, L a day or more.

| # | Issue | Scope | Category | Impact | Effort | Fix |
|---|---|---|---|---|---|---|
| 1 | `params.slug` read synchronously; every post URL 404s | `blog/[slug]/page.js` | Technical | High (R, A) | S | `const { slug } = await params;` in `generateMetadata` and the page; use `slug` for fetch, canonical and breadcrumb |
| 2 | `public/robots.txt` and `public/sitemap.xml` shadow the route handlers; prod sitemap frozen at 05 Feb 2026, no posts, `/blog` missing, noindex pages included | crawl files | Technical | High (R) | S | Delete both `public/` files. In `sitemap.js` drop `/blog/tags` and `/terms-and-conditions`, replace `lastModified: new Date()` on static pages with a fixed per-page date or omit. In `robots.js` keep `/admin/` disallow |
| 3 | Cancellation policy contradicts terms | home, 8 service pages, `chauffeurFaqs`, hero strip, terms | Credibility | High (C, A) | S copy / M legal | Decide the policy; make terms, benefit blocks, FAQ and hero strip say the same thing (copy in Phase 4) |
| 4 | Title renders brand twice | 17 pages | On-page | High (R, CTR) | S | Remove `| Emirates Limo` from each page's `metadata.title` (the layout template adds it), or switch those pages to `title: { absolute }` |
| 5 | GA4 never initialised; `initializeGA()` is defined and never called; no `gtag`/GTM script in prod HTML; Meta Pixel base code never loaded so `fbq` calls no-op | `src/lib/analytics.js`, `src/lib/meta.js`, layout | Measurement | High (all) | S | Call `initializeGA()` once in a client component in the root layout (pageviews then auto-track per `feedback_ga4_pageviews`); either load the pixel base script or delete the pixel helpers |
| 6 | `/blog` and posts are build-time static with `force-cache`; build container cannot reach API | blog pages | Technical | High (R, A) | S | `export const revalidate = 3600;` in both files (matches `sitemap.js`), and drop `cache: 'force-cache'` in favour of `next: { revalidate: 3600 }` |
| 7 | Service pages 7 to 17 percent unique; 13 near-duplicates | 12 service pages + home | Content | High (R, A) | L | Per page: unique H2-as-question + 40 to 80 word answer, 150 to 250 words of page-specific facts (airport, route distance/time, hourly inclusions), own FAQ set, own testimonials or none |
| 8 | Two service pages have zero inbound links | `/dubai-airport-transfer-to-hotel`, `/abu-dhabi-airport-to-dubai-transfer` | Linking | High (R) | S | Add to nav dropdowns and to a "Related" strip on sibling pages |
| 9 | No prices anywhere; `Offer` has currency but no price | 12 service pages, schemas | AEO / Conversion | High (A, C) | M | "From AED 100 + AED 2/km" style line per service from live vehicle minimums; add `priceSpecification` (`UnitPriceSpecification`, `price`, `priceCurrency: 'AED'`, `unitText: 'km'` or `'hour'`) to each `Service.offers` |
| 10 | Fleet client-only; `/fleet` is 150 words of HTML | `/fleet`, home `Fleet` | Technical / AEO | Med (R, A) | M | Fetch vehicles in the server component and pass as props (hydrate the hook with `initialData`); add `Product`/`Vehicle` schema with `seatingCapacity`, `cargoVolume` from DB |
| 11 | Abu Dhabi airport pages render Dubai airport FAQs | 2 pages | Credibility | Med (A, C) | S | New `abuDhabiAirportFaqs` (AUH/Zayed International, meeting point, 60 min waiting, AUH to Dubai time) |
| 12 | Three business entities with different `@id`s; two `WebSite`s | sitewide + blog + `Service.provider` | Structured data | Med (A) | S | Give `SitewideSchema` the `#organization`/`#website` ids from `lib/schema.js`, reference `{ '@id': …#organization }` from `Service.provider` and blog graph, drop the layout's id-less `WebSite` on blog pages |
| 13 | Waiting time 15 vs 20 minutes; Toyota Highlander not in fleet; service-area lists differ; "decades of experience" unsubstantiated | FAQ data | Credibility | Med (A, C) | S | Copy in Phase 4 |
| 14 | `/frequently-asked-questions` schema includes 46 questions with duplicates and contradictory answers | FAQ hub | Structured data | Med (A) | S | Dedupe `allFaqs` by question; after #3 and #13 there is only one answer per question |
| 15 | Empty "From Our Blog" on home; "Check back soon" on `/blog` | home, `/blog` | Content / Conversion | Med (C) | S | Hide the section when `blogs.length === 0`; consider `noindex` on `/blog` until the first post ships |
| 16 | About H1 is "About Emirates Limo \| Luxury Chauffeur Dubai" | `/about-us` | On-page | Med (R) | S | H1 "About Emirates Limo"; add founding year, operator (TRAVL Technologies), fleet size (6), licence/permit if any, service hours |
| 17 | `BreadcrumbList` schema without visible breadcrumb | 12 service pages | Structured data | Low (R) | S | Render `Breadcrumb` in `Hero` or drop the schema |
| 18 | Home bottom CTA "Book Now" → `/` | home | Conversion | Low (C) | S | `primary={{ href: '/book/select-limo', label: 'Book Now' }}` |
| 19 | Four font families, 111 woff2 refs; 1.26 MB JS+CSS | root layout | Performance | Med (R, unmeasured) | M | Remove DM Sans and Google Sans imports if unused; run `next build` with the bundle analyzer and confirm Mapbox/TinyMCE are admin-only chunks; then measure CWV with a browser |
| 20 | OG image is the 3 KB logo declared as 1200×630 | default metadata | Social | Low (CTR) | S | Real 1200×630 share image |
| 21 | `postalCode: '00000'` with TODO; `hasMap` is a search URL | LocalBusiness schema | Structured data | Low | S | Remove `postalCode`; use the Google Maps place URL |
| 22 | `/blog/tags` is `noindex, nofollow` | tags page | Technical | Low | S | `noindex, follow`, or index once populated |
| 23 | Testimonials unsourced, undated, identical across pages | 13 pages | Credibility | Med (C, A) | M | Source from Google Business Profile with dates, or remove; add `AggregateRating` only from real review data |
| 24 | `.env.development` has `NEXT_PUBLIC_BRAND=airportrides` | dev env | Dev hygiene | Low | S | Set to `emirateslimo` (does not affect prod; noted because it will bite the next local run) |
| 25 | Blog template has no "related service" block | `blog/[slug]` | Linking | Low (R) | S | Add a CTA card linking the most relevant service page based on tags |
| 26 | No blog automation target for this brand | `automations/targets` | Content | Med (R, A) | M | Add an `emirateslimo` target after #1, #6 ship, with the house-style prompt and per-post `quickAnswer` |
| 27 | Apex `http://` redirects in two hops | edge | Technical | Low | S | Redirect `http://emirateslimo.com` straight to `https://www.` at the CDN/Fly layer |

## What was and was not verified

Verified: every finding in Phases 0, 1.1 to 1.4, 1.6, 2, 3 and 5 comes from rendered HTML (local, and production for the pages named), the live API, or the code path quoted. The Next 16 `params` behaviour was confirmed by reading `next/dist/server/request/params.js` in the installed version and by the dev-server error during the audit.

Not verified: Core Web Vitals and anything requiring a browser; whether Google has indexed or consolidated the service pages (needs GSC); whether the Facebook and Instagram `sameAs` URLs resolve; gzip sizes of the production bundle; whether `next build` emits a warning for the `public/` conflict (production evidence shows the static files win, which is all that matters here).

No files other than this report were modified.
