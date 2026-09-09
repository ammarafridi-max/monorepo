# VisaWadi SEO / AEO / GEO Audit

**Run date:** 08 September 2026
**Scope:** `apps/visawadi-frontend`, `apps/visawadi-backend`, and the shared packages they consume.

## Environment audited

| Item | Value |
|---|---|
| Branch | `master` |
| Commit | `73c0470` (working tree had 2 unrelated modified files in `conversations` and `whatsapp` domains, neither in VisaWadi's dependency graph) |
| Frontend (dev, used for crawl/rendered-HTML/schema) | `http://localhost:4000` (`next dev`, Next.js 16.3.0, Turbopack) |
| Frontend (production build, used for payload/TTFB) | `http://localhost:4100` (`next build` + `next start`, build exit 0, 95/95 pages generated) |
| Backend | `http://localhost:4001` (`node --env-file=.env.development src/server.js`, `{"status":"ok","brand":"visawadi"}`, MongoDB Atlas connected) |
| Backend URL wired into frontend | `NEXT_PUBLIC_BACKEND_URL=http://localhost:4001` |
| GSC export (VisaWadi) | `~/Downloads/visawadi.com-Performance-on-Search-2026-09-08/`, Web, last 3 months |
| GSC export (legacy Travl) | `~/Downloads/travl.ae-Performance-on-Search-2026-09-08/`, Web, last 3 months |

Both servers came up cleanly. Ports 3000/3001 were already occupied by another brand's servers, so VisaWadi was brought up on 4000/4001/4100 to avoid measuring the wrong app. All servers started for this audit were shut down at the end.

### What was checked

Live crawl of all 73 sitemap URLs plus 86 distinct internal link targets; rendered HTML of every public route; all JSON-LD parsed and inspected; live external checks against `travl.ae`, `dummyticket365.com` and `visawadi.com` production; all 30 Travl-to-VisaWadi post redirects verified end to end on the live domain; the visa requirement checker API exercised directly; production build asset weights; both GSC exports.

### What was NOT checked

- **Lab Core Web Vitals (LCP, CLS, INP/TBT) were not directly measured.** The `chrome-devtools` MCP server failed to connect (`CONNECTION_CLOSED`) and no other headless browser was available. Performance findings below are based on server-side proxies: TTFB, HTML weight, JS/CSS transfer weight, image loading attributes and intrinsic dimensions. Anything requiring a real render is marked as inferred, not measured.
- Production response headers on `www.visawadi.com` (x-robots-tag, cache-control) were not read at the edge; header behaviour was verified against the local production build instead.
- Field CWV (CrUX) data. The domain is too young to have it.
- Visual/manual mobile tap-target inspection. Viewport meta and responsive class usage were verified in markup only.

**On domain age:** visawadi.com's first impression in GSC is 10 August 2026, four weeks of data. 25 clicks and 7,481 impressions over the window is not a failure signal on a domain this young, and nothing below is scored on traffic volume. The scoring is on fundamentals.

---

## Executive summary

| Bucket | Score | Weight |
|---|---|---|
| Technical SEO | **78** / 100 | 25% |
| On-page SEO | **72** / 100 | 15% |
| Content & Blog | **62** / 100 | 20% |
| AEO / GEO | **58** / 100 | 15% |
| Internal Linking | **60** / 100 | 10% |
| Migration Integrity | **71** / 100 | 15% |
| **Overall (weighted)** | **68** / 100 | |

The technical build is genuinely good. Canonicals are correct and self-referencing on all 73 indexable URLs, the sitemap matches the route list exactly, utility routes are properly noindexed, 404s return 404 with noindex, there are zero broken internal links, and all structured data reaches the rendered HTML with no parse errors and no prop-name drop. The migration is the best part: all 30 migrated post URLs and the `/visa/*` wildcard on travl.ae redirect in a single permanent hop to a live 200, and all 98 outbound cross-domain links resolve 200 with no redirect.

What holds the score down is provenance and consistency, which is exactly where visa content is judged hardest. 35 of 40 posts cite no official source at all, 0 of 40 carry a last-checked date, and the same EUR 90 Schengen fee is stated as AED 350, AED 355-370, AED 360 and AED 385 across different pages, sometimes within one post. `/about` and the Terms page both state VisaWadi does not sell flight reservations, insurance or hotel bookings, while every Schengen money page and its FAQ schema say the package includes them. And the checker, the site's single best proprietary asset, is entirely client-rendered with no crawlable state.

### Top 10 highest-leverage fixes

1. Resolve the package-inclusions contradiction between `/about` + `/terms-and-conditions` and the six Schengen money pages.
2. Fix the Schengen fee conversion: one AED figure for EUR 90 everywhere (currently 350 / 355-370 / 360 / 385).
3. Correct `/blog/spain-visa-uae-bls-international-process`, which states the pre-2026 fee of EUR 80 / EUR 40.
4. Rewrite `/blog/schengen-visa-fees-...` title, meta and H2s to capture the 22 striking-distance fee/cost queries currently at 0% CTR.
5. Remove the unsourced "We have a high success rate on second applications" claim from `/uae/visa/schengen` and its FAQ schema.
6. Repoint the 40 blog CTAs from legacy `/visa/*` to canonical `/uae/visa/*`.
7. Add `offers` / `priceSpecification` to the `Service` schema on all 10 money pages.
8. Fix `/contact`: insurance-policy copy, empty `<address>`, and a "View on Google Maps" link with no `href`.
9. Add official-source links and a last-checked date to the 35 migrated posts.
10. Give the checker crawlable result URLs, or at minimum add the checker's sourced answers to the money pages as server-rendered content.

---

## Phase 0 — Stack and route inventory

| Aspect | Finding |
|---|---|
| Framework | Next.js **16.3.0**, App Router, React 19.2.5, Turbopack in dev |
| Language | JavaScript, ESM, Node 22 target (ran under 23.7.0 locally without issue) |
| Styling | Tailwind v4 via `@tailwindcss/postcss` |
| Blog source | MongoDB via `apps/visawadi-backend` → `@travel-suite/blog`, consumed through `@travel-suite/frontend-shared/services/apiBlog`. No MDX, no external CMS |
| Metadata | `generateMetadata` / `metadata` export, built by `src/lib/schema.js` wrapping `frontend-shared/utils/publicMetadata`. No next-seo, no hardcoded `<head>` |
| Structured data | `frontend-shared/utils/schema` `createSchemaBuilders` + `buildGraph`, emitted as `application/ld+json` |
| Sitemap / robots | `src/app/sitemap.js` (`revalidate = 3600`, fetches blogs, tags, visas per live country, authors) and `src/app/robots.js` |
| i18n | **None.** No `i18n` config, no locale segments, no hreflang. Marked N/A throughout |
| Deployment | Fly.io, `output: 'standalone'` |
| Middleware | **None, correctly.** No `middleware.js` / `proxy.js` exists. Apex→www and the legacy `/visa/*` redirects are `async redirects()` in `next.config.mjs`, which is the right place given `output: 'standalone'` silently ignores middleware. Verified live: `/visa/schengen` → 308 → `/uae/visa/schengen` |
| Backend | **Yes, it exists:** `apps/visawadi-backend`, Express 5 + Mongoose 9. Domains mounted: auth, admin-users, blog, blog-tags, visas, currencies, visa-leads, **visa-requirements**, payments, users, visa-applications |

### Route inventory (all public routes enumerated)

| Group | Expected | Found | Gap |
|---|---|---|---|
| Static public pages | — | 9 (`/`, `/uae`, `/blog`, `/blog/tags`, `/faq`, `/about`, `/contact`, `/terms-and-conditions`, `/privacy-policy`) | — |
| Visa / service pages | ~8 | **10** | +2. `saudi-arabia` and `greece-visa` exist beyond the expected set |
| Blog posts | ~35 | **40** | +5 (30 migrated from Travl + 10 written post-split) |
| Blog tag routes | 8 | **13** | +5. One of them, `/blog/tags/us-visa`, has **zero posts** |
| Author pages | — | 1 (`/authors/ammar-afridi`) | — |
| Noindexed utility | — | `/apply`, `/apply/login`, `/apply/[applicationRef]`, `/admin/*` | Correctly excluded from sitemap and robots |
| **Total indexable** | | **73** | Matches sitemap exactly |

The 10 visa pages are: `schengen`, `france-visa`, `germany-visa`, `italy-visa`, `spain-visa`, `greece-visa`, `united-kingdom`, `usa`, `canada`, `saudi-arabia`. All `published`, all served under `/uae/visa/<slug>`.

---

## Phase 1 — Technical SEO

### Indexability

| Check | Result |
|---|---|
| robots.txt | Present, generated. `Allow: /`, `Disallow: /admin`, `Disallow: /apply`, sitemap declared at the production URL. No AI crawler is blocked |
| Canonicals | Present on **73/73** URLs, all self-referencing, all on `www.visawadi.com`, **none** pointing at travl.ae |
| Stray noindex on real pages | **None.** All 73 render `index, follow` |
| Noindex where it belongs | `/apply`, `/apply/login`, `/admin/login` all render `noindex, nofollow` |
| 404 handling | Returns HTTP 404 with `<meta name="robots" content="noindex">` and a branded title |
| Trailing slash | `/faq/` → 308 → `/faq`. Consistent |
| Apex → www | Configured in `next.config.mjs` via a host `has` rule |

**Issue:** the homepage canonical is `https://www.visawadi.com` (no trailing slash) while the sitemap lists `https://www.visawadi.com/`. Harmless in practice, but they should match.

### Sitemap

73 entries, exactly matching the route list: 9 static + 40 posts + 13 tags + 10 visa + 1 author. No admin or apply routes leak in. `revalidate = 3600` with per-source try/catch, so a backend blip degrades the sitemap rather than failing the build.

**Issues:**
- `/blog/tags/us-visa` is in the sitemap and has **zero posts**. It renders 80 words of chrome. That is a soft-404-shaped indexable URL.
- Several `lastmod` values are hardcoded strings (`2026-08-09`, and `2026-04-28` for every tag entry) rather than derived, so they will silently go stale.

### Duplication and parameterised routes

- `/blog?page=2`, `/blog/tags/<tag>?page=2` and even `/blog?page=99` all return 200 with `index, follow` and a canonical pointing at the unparameterised page. Correct canonicalisation, but it means an unbounded 200-returning parameter space. Low risk given the canonical.
- **Near-duplicate:** `/` and `/uae` share almost the same title (`Visa Assistance for UAE Residents | VisaWadi` vs `...for UAE residents | VisaWadi`) and the same H1 text. Two URLs targeting one term. See Phase 2.

### Performance (production build, `next start`)

| URL | TTFB | HTML | Notes |
|---|---|---|---|
| `/` | 8.9 ms | 178 KB | 14 images, **0 with priority/eager**, 13 lazy |
| `/uae` | 6.4 ms | 138 KB | |
| `/uae/visa/schengen` | 9.4 ms | 141 KB | Hero image correctly not lazy |
| `/blog/schengen-visa-fees-...` | 6.8 ms | 134 KB | |
| `/faq` | 5.3 ms | 76 KB | |

Home page bundle: **15 JS chunks totalling 728 KB uncompressed**, 2 CSS files totalling 112 KB, 2 preloaded woff2 fonts. HTML is 174 KB before compression.

Inferred CWV risks (not measured, see caveats):
- **LCP:** every image on the homepage is `loading="lazy"` with no `fetchPriority="high"`. If the LCP element is one of the visa card images, that is a direct LCP penalty. The visa detail pages do this correctly.
- **CLS:** 12 of 14 homepage images and 10 of 12 on `/uae` render without intrinsic `width`/`height` (they use Next's `fill` layout, which is safe only if the wrapper is size-constrained). Worth a real browser check.
- Shared stock images (`happy-traveler1.webp`, `happy-traveler2.webp`, `travel-icon.webp`) are requested at `w=3840`. Oversized for their render slots.
- The header logo is requested at `w=2048` to render at 1000×176.

### Rendering

Meta, canonical, OG/Twitter and the full JSON-LD graph are all present in the server-rendered HTML on all 73 URLs, confirmed by fetching without JS. Pricing on the money pages is server-rendered (AED 299 / 599 / 699 all appear in raw HTML). FAQ answers are server-rendered.

**Not server-rendered:** the visa requirement checker. See Phase 1.6.

### Structured data plumbing

This was checked specifically for the known prop-name-mismatch failure mode that dropped structured data on the sister project. **It has not recurred.** All 73 pages emit at least one `ld+json` block, all blocks parse, and the graph is correctly `@id`-linked (WebPage → WebSite → Organization; BlogPosting → author Person `@id` on the author page).

| Type | Pages |
|---|---|
| BreadcrumbList | 70 |
| Organization / WebSite | 69 |
| WebPage | 68 |
| FAQPage | 52 |
| Person | 41 |
| BlogPosting | 40 |
| Blog | 14 |
| Service | 12 |
| ProfilePage | 1 |
| **Offer / priceSpecification** | **0** |

**Issues:**
- `/about` and `/contact` emit **zero JSON-LD**. Every other page carries the Organization graph. These are the two pages where an Organization/ContactPage graph matters most for entity building.
- **No `Offer` or `priceSpecification` anywhere**, despite 10 pages rendering explicit AED tier pricing. The `Service` nodes carry `serviceType`, `areaServed` and `provider` but no price. This is the largest single structured-data gap on the site.
- Tag pages emit `Blog` + `WebPage` rather than `CollectionPage` + `ItemList`.

### Mobile

`width=device-width, initial-scale=1` on all 73 pages. Responsive Tailwind breakpoints in use throughout. Tap-target and font-size verification requires a real viewport render and was not performed.

### Crawl hygiene

- **Zero broken internal links.** All 86 distinct internal link targets return 200, except 9 that 308-redirect (see below).
- **9 legacy `/visa/*` targets are still linked internally**, from **40 blog posts** (one CTA each). Each is a live 308 to the canonical `/uae/visa/*`. Not broken, but every blog-to-money-page conversion CTA passes through a redirect. See Phase 5.
- **Orphan:** `/about` has **zero inbound internal links**. It is in the sitemap and ranks (1 click / 13 impressions, position 3.77) but nothing on the site links to it. Not in nav, not in footer.
- **Near-orphan:** `/uae/visa/saudi-arabia` has 2 inbound links (homepage card only). It is absent from the footer's "Schengen Countries" and "All Destinations" lists, unlike the other 9 visa pages which each get 73 inbound footer links.
- Nav and footer links all resolve to real routes.

### Brand asset integrity

| Asset | Status |
|---|---|
| `favicon.png` | Present, 300×300, **differs from Travl's** (has been rebranded). Declared as `<link rel="icon">` |
| `og-image.png` | Present, 1200×651, referenced by all 73 pages, resolves 200 |
| `logo-dark.png` / `logo-light.png` | Present, VisaWadi-specific, used in header/footer |
| `favicon.ico` | **404** |
| `apple-touch-icon.png` | **404** |
| `manifest.json` / `site.webmanifest` | **404**, and no `<link rel="manifest">` |
| `logo.webp` | **Byte-identical to Travl's `logo.webp`.** Not referenced by any rendered page, so cosmetic, but it is a stale sister-brand file sitting in `public/` |
| `happy-traveler1.webp`, `happy-traveler2.webp`, `travel-icon.webp`, `contact-img.webp`, `ahmed.webp`, `david.webp`, `maria.webp`, `trustpilot.webp`, `sample-ticket2.webp`, `axa-logo.png`, `dirham.svg` | **All byte-identical to Travl's copies.** Three of them (`happy-traveler1/2`, `travel-icon`) are actively rendered on VisaWadi pages. Shared stock imagery across two live domains is a duplicate-image signal and a brand-differentiation miss, though none carries a Travl-naming path or wrong-brand alt text |

`og-image.png` is 329 KB, which is large for a social card but not blocking.

### Structured data validity against HOUSE FACTS

`Organization` publishes `legalName: "City Tours LLC"`, `email: info@visawadi.com`, `telephone: +971569964924`, `address: { addressLocality: Dubai, addressRegion: Dubai, addressCountry: AE }`, and three `sameAs` socials.

**Issues:**
- `City Tours LLC` appears **only** in schema. It appears nowhere in the Terms, Privacy Policy, footer or `/contact` page copy, all of which name only "VisaWadi". A user cannot verify the legal entity from any human-readable page.
- The published `addressLocality: Dubai` is a **placeholder**. `src/config/contact.js` documents that the trade licence's registered address is in Sharjah and that licence 557984 expired 17/05/2026. Publishing a Dubai locality in Organization schema while the licensed address is Sharjah is a factual misstatement in structured data, and the expired licence is a live compliance exposure that also blocks Google Business Profile and any LocalBusiness markup.
- No `LocalBusiness`, no `AggregateRating`, no `Offer`.

---

## Phase 1.5 — Migration and cross-domain integrity

### Redirects (verified live against travl.ae)

| Source pattern | Destination | Hops | Status | Target |
|---|---|---|---|---|
| `travl.ae/visa` | `visawadi.com/uae` | 1 | 308 | 200 |
| `travl.ae/visa/:slug` (all 10 slugs) | `visawadi.com/uae/visa/:slug` | 1 | 308 | 200 |
| `travl.ae/blog/<slug>` × 30 migrated posts | `visawadi.com/blog/<slug>` | 1 | 308 | 200 |
| `travl.ae/apply`, `/apply/:path*` | `visawadi.com/apply/...` | 1 | 308 | 200 |
| `travl.ae/blog/how-to-apply-...-guide-2` | `visawadi.com/blog/how-to-apply-...-guide` | 1 | 308 | 200 |

**All 30 migrated post URLs verified end to end: single hop, permanent, live 200 target, no chains, no 302s, no generic-homepage dumping.** The Travl config deliberately points at the country-prefixed `/uae/visa/:slug` rather than `/visa/:slug` to avoid a two-hop chain, which is correct.

The redirects are **308, not 301**. Both are permanent and Google treats them equivalently; this is Next.js's default for `permanent: true` and is not a defect.

**No old Travl visa URL was found without a mapping.** The wildcard covers every slug on both sides.

### Residual sister-brand leakage

**Accidental (fix these):**

| Location | Leakage |
|---|---|
| `/blog/bls-international-uae-schengen-visa-application-guide` | Anchor text reads **"VisaWadi.ae FAQ"**. The domain is `.com`. This is the exact `.ae` artefact `CLAUDE.md` warns about, and it is live in body copy |
| `/contact` meta description | "…help with your **insurance policy** or visa documentation" |
| `/contact` page copy | "For questions about an **existing policy**, please include your **policy number**." VisaWadi issues no policies |
| `/blog/tags/travel-insurance` | A tag page with H1 "Travel Insurance", 17 posts, 19 inbound internal links and 1,109 words, on a domain that does not sell insurance |
| `public/logo.webp` and 10 other stock assets | Byte-identical to Travl's copies |

**Deliberate (leave alone):** all 98 `travl.ae` links and all 47 `dummyticket365.com` links in blog bodies. `apps/visawadi-frontend/CLAUDE.md` documents these as intentional cross-brand product references. Titles, H1s, OG tags, email addresses and image URLs are clean.

### Cross-domain link health

**33 distinct external URLs across travl.ae, dummyticket365.com and visawadi.com were checked live. All 33 return 200 with no redirect.** No dead or redirected cross-domain link exists.

| Destination host | Link count | Pages |
|---|---|---|
| `www.travl.ae` | 98 | 37 blog posts |
| `www.dummyticket365.com` | 47 | blog posts |
| Government / VFS / BLS | ~25 | 5 posts only |

**Funnel assessment:** the money pages are clean. `/`, `/uae` and all 10 `/uae/visa/*` pages carry **zero** cross-domain outbound links. Leakage is confined to blog bodies, where 409 links point at VisaWadi money pages against 145 cross-domain links, a healthy 2.8:1 ratio.

Two specific leaks are worth attention:

1. Six posts promote the **Travl Travel Itinerary Generator at USD 13** as a thing the reader should go buy. VisaWadi's own Schengen packages include a day-by-day itinerary. The posts are sending a buying-intent reader off-domain for something the AED 299 package already covers. (No post *links* the itinerary, which matches the internal rule; they name and price it, which has the same effect.)
2. `/blog/schengen-visa-travel-insurance-requirements-minimum` is the **second most internally-linked post on the site** (44 inbound links), and its subject is a product VisaWadi does not sell. Substantial internal equity is pooling on a page whose best outcome is an exit to travl.ae.

### Cross-domain cannibalisation

Travl deliberately kept `/travel-insurance/<country>-visa` pages. From the legacy export they still rank:

| Travl URL | Clicks / Impr / Pos | VisaWadi competitor | Verdict |
|---|---|---|---|
| `/travel-insurance/schengen-visa` | 2 / 537 / 40.7 | `/uae/visa/schengen` (0/82/79.0) | **Different intent.** Travl should win "schengen visa insurance"; VisaWadi should win "schengen visa assistance/cost/fee". No real conflict today |
| `/travel-insurance/italy-visa` | 4 / 145 / 11.1 | `/uae/visa/italy-visa` (0/0) | Travl wins on the insurance modifier. VisaWadi's page is not yet ranking at all |
| `/travel-insurance/greece-visa` | 0 / 175 / 18.5 | `/uae/visa/greece-visa` (0/0) | Same |
| `/travel-insurance/uk-visa` | 1 / 132 / 35.8 | `/uae/visa/united-kingdom` (0/355/76.8) | Both weak. No overlap on head terms |

**No query where both domains actively compete for the same intent was found.** The split is clean by modifier. The genuine risk is the reverse: VisaWadi's `/blog/tags/travel-insurance` and its 17 insurance-heavy posts building topical authority on Travl's subject, on the wrong domain.

### Analytics

| Brand | GA4 |
|---|---|
| VisaWadi | `G-5YEWCG9Z95` |
| Travl | `G-JNK7PWB29T` |
| DT365 | `G-4F8HXF07ZT` |
| MDT | `G-MZ3MF8Q8C3` |

**Correct and distinct. No sister-project ID is firing on VisaWadi.** Microsoft Clarity (`xzvdxilvty`) is also wired and is correctly disclosed in the Privacy Policy, including the field-masking behaviour. Cloudinary assets are all under the `visawadi/` folder prefix, so the media migration is complete.

---

## Phase 1.6 — Visa requirement checker

The checker lives in `frontend-shared/components/ui/v2/VisaCheckerInline`, is mounted on `/` and `/uae`, and is backed by `packages/domains/visa-requirements` (`GET /api/visa-requirements/check`, `/destinations`).

### Rendering and indexability

**Client-only, and invisible to crawlers.** `useVisaCheck` is a `'use client'` hook holding `result` in local `useState`. There is no URL state, no `useSearchParams`, no route. Consequences verified live:

- The destination list is client-fetched: the server HTML contains **0 `<option>` elements**.
- No result state produces a crawlable URL. Every one of the thousands of nationality × residence × destination answers is unreachable to Google and to any AI crawler.
- No result content appears in server HTML at all.

**Lost opportunity, quantified.** The API serves 30+ destinations against a full nationality list. Even restricting to the ~40 nationalities that make up UAE residency and the 30 destinations, that is ~1,200 answerable "does a [nationality] passport holder living in the UAE need a visa for [country]" queries, a query shape with high volume and near-zero commercial competition. Today the site captures zero of them. Indexable result pages would look like `/uae/visa-check/indian-passport/france` with a server-rendered verdict, the max stay, the last-checked date, the official source link, and a CTA into the matching money page.

### Data integrity as a trust surface

This is the strongest part of the site. Every sampled answer (IN→FR, PK→XS, GB→US, IN→GR, IN→TR) returned all of:

- `outcome` (VISA_REQUIRED / EVISA / ETA / VISA_FREE)
- `officialSourceUrl` and `officialSourceName` (France-Visas, European Commission, US DHS, Greek MFA, Turkish MFA)
- `lastVerifiedAt` (all 2026-08-20, four weeks before this audit)
- `generalNotes` carrying real caveats, e.g. the Annex II conditional-exemption note and the ESTA travel-history disqualification

The UI renders both the last-checked date and a linked official source. **Zero answers were found missing either.** `source: "curated"` and `wasFallback: false` on all samples, so nothing is being served from a placeholder path.

**No seeded or placeholder rule was found rendering to users as fact.** The seed scripts under `apps/visawadi-backend/scripts/` (`seed-schengen-visa-rules.mjs`, `seed-uk-us-visa-rules.mjs`, `seed-tr-sa-visa-rules.mjs`) all populate real sourced rules with `officialSourceUrl` and a verification date.

The one caveat: `lastVerifiedAt` is uniform at 2026-08-20 across every destination, meaning it records a single bulk verification pass rather than per-rule checking. That is honest today but will read as stale as a block. A refresh cadence, per rule, is needed before this becomes a liability.

### Schema

**None.** The checker and its results carry no structured data of any kind. The type-appropriate options:

- On indexable result pages: `FAQPage` with the question as `"Do Indian citizens residing in the UAE need a visa for France?"`, plus a `Dataset` or `ClaimReview`-adjacent `citation` pointing at `officialSourceUrl`. `FAQPage` is the pragmatic choice.
- On the tool itself: `WebApplication` or `SoftwareApplication`.

### Conversion path

The result card renders a CTA to `/{country}/visa/{visaSlug}` **only when `needsAction && result.isServiced`**. `servicedSlugs` in `apps/visawadi-backend/src/routes/index.js` is:

```
schengen, united-kingdom, usa, canada, france-visa, germany-visa, italy-visa, spain-visa
```

**`greece-visa` and `saudi-arabia` are missing**, despite both having live, published, 1,700+ word money pages. Confirmed live: `check?destination=GR` returns `visaSlug: "greece-visa"` with `isServiced: false`, so a user who checks Greece gets a correct answer and **no CTA at all**, a dead end into a page that exists. Same for Saudi Arabia. This is a two-word fix with direct revenue impact.

---

## Phase 2 — On-page SEO (per page)

| URL | Title (len) | Meta desc len | H1 | Schema | Words | Int links out | Inbound | GSC c/i |
|---|---|---|---|---|---|---|---|---|
| / | Visa Assistance for UAE Residents \| VisaWadi (44) | 156 | Visa Assistance for UAE Residents | Organization, WebSite, WebPage, Service, FAQPage | 1400 | 19 | 73 | 6/34 |
| /uae | Visa Assistance for UAE residents \| VisaWadi (44) | 159 | Visa Assistance for UAE residents | Organization, WebSite, WebPage, Service, BreadcrumbList | 647 | 16 | 73 | 0/22 |
| /blog | Visa Guides, Tips, Requirements and Updates \| VisaWadi (54) | 139 | Blog | Organization, WebSite, WebPage, Blog, BreadcrumbList | 1275 | 31 | 73 | 0/1 |
| /blog/tags | Blog Tags \| VisaWadi (20) | 118 | Blog Tags | Organization, WebSite, WebPage, BreadcrumbList | 327 | 28 | 13 | 0/0 |
| /faq | Visa Assistance FAQ \| Common Questions Answered \| VisaWadi (58) | 123 | Frequently Asked Questions | Organization, WebSite, WebPage, FAQPage, BreadcrumbList | 750 | 15 | 18 | 0/2 |
| /about | About Us \| VisaWadi (19) | 163 ⚠ | About VisaWadi | **NONE** | 209 | 15 | 0 | 1/13 |
| /contact | Contact Us \| VisaWadi (21) | 163 ⚠ | Contact Us | **NONE** | 106 | 15 | 73 | 1/20 |
| /terms-and-conditions | Terms & Conditions \| VisaWadi (33) | 126 | Terms & Conditions | BreadcrumbList | 545 | 15 | 73 | 0/24 |
| /privacy-policy | Privacy Policy \| VisaWadi (25) | 111 | Privacy Policy | BreadcrumbList | 501 | 15 | 73 | 0/0 |
| /blog/tags/processing-times | Processing Times \| Blog Tag \| VisaWadi (38) | 67 | Processing Times | Organization, WebSite, WebPage, Blog, BreadcrumbList | 155 | 17 | 2 | 0/0 |
| /blog/tags/appointments-and-biometrics | Appointments & Biometrics \| Blog Tag \| VisaWadi (51) | 95 | Appointments & Biometrics | Organization, WebSite, WebPage, Blog, BreadcrumbList | 224 | 18 | 3 | 0/0 |
| /blog/tags/visa-refusals | Visa Refusals \| Blog Tag \| VisaWadi (35) | 74 | Visa Refusals | Organization, WebSite, WebPage, Blog, BreadcrumbList | 145 | 17 | 2 | 0/0 |
| /blog/tags/canada-visa | Canada Visa \| Blog Tag \| VisaWadi (33) | 99 | Canada Visa | Organization, WebSite, WebPage, Blog, BreadcrumbList | 157 | 17 | 2 | 0/0 |
| /blog/tags/uk-visa | UK Visa \| Blog Tag \| VisaWadi (29) | 100 | UK Visa | Organization, WebSite, WebPage, Blog, BreadcrumbList | 146 | 17 | 2 | 0/0 |
| /blog/tags/us-visa | US Visa \| Blog Tag \| VisaWadi (29) | 94 | US Visa | Organization, WebSite, WebPage, Blog, BreadcrumbList | 80 | 16 | 1 | 0/0 |
| /blog/tags/visa-tips | Visa Application Tips for UAE Residents \| VisaWadi (50) | 125 | Visa Tips | Organization, WebSite, WebPage, Blog, BreadcrumbList | 1226 | 32 | 33 | 0/0 |
| /blog/tags/europe-travel | Europe Travel Guides for UAE Residents \| VisaWadi (49) | 117 | Europe Travel | Organization, WebSite, WebPage, Blog, BreadcrumbList | 873 | 28 | 13 | 0/0 |
| /blog/tags/flight-itinerary | Flight Itinerary for Visa Applications \| VisaWadi (49) | 125 | Flight Itinerary | Organization, WebSite, WebPage, Blog, BreadcrumbList | 1000 | 28 | 13 | 0/0 |
| /blog/tags/visa-documents | Visa Document Guides for UAE Applicants \| VisaWadi (50) | 125 | Visa Documents | Organization, WebSite, WebPage, Blog, BreadcrumbList | 1267 | 32 | 41 | 0/0 |
| /blog/tags/uae-travel | Travel Guides for UAE Residents \| VisaWadi (42) | 111 | UAE Travel | Organization, WebSite, WebPage, Blog, BreadcrumbList | 832 | 26 | 11 | 0/0 |
| /blog/tags/travel-insurance | Travel Insurance Guides for UAE Residents \| VisaWadi (52) | 139 | Travel Insurance | Organization, WebSite, WebPage, Blog, BreadcrumbList | 1109 | 32 | 19 | 0/0 |
| /blog/tags/schengen-visa | Schengen Visa Tips and Guides \| VisaWadi (40) | 129 | Schengen Visa | Organization, WebSite, WebPage, Blog, BreadcrumbList | 1182 | 32 | 29 | 0/0 |
| /uae/visa/canada | Canada Visa from UAE \| TRV Visa Assistance \| VisaWadi (53) | 149 | Canada Visa from UAE — Strong Applications, Faster Decisions | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1754 | 15 | 73 | 0/77 |
| /uae/visa/france-visa | France Visa from UAE \| France-Visas Portal and VFS Booking \| VisaWadi (69 ⚠) | 154 | France Visa from the UAE, Filed Through France-Visas | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1774 | 15 | 73 | 0/516 |
| /uae/visa/germany-visa | Germany Visa from UAE \| VIDEX Form and VFS Booking \| VisaWadi (61 ⚠) | 156 | Germany Visa from the UAE, Decided in Dubai | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1744 | 15 | 73 | 0/336 |
| /uae/visa/greece-visa | Greece Visa from UAE \| VFS Wafi Booking and Documents \| VisaWadi (64 ⚠) | 156 | Greece Visa from the UAE, Filed at Wafi | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1723 | 15 | 73 | 0/0 |
| /uae/visa/italy-visa | Italy Visa from UAE \| VFS Booking and Document Preparation \| VisaWadi (69 ⚠) | 150 | Italy Visa from the UAE, Prepared for the Counter | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1771 | 15 | 73 | 0/0 |
| /uae/visa/saudi-arabia | Saudi Visa for UAE Residents \| Tourist eVisa from Dubai \| VisaWadi (66 ⚠) | 159 | Saudi Tourist Visa for UAE Residents | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1788 | 15 | 2 | 0/0 |
| /uae/visa/schengen | Schengen Visa from UAE \| Visa Assistance \| VisaWadi (51) | 153 | Schengen Visa Assistance From UAE | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1783 | 15 | 73 | 0/82 |
| /uae/visa/spain-visa | Spain Visa from UAE \| BLS Account, Annex A and Booking \| VisaWadi (65 ⚠) | 146 | Spain Visa from the UAE, Filed Through BLS | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1764 | 15 | 73 | 0/82 |
| /uae/visa/united-kingdom | UK Visa from UAE \| Visa Assistance \| VisaWadi (45) | 140 | UK Visa from UAE — Expert Guidance, No Guesswork | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1648 | 15 | 73 | 0/355 |
| /uae/visa/usa | US Visa from UAE \| B1/B2 Visa Assistance \| VisaWadi (51) | 151 | US Visa from UAE — Interview Preparation That Gets Approvals | Organization, WebSite, WebPage, Service, FAQPage, BreadcrumbList | 1737 | 15 | 73 | 0/1 |
| /authors/ammar-afridi | Ammar Afridi \| VisaWadi (23) | 601 ⚠ | Ammar Afridi | Organization, WebSite, ProfilePage, Person, BreadcrumbList | 3102 | 55 | 40 | 0/0 |

Every page carries exactly one H1, a title, a meta description, a canonical, OG tags and `twitter:card`. Nothing is missing across all 73 URLs.

### On-page flags

| Flag | Affected |
|---|---|
| **Title > 60 chars** (6 money pages) | `france-visa` (69), `italy-visa` (69), `saudi-arabia` (66), `spain-visa` (65), `greece-visa` (64), `germany-visa` (61). All will truncate in SERPs, cutting the differentiating detail (VIDEX, Annex A, Wafi) that is the whole point of those titles |
| **Meta description > 160** | `/about` (163), `/contact` (163), `/authors/ammar-afridi` (**601**, roughly 4× the display limit) |
| **Duplicate title + H1** | `/` and `/uae` both use "Visa Assistance for UAE Residents/residents \| VisaWadi" as title and H1. Two URLs, one target keyword |
| **Thin content** | `/contact` (106 words), `/about` (209), `/blog/tags/us-visa` (80, **zero posts**), `/blog/tags/visa-refusals` (145), `/blog/tags/uk-visa` (146), `/blog/tags/processing-times` (155), `/blog/tags/canada-visa` (157), `/blog/tags/appointments-and-biometrics` (224) |
| **No JSON-LD** | `/about`, `/contact` |
| **Generic fallback titles** | 6 tag pages use the `<Tag> \| Blog Tag \| VisaWadi` template while the other 7 have hand-written, keyword-targeted titles |
| **Heading level skip (h1 → h3)** | `/blog` and all 13 tag pages. No h2 on any listing page |
| **Em dash in H1** (house style breach) | `/uae/visa/canada`, `/uae/visa/united-kingdom`, `/uae/visa/usa` |
| **No clear target keyword** | `/blog/tags/uae-travel` ("Travel Guides for UAE Residents") and `/blog/tags/visa-tips` are broad category pages with no head term |
| **Cannibalisation** | `/` vs `/uae` (as above). Also `/uae/visa/schengen` vs `/uae/visa/france-visa` / `germany-visa` / `italy-visa` / `spain-visa` / `greece-visa`, which all target "Schengen visa from UAE" variants. The country pages were deliberately differentiated (`differentiate-schengen-country-pages.mjs`) and each now leads on a distinct hook (France-Visas portal, VIDEX, BLS/Annex A, Wafi), so this is managed, not broken |

**Pricing consistency across money pages (HOUSE FACT 3):** the six Schengen-family pages all render **Basic AED 299 / Standard AED 599 / Concierge AED 699**, matching the confirmed tiers exactly, with a consistent `pricingBreakdown` note. No mismatch.

However, the non-Schengen pages reuse the same **tier names for wildly different prices**:

| Page | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Schengen family (6 pages) | Basic 299 | **Standard 599** | **Concierge 699** |
| Canada | **Standard 699** | Express 1199 | **Concierge 2299** |
| United Kingdom | **Standard 699** | Express 1299 | **Concierge 2499** |
| United States | **Standard 799** | Express 1499 | **Concierge 2799** |
| Saudi Arabia | "Tourist Visa for GCC Residents" 700 (single tier) | | |

"Concierge" means AED 699 on one page and AED 2,799 on another. For a user comparing two pages, and for an LLM asked "how much is VisaWadi's Concierge package", that is an unanswerable contradiction.

**Destination scope (HOUSE FACT 5):** the brief states Schengen is live and US/UK/Turkiye are roadmap. The codebase says otherwise, and the codebase is what ships: `/uae/visa/usa`, `/uae/visa/united-kingdom`, `/uae/visa/canada` and `/uae/visa/saudi-arabia` are all published, 1,600-1,800 words, priced, in the sitemap, in the nav and in the footer. `apps/visawadi-frontend/CLAUDE.md` describes the UK/US/Canada packages as real and deliberately structured differently (guidance on the flight reservation rather than the reservation itself). **No page promises a destination with no live page behind it.** Türkiye has no page, and correctly no nav item, though the checker returns Türkiye answers with `visaSlug: null` and therefore no CTA, which is the right behaviour. Flagging this as a brief-vs-build divergence to reconcile, not as a site defect.

---

## Phase 3 — Content and blog audit

40 published posts: 30 migrated from Travl in August 2026, 10 written post-split.

### Collection-level health

| Signal | Result |
|---|---|
| `quickAnswer` ("The Short Answer" block) | **40 / 40** |
| FAQ block + `FAQPage` schema | **40 / 40** |
| `metaTitle` and `metaDescription` | **40 / 40**, only one over 60 chars |
| Cover image | **40 / 40**, all on `res.cloudinary.com/.../visawadi/blog/` |
| Author assigned | **40 / 40**, all linked by `@id` to `/authors/ammar-afridi` |
| Tags assigned | **40 / 40** |
| Images missing alt text in body | **0** |
| `BlogPosting` schema with `datePublished` + `dateModified` | **40 / 40** |
| Word count | min 685, median 1,296, max 2,858. Only one post under 800 |
| **Authoritative outbound citations** | **5 / 40.** 35 posts cite nothing official |
| **Last-checked date in body** | **0 / 40** |
| Comparison table in body | **4 / 40** |
| Question-shaped H2 | 36 / 40 |

### Rebranding artefacts and factual errors

| Post | Issue | Severity |
|---|---|---|
| `bls-international-uae-schengen-visa-application-guide` | Anchor text "**VisaWadi.ae** FAQ". Wrong TLD, live in body copy | High |
| `spain-visa-uae-bls-international-process` (written 2026-09-03) | Table states the Schengen fee as **EUR 80 / EUR 40 for children**. The correct 2026 rate is EUR 90 / EUR 45, which every other page on the site uses | High |
| `schengen-visa-fees-...` | Quick answer says EUR 90 ≈ **AED 360**; body says **AED 355 to 370**; all six money pages say **AED 385** | High |
| `italy-visa-from-uae-...` | Says **AED 350** in one place and **AED 385** in another, within the same post | High |
| `netherlands-visa-from-uae-...` | Says **AED 360** in one place and **AED 385** in another | High |
| `switzerland-visa-from-uae-...` | Says **AED 360** in one place and **AED 385** in another | High |
| `single-entry-vs-multiple-entry-schengen-visa-...` | "approval rates are slightly higher for first-time applicants" with no source | Medium |
| `schengen-visa-for-first-time-applicants-...` | "different embassies have different reputations for approval rates" with no source | Low |
| 6 posts (`are-dummy-tickets-legal`, `dummy-ticket-providers-compared`, `dummy-ticket-vs-real-flight-booking`, `what-is-a-dummy-ticket`, `schengen-visa-for-first-time-applicants`, `what-to-do-if-your-schengen-visa-is-delayed`) | Position the Travl itinerary generator as a separate USD 13 purchase, when the VisaWadi package the same post is selling already includes an itinerary | Medium |
| 38 pages, 347 occurrences | Em dashes throughout, against house style | Low |

No broken sentences, wrong-currency dummy-ticket pricing (all USD, correctly), or competitor recommendations were found. The `fix-cross-brand-blog-content.mjs` pass did its job; the residue above is what it missed.

### dateModified freshness

**36 of 40 posts carry `updatedAt = 2026-08-23`**, a single bulk touch. Those values render on-page as "Updated 23 Aug 2026" and are emitted as `dateModified` in `BlogPosting`, **and** are used as `lastModified` in the sitemap. Three signals all claiming 36 posts were revised the same day, when the last real content change was the automated rebranding script. This is exactly the pattern Google discounts, and repeating it will train the crawler to ignore the field. The four honest dates are the four posts written after 23 August.

### Topical clusters

| Cluster | Posts | Money page | Structure |
|---|---|---|---|
| Schengen core | 27 | `/uae/visa/schengen` | **Flat pile.** All 27 link to the money page, but the money page links back to none of them, and there is no designated hub |
| Dummy tickets / flight reservations | 12 | none on VisaWadi (DT365 owns it) | Coherent cluster, monetised off-domain |
| Travel insurance | 17 | none on VisaWadi (Travl owns it) | **Largest non-monetisable cluster on the site** |
| Non-Schengen destinations (Australia, China, India, Vietnam, Malaysia, South Korea) | 6 | **none** | Six well-written 2,600+ word posts serving destinations with no service page. Pure traffic, zero conversion path |
| UK / US / Canada | 5 | `/uae/visa/united-kingdom`, `/usa`, `/canada` | Thin cluster relative to the money pages behind it |

**Gaps:** no post targets "schengen visa assistance", "visa agent Dubai", "visa consultant UAE" or any commercial-intent service query. Every post is informational. The site has no bottom-of-funnel content, so the money pages have to rank on their own.

**Orphan posts:** none. Every post has at least 2 inbound internal links.

**Money pages receiving zero blog links:** `/uae/visa/saudi-arabia` and `/uae/visa/greece-visa` get no contextual blog links (greece is linked only via the footer).

### Per-post table

| Post | Src | Pub | Mod | Words | Q-H2 | Table | Cites | Money links | Cross-dom | Inbound | GSC c/i |
|---|---|---|---|---|---|---|---|---|---|---|---|
| australia-visitor-visa-from-uae-subclass-600-explained | mig | 2026-08-01 | 2026-08-23 | 2858 | Y | N | **0** | 10 (1 legacy) | 4 | 4 | 0/23 |
| china-visa-from-uae-tourist-visa-application-process | mig | 2026-08-02 | 2026-08-23 | 2800 | Y | N | **0** | 10 (1 legacy) | 4 | 5 | 0/27 |
| south-korea-visa-from-uae-documents-and-application-tips | mig | 2026-08-03 | 2026-08-23 | 2689 | Y | N | **0** | 10 (1 legacy) | 7 | 6 | 0/6 |
| vietnam-visa-from-uae-e-visa-and-visa-on-arrival-guide | mig | 2026-08-06 | 2026-08-23 | 2667 | Y | N | **0** | 10 (1 legacy) | 5 | 6 | 0/0 |
| schengen-visa-for-first-time-applicants-how-to-prove-strong-ties-to-the-uae | mig | 2026-07-14 | 2026-08-23 | 2630 | Y | N | **0** | 10 (1 legacy) | 3 | 2 | 0/2 |
| usa-b1b2-visa-from-uae-complete-application-guide | mig | 2026-07-30 | 2026-08-23 | 2557 | Y | N | **0** | 10 (1 legacy) | 5 | 3 | 0/4 |
| how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide | mig | 2026-04-29 | 2026-08-23 | 2260 | Y | N | **0** | 10 (1 legacy) | 4 | 11 | 0/20 |
| malaysia-visa-from-uae-requirements-for-uae-residents | mig | 2026-08-05 | 2026-08-23 | 2230 | Y | N | **0** | 10 (1 legacy) | 4 | 6 | 0/28 |
| uk-visa-refusal-reasons-uae-reapply | new | 2026-08-23 | 2026-08-23 | 1722 | Y | Y | 19 | 11 (1 legacy) | 1 | 6 | 0/0 |
| schengen-visa-documents-checklist-for-uae-residents | mig | 2026-04-30 | 2026-08-23 | 1625 | Y | N | **0** | 10 (1 legacy) | 4 | 28 | 0/35 |
| schengen-visa-travel-insurance-requirements-minimum | new | 2026-09-05 | 2026-09-05 | 1612 | Y | Y | 24 | 11 (1 legacy) | 2 | 44 | 0/0 |
| schengen-country-apply-through-main-destination | new | 2026-08-24 | 2026-08-24 | 1535 | Y | Y | 11 | 15 (1 legacy) | 2 | 32 | 0/12 |
| schengen-visa-interview-questions-how-to-prepare-from-the-uae | mig | 2026-05-19 | 2026-08-23 | 1461 | **N** | N | **0** | 10 (1 legacy) | 2 | 2 | 0/2 |
| india-visa-from-uae-e-visa-vs-sticker-visa-explained | mig | 2026-08-04 | 2026-08-23 | 1443 | Y | N | **0** | 10 (1 legacy) | 4 | 5 | 0/18 |
| single-entry-vs-multiple-entry-schengen-visa-which-one-should-you-get | mig | 2026-05-19 | 2026-08-23 | 1374 | Y | N | **0** | 10 (1 legacy) | 3 | 3 | 0/36 |
| spain-visa-uae-bls-international-process | new | 2026-09-03 | 2026-09-03 | 1373 | Y | Y | 10 | 11 (1 legacy) | 2 | 44 | 0/9 |
| usa-visa-interview-at-the-dubai-embassy-questions-and-tips | mig | 2026-07-31 | 2026-08-23 | 1370 | Y | N | **0** | 10 (1 legacy) | 4 | 3 | 0/17 |
| dummy-ticket-vs-real-flight-booking-which-one-does-your-visa-need | new | 2026-08-11 | 2026-08-23 | 1353 | Y | N | **0** | 10 (1 legacy) | 7 | 7 | 0/3 |
| dummy-ticket-providers-compared-what-to-look-for-before-you-buy | new | 2026-08-11 | 2026-08-23 | 1302 | Y | N | **0** | 10 (1 legacy) | 8 | 10 | 0/34 |
| schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them | mig | 2026-05-04 | 2026-08-23 | 1296 | **N** | N | **0** | 10 (1 legacy) | 4 | 24 | 0/1 |
| why-buying-a-real-ticket-before-your-visa-is-approved-is-a-risky-move | mig | 2026-04-16 | 2026-08-23 | 1231 | Y | N | **0** | 10 (1 legacy) | 5 | 30 | 0/4 |
| what-to-do-if-your-schengen-visa-is-delayed-past-your-travel-date | new | 2026-08-11 | 2026-08-23 | 1226 | Y | N | **0** | 10 (1 legacy) | 4 | 8 | 2/46 |
| pnr-codes-explained-what-they-are-and-how-visa-officers-verify-them | mig | 2026-04-16 | 2026-08-23 | 1210 | Y | N | **0** | 10 (1 legacy) | 6 | 20 | 2/246 |
| how-long-does-a-schengen-visa-take-to-process-from-dubai | mig | 2026-05-04 | 2026-08-23 | 1134 | Y | N | **0** | 10 (1 legacy) | 4 | 14 | 0/55 |
| netherlands-visa-from-uae-documents-and-process-explained | mig | 2026-07-25 | 2026-08-23 | 1081 | Y | N | **0** | 10 (1 legacy) | 4 | 4 | 0/45 |
| uk-visa-from-uae-standard-visitor-visa-application-guide | mig | 2026-07-28 | 2026-08-23 | 1032 | Y | N | **0** | 10 (1 legacy) | 2 | 5 | 0/5 |
| schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants | mig | 2026-05-04 | 2026-08-23 | 1026 | **N** | N | **0** | 10 (1 legacy) | 5 | 10 | 8/1990 |
| what-is-a-dummy-ticket-and-when-do-you-need-one | new | 2026-08-11 | 2026-08-23 | 1017 | Y | N | **0** | 10 (1 legacy) | 3 | 7 | 0/39 |
| bls-international-uae-schengen-visa-application-guide | mig | 2026-06-19 | 2026-08-23 | 1017 | Y | N | **0** | 10 (1 legacy) | 4 | 3 | 0/10 |
| are-dummy-tickets-legal-what-uae-visa-applicants-should-know | new | 2026-08-11 | 2026-08-23 | 979 | Y | N | **0** | 10 (1 legacy) | 2 | 7 | 0/7 |
| greece-visa-from-uae-how-to-apply-and-what-to-expect | mig | 2026-07-26 | 2026-08-23 | 977 | Y | N | **0** | 10 (1 legacy) | 4 | 5 | 0/283 |
| france-visa-from-uae-application-process-documents-and-tips | mig | 2026-07-22 | 2026-08-23 | 946 | Y | N | **0** | 10 (1 legacy) | 3 | 4 | 0/745 |
| vfs-global-dubai-booking-appointments-and-what-to-expect | mig | 2026-06-18 | 2026-08-23 | 936 | Y | N | **0** | 10 (1 legacy) | 3 | 2 | 2/266 |
| schengen-visa-bank-statement-requirements-for-uae-residents | mig | 2026-07-21 | 2026-08-23 | 933 | Y | N | **0** | 10 (1 legacy) | 2 | 3 | 3/100 |
| italy-visa-from-uae-requirements-and-application-process | mig | 2026-07-24 | 2026-08-23 | 927 | Y | N | **0** | 10 (1 legacy) | 3 | 4 | 0/694 |
| proof-of-accommodation-for-schengen-visa-what-uae-applicants-need | mig | 2026-06-20 | 2026-08-23 | 897 | **N** | N | **0** | 10 (1 legacy) | 2 | 4 | 0/16 |
| switzerland-visa-from-uae-requirements-for-schengen-applicants | mig | 2026-07-27 | 2026-08-23 | 883 | Y | N | **0** | 10 (1 legacy) | 4 | 4 | 0/156 |
| proof-of-onward-travel-for-schengen-visa-why-dummy-tickets-work | mig | 2026-07-20 | 2026-08-23 | 835 | Y | N | **0** | 10 (1 legacy) | 3 | 3 | 0/1 |
| germany-visa-from-uae-step-by-step-application-guide | mig | 2026-07-23 | 2026-08-23 | 821 | Y | N | **0** | 10 (1 legacy) | 3 | 3 | 0/245 |
| canada-visa-biometrics-uae | new | 2026-09-06 | 2026-09-06 | 685 | Y | N | 8 | 11 (1 legacy) | 0 | 18 | 0/0 |

`Src`: mig = migrated from Travl, new = written post-split. `Q-H2` = at least one question-shaped H2. `Cites` = outbound links to government / VFS / BLS / official sources. `Money links` = links to `/uae/visa/*` or `/visa/*`; the legacy count in brackets is links passing through a 308.

---

## Phase 4 — AEO / GEO

### Verdict-first

**Strong.** All 40 posts open with a "The Short Answer" block rendered directly under the H1, before the intro prose, and it is server-rendered. Example from the top-performing post:

> The standard Schengen visa fee in 2026 is EUR 90 for adults (approximately AED 360). On top of that, UAE applicants typically pay VFS or BLS service charges, travel insurance, and a dummy ticket, bringing the total closer to AED 500-600.

That is a directly-extractable answer in the first 40 words. This pattern is the single best AEO asset the site has.

**Exception:** the money pages bury the answer. `/uae/visa/schengen` opens with a hero headline and a package grid; there is no 40-80 word "what this costs and how long it takes" block. The commercial pages, which are the ones that should be cited when a model is asked "how much does Schengen visa help cost in Dubai", have no extractable summary.

### Quick-answer targets

- Six posts have a `quickAnswer` **under 40 words**, below the extractable-snippet floor: `schengen-visa-rejection-top-10-reasons` (29), `schengen-visa-interview-questions` (34), `how-long-does-a-schengen-visa-take` (35), `proof-of-accommodation` (36), `single-entry-vs-multiple-entry` (37), `bls-international-uae-schengen-visa-application-guide` (38).
- **Four posts have no question-shaped H2 at all**, and one of them is the site's best performer: `schengen-visa-fees-in-2026-...`. Its H2s are "The Standard Schengen Visa Fee", "VFS Global and BLS International Service Charges", "What the Total Cost Looks Like". The GSC data shows this page ranking positions 4.6-13.6 for 22 separate "how much / cost / fee" queries at **0% CTR**. Turning those H2s into the literal questions ("How much does a Schengen visa cost in 2026?") is the highest-leverage AEO change available.
- `FAQPage` is present on **52 pages** (40 posts + 10 money pages + `/faq` + `/`). Excellent coverage.
- **Only 4 of 40 posts contain a table.** Fees, processing times and document checklists are all prose. Comparative and numeric data in a table is materially more extractable, and this content is almost entirely comparative and numeric.

### Citability and provenance

This is where the site scores worst, and it is the dimension that matters most for a YMYL-adjacent topic.

| Signal | Result |
|---|---|
| Posts citing an official source | **5 / 40** (all written post-split: `canada-visa-biometrics-uae`, `schengen-visa-travel-insurance-requirements-minimum`, `spain-visa-uae-bls-international-process`, `schengen-country-apply-through-main-destination`, `uk-visa-refusal-reasons-uae-reapply`) |
| Posts with a last-checked / as-of date | **0 / 40** |
| Money pages citing an official source | **0 / 10** |
| Checker answers with source + date | **all sampled** |

The 35 migrated posts state visa fees, processing times, document requirements and refusal grounds flatly, with no date and no link to the embassy, VFS, BLS or the EU regulation they derive from. That is precisely HOUSE FACT 6's failure mode, at scale. The five new posts show the team knows how to do it (8-24 authoritative citations each), so this is a backfill problem, not a capability problem.

The one specific credibility risk: `/uae/visa/schengen` states, in body copy **and in its `FAQPage` schema**, "We have a high success rate on second applications when the first was professionally reanalysed." An unsourced success-rate claim, machine-readable, on the primary money page, is both an AI-citation liability and a paid-ads policy exposure. To the site's credit, `/faq` handles the adjacent question well ("Can you guarantee my visa will be approved? No, and be careful with anyone who says they can"), and `remove-unsourced-approval-stats.mjs` shows a prior cleanup pass; this one survived it.

**No claim of government affiliation, official status or guaranteed approval was found anywhere.** The Terms explicitly disclaim outcome guarantees. `/about` is unambiguous about what the service is.

### Consistency

| Claim | Told consistently? |
|---|---|
| Schengen package prices (299/599/699) | **Yes**, across all six pages and `pricingBreakdown` |
| Tier names | **No.** "Standard" is 599 or 699 or 799; "Concierge" is 699 or 2,299 or 2,499 or 2,799 |
| EUR 90 in dirhams | **No.** AED 350, 355-370, 360 and 385 all appear |
| Schengen fee in EUR | **No.** One post says EUR 80 / EUR 40 |
| Package inclusions | **No, and this is the worst one.** `/about`: "We do **not** sell travel insurance, flight reservations or hotel bookings." `/terms-and-conditions`: "We do **not** sell or issue travel insurance, flight reservations, dummy tickets or hotel bookings." Meanwhile every Schengen package lists a dummy flight reservation, hotel reservation and 9-day travel insurance among its features, and the `/uae/visa/schengen` FAQ schema says "**Your package includes the flight reservation, so we book it in the format your embassy expects.**" A customer reading the Terms would conclude the package does not include what the sales page promises |
| Processing time (15 calendar days) | **Yes** |
| Destination availability | **Yes**, nav / footer / sitemap / pages all agree (except Saudi Arabia's absence from the footer) |

### Machine access

- `robots.txt` allows all user agents. **No AI crawler is blocked**, intentionally or otherwise. GPTBot, ClaudeBot, PerplexityBot, CCBot are all free to crawl.
- Pricing, FAQs and quick answers are all server-rendered and extractable without JS.
- **The checker's answers, the site's most citable content, are entirely client-rendered and therefore invisible to every AI crawler.** The most authoritative, best-sourced, most frequently-updated content on the domain cannot be cited by anything.

---

## Phase 5 — Internal linking and equity

### Structure

The site uses a **footer-boilerplate link model**. The footer carries 15 links (home, `/uae`, `/blog`, 9 of 10 visa pages, `/contact`, `/privacy-policy`, `/terms-and-conditions`), which is why 15 URLs each show exactly 73 inbound links. Beyond that:

- **The 10 money pages have exactly 15 outbound internal links each: the footer, and nothing else.** No money page links to a single blog post, guide, FAQ or related destination. The Schengen cluster is 27 posts feeding one page that feeds nothing back. There is no hub-and-spoke; there is a funnel with a closed end.
- The homepage links to all 10 money pages plus the 3 most recent posts. It does not link to `/about` or `/faq`.
- Blog posts carry 10-12 money-page links each, which is generous and well distributed.

### Inbound link distribution (excluding footer boilerplate)

| Rank | Page | Inbound |
|---|---|---|
| 1 | `/blog/schengen-visa-travel-insurance-requirements-minimum` | 44 |
| 1 | `/blog/spain-visa-uae-bls-international-process` | 44 |
| 3 | `/blog/tags/visa-documents` | 41 |
| 4 | `/authors/ammar-afridi` | 40 |
| 5 | `/blog/tags/visa-tips` | 33 |
| 6 | `/blog/schengen-country-apply-through-main-destination` | 32 |
| … | | |
| — | `/uae/visa/saudi-arabia` | **2** |
| — | `/about` | **0** |

### Findings

1. **The top internal-equity recipient on the site is a travel insurance post.** 44 inbound links point at `/blog/schengen-visa-travel-insurance-requirements-minimum`, whose commercial payoff is an exit to travl.ae. The second, `/blog/spain-visa-uae-bls-international-process`, is also the post carrying the EUR 80 error.
2. **40 blog CTAs go through a 308.** Every migrated post's primary money-page CTA points at legacy `/visa/schengen`, `/visa/usa`, etc. 40 of 409 blog-to-money links take a redirect hop, and they are disproportionately the *conversion* links rather than the contextual ones. GSC confirms the cost: `/visa/france-visa` (226 impr, pos 86.5), `/visa/canada` (190 impr, pos 88.9) and `/visa/united-kingdom` (105 impr, pos 78.5) are **still indexed on visawadi.com** and still accumulating impressions, competing with their own canonical targets. The internal links are what keeps them alive.
3. **`/about` is a true orphan.** Zero inbound links, yet it ranks at position 3.77 and converts 1 click from 13 impressions (7.69% CTR, the site's second-best). A page with proven CTR and zero internal support.
4. **`/uae/visa/saudi-arabia` is near-orphaned.** Absent from the footer while its 9 siblings each receive 73 inbound links. It is 1,788 words, priced, published and in the sitemap.
5. **Anchor text.** Blog CTAs use descriptive anchors ("Schengen visa assistance", "France visa page"), which is good. The footer uses bare destination names ("France", "Germany", "Spain"), which is acceptable for navigation. No "click here" / "read more" generic anchors were found in content.
6. **One strong internal link away.** `/blog/schengen-visa-fees-...` is the site's authority page (8 clicks, 1,990 impressions, position 9.35, and the entry point for 22 striking-distance queries). It links to `/visa/schengen` through a redirect. `/uae/visa/schengen` currently sits at position 79 with 82 impressions. Repointing that link, and adding reciprocal links from the money page back into the fee, processing-time and documents posts, is the clearest equity path available.

### Internal-to-cross-domain ratio on money pages

| Page | Internal out | Cross-domain out |
|---|---|---|
| `/` | 19 | **0** |
| `/uae` | 16 | **0** |
| All 10 `/uae/visa/*` | 15 each | **0** |

Clean. No money page leaks a single link off-domain.

---

## Phase 6 — GSC-informed opportunities

VisaWadi totals for the window: **25 clicks, 7,481 impressions, 73 pages**. First impression 10 August 2026. Mobile 14 clicks / 1,649 impr / pos 42.7; desktop 10 / 3,608 / 65.7. UAE accounts for 18 of 25 clicks and 4,203 of 7,481 impressions, which is exactly the intended audience.

### Striking-distance queries (position 4-15, impressions ≥ 5)

Every one of these maps to a **single page**, `/blog/schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants`, and all but two convert zero clicks.

| Query | Impr | Pos | Clicks |
|---|---|---|---|
| schengen visa fee | 85 | 5.9 | 0 |
| schengen visa cost | 58 | 9.1 | 0 |
| schengen visa fees | 36 | 12.4 | 1 |
| schengen visa cost from uae | 23 | 13.6 | 0 |
| schengen visa cost for uae residents | 19 | 8.7 | 0 |
| schengen visa fees from uae | 17 | **4.6** | 0 |
| how much is schengen visa fee | 13 | 6.6 | 0 |
| how much does schengen visa cost | 12 | 9.6 | 0 |
| how much schengen visa cost | 11 | 8.9 | 0 |
| how much is schengen visa | 10 | 9.0 | 0 |
| how much for schengen visa | 9 | 9.6 | 0 |
| schengen visa fee uae | 7 | 6.4 | 0 |
| schengen visa charges | 6 | 5.8 | 0 |
| schengen visa fee for uae residents | 6 | 6.7 | 0 |
| shengen visa cost | 6 | 7.3 | 0 |
| schengan visa cost | 6 | 10.3 | 0 |
| schengen visa price | 6 | 11.5 | 0 |
| schengen visa application fee | 5 | 6.2 | 1 |
| how much is schengen visa in uae | 5 | 8.4 | 0 |
| vfs global | 5 | 11.8 | 0 |
| dummyticket365 | 44 | 6.3 | 0 |
| dummy ticket 365 | 24 | 6.3 | 0 |

**Diagnosis.** 340+ impressions in positions 4-13 producing 2 clicks is not a ranking problem, it is a SERP-presentation problem. The current title is "Schengen Visa Fees 2026: Full Cost Breakdown for UAE" and the meta description opens "How much does a Schengen visa cost in 2026?" That is close, but the page loses to results that put the number in the title. The fix is to lead with the figure, and to make the H2s the literal questions, which also gives the page a shot at the AI Overview.

Two of the top queries, "dummyticket365" and "dummy ticket 365", are a sister brand's navigational terms at position 6.3. VisaWadi should not rank for those; a user typing them wants dummyticket365.com. Not urgent, but it inflates the impression count and depresses site-wide CTR.

### High-impression, zero-click pages

| Page | Impr | Pos | Diagnosis |
|---|---|---|---|
| `/blog/france-visa-from-uae-...` | 745 | 85.7 | Position, not CTR. Needs links and citations |
| `/blog/italy-visa-from-uae-...` | 694 | 80.1 | Same |
| `/uae/visa/france-visa` | 516 | 83.2 | Money page, page 8. Needs contextual internal links |
| `/uae/visa/united-kingdom` | 355 | 76.8 | Same |
| `/uae/visa/germany-visa` | 336 | 79.0 | Same |
| `/blog/greece-visa-from-uae-...` | 283 | 71.9 | Same |
| `/blog/schengen-visa-fees-...#travel-insurance` etc. (4 anchor rows) | 905 combined | **7.8** | Anchor-level results at position 7.8 with zero clicks. Google is surfacing jump links into this page and nobody is taking them. Strong signal that the on-page section headings are being read as answers but the SERP title is not earning the click |
| `/visa/france-visa` | 226 | 86.5 | **Legacy URL, should not be indexed** |
| `/visa/canada` | 190 | 88.9 | **Legacy URL, should not be indexed** |
| `/visa/united-kingdom` | 105 | 78.5 | **Legacy URL, should not be indexed** |

### Content gaps (ranking but untargeted)

The query export is dominated by three shapes with no dedicated page:

1. **VFS/BLS navigational and appointment queries** (~60 distinct queries: "vfs global dubai", "vfs appointment", "vfs global book appointment", "vfs dubai timings", "schengen visa appointment dubai"). Currently absorbed by `/blog/vfs-global-dubai-booking-appointments-and-what-to-expect` at position 29.6. A dedicated, well-sourced VFS/BLS Dubai hub with centre addresses, timings and booking steps would consolidate real volume.
2. **Cost queries for non-Schengen destinations** ("uk visit visa from dubai price", "canada visit visa from abu dhabi cost", "italy visit visa from dubai price", "dubai to spain visit visa price"). Dozens of these, all at positions 60-95. The money pages have `pricingBreakdown` data but their titles and H1s do not target the price modifier.
3. **PNR queries** ("what is a pnr code", "pnr number example", "pnr is not verified"). Served by `pnr-codes-explained-...` at position 41.9 despite the anchor-level rows ranking at 4.6-5.0. Another title/meta problem, not a content problem.

### Best-performing pages worth reinforcing

| Page | Clicks | Impr | Pos | CTR |
|---|---|---|---|---|
| `/blog/schengen-visa-fees-...` | 8 | 1,990 | 9.35 | 0.84% |
| `/` | 6 | 34 | 1.47 | **17.65%** |
| `/blog/schengen-visa-bank-statement-requirements-...` | 3 | 100 | 14.12 | 3.85% |
| `/blog/vfs-global-dubai-booking-appointments-...` | 2 | 266 | 29.56 | 0.75% |
| `/blog/pnr-codes-explained-...` | 2 | 246 | 41.86 | 1.23% |
| `/blog/what-to-do-if-your-schengen-visa-is-delayed-...` | 2 | 46 | 6.76 | 4.35% |
| `/about` | 1 | 13 | 3.77 | 7.69% |
| `/contact` | 1 | 20 | 5.55 | 5.00% |

The homepage at 17.65% CTR and position 1.47 shows brand queries are converting. `/about` and `/contact` both outperform on CTR and both lack schema; `/about` also lacks any internal link.

### Migration recovery view

Legacy Travl performance vs current VisaWadi performance, same slug, same 3-month window. The window straddles the migration, so Travl's numbers are largely pre-redirect and VisaWadi's are post.

| Slug | Travl (c/impr/pos) | VisaWadi (c/impr/pos) | Read |
|---|---|---|---|
| schengen-visa-fees-in-2026-... | 61 / 8,258 / 6.0 | 8 / 1,990 / 9.4 | **Recovering on track.** Best migrated asset, already back to page 1 |
| vfs-global-dubai-booking-... | 21 / 2,743 / 10.3 | 2 / 266 / 29.6 | Expected dip, recovering slowly |
| how-long-does-a-schengen-visa-take-... | 15 / 1,452 / 10.1 | 0 / 55 / 35.6 | Expected dip, early |
| schengen-visa-bank-statement-... | 13 / 879 / 6.1 | 3 / 100 / 14.1 | **Recovering on track** |
| pnr-codes-explained-... | 11 / 1,537 / 8.6 | 2 / 246 / 41.9 | Indexed, position not recovered |
| south-korea-visa-from-uae-... | 8 / 791 / 7.5 | 0 / 6 / 5.8 | Indexed at good position, almost no impressions yet |
| usa-visa-interview-at-the-dubai-embassy-... | 6 / 328 / 7.3 | 0 / 17 / 19.3 | Expected dip |
| bls-international-uae-schengen-... | 5 / 347 / 8.4 | 0 / 10 / 11.9 | Expected dip |
| usa-b1b2-visa-from-uae-... | 5 / 429 / 12.5 | 0 / 4 / 67.8 | Expected dip |
| china-visa-from-uae-... | 5 / 378 / 12.7 | 0 / 27 / 28.0 | Expected dip |
| france-visa-from-uae-... | 4 / 221 / 20.0 | 0 / **745** / 85.7 | Impressions up 3×, position collapsed. Reindexed but reranking |
| italy-visa-from-uae-... | 3 / 819 / 32.3 | 0 / **694** / 80.1 | Same |
| greece-visa-from-uae-... | 4 / 729 / 13.4 | 0 / 283 / 71.9 | Same |
| netherlands-visa-from-uae-... | 4 / 713 / 12.4 | 0 / 45 / 65.1 | Expected dip |
| uk-visa-from-uae-... | 4 / 803 / 45.5 | 0 / 5 / 71.0 | Expected dip |
| proof-of-accommodation-... | 3 / 236 / 7.3 | 0 / 16 / 40.3 | Expected dip |
| how-to-apply-for-a-schengen-visa-... | 3 / 451 / 8.8 | 0 / 20 / 20.0 | Expected dip |
| **vietnam-visa-from-uae-e-visa-and-visa-on-arrival-guide** | 3 / 175 / 7.7 | **NOT PICKED UP (0 impressions)** | **Actual problem.** The only migrated URL with zero GSC presence. The redirect works (verified 308 → 200) and the page is in the sitemap. Worth a manual URL inspection and indexing request |
| germany-visa-from-uae-... | 1 / 682 / 35.2 | 0 / 245 / 75.0 | Expected dip |
| malaysia-visa-from-uae-... | 2 / 566 / 8.9 | 0 / 28 / 28.9 | Expected dip |
| switzerland-visa-from-uae-... | 2 / 370 / 26.6 | 0 / 156 / 76.1 | Expected dip |
| australia-visitor-visa-... | 2 / 422 / 41.1 | 0 / 23 / 63.5 | Expected dip |
| india-visa-from-uae-... | 2 / 116 / 9.5 | 0 / 18 / 25.0 | Expected dip |
| single-entry-vs-multiple-entry-... | 1 / 262 / 16.9 | 0 / 36 / 65.2 | Expected dip |
| schengen-visa-for-first-time-applicants-... | 1 / 142 / 6.6 | 0 / 2 / **3.0** | Reindexed at position 3, impressions not yet flowing |
| Remaining 5 (documents-checklist, rejection-top-10, interview-questions, proof-of-onward-travel, why-buying-a-real-ticket) | 0 clicks each pre-migration | all indexed, low volume | No change |

**Summary.** 29 of 30 migrated URLs are indexed on visawadi.com. One (`vietnam-visa-from-uae-...`) has no GSC presence at all and needs manual attention. Nothing is broken: no redirect failure, no lost content, no cannibalisation by the sister domain. The aggregate drop (Travl earned ~190 clicks on these URLs; VisaWadi earns 25 site-wide) is a **normal migration dip on a four-week-old domain**, not a defect. The one structural drag is that legacy `/visa/*` URLs are still indexed on VisaWadi and still internally linked, splitting signals with their own canonical targets.

---

## Scoring

**Weights:** Technical SEO 25%, Content & Blog 20%, On-page SEO 15%, AEO/GEO 15%, Migration Integrity 15%, Internal Linking 10%.

| Bucket | Score | Justification |
|---|---|---|
| **Technical SEO** | **78** | Canonicals correct and self-referencing on 73/73, sitemap matches the route list exactly, robots and noindex placement correct, 404s handled, trailing slash consistent, zero broken internal links, all JSON-LD parses and reaches rendered HTML with no prop-name drop. Held back by: zero `Offer`/`priceSpecification` on 10 priced pages, no JSON-LD at all on `/about` and `/contact`, an empty tag page in the sitemap, missing apple-touch-icon and manifest, h1→h3 skips on 14 listing pages, and homepage images all lazy with no priority hint. **Lab CWV could not be measured** (no browser available), so the performance sub-component is scored on server-side proxies only. |
| **On-page SEO** | **72** | Every page has exactly one H1, a title, a description, a canonical and full OG/Twitter. No missing or duplicate descriptions. Deductions: 6 money-page titles over 60 chars losing their differentiating detail, a 601-char description on the author page, `/` and `/uae` sharing a title and H1, 6 thin tag pages plus one with no posts at all, `/contact` at 106 words, and em dashes in three H1s against house style. |
| **Content & Blog** | **62** | Structurally excellent: 40/40 posts have a quick answer, FAQ schema, alt text, cover image, author `@id` and complete metadata, with a 1,296-word median. The score is dragged down hard by provenance and accuracy: 35/40 posts cite no official source, 0/40 carry a last-checked date, 36/40 share a bulk `dateModified` of 2026-08-23 that misrepresents freshness in three places at once, and there are five separate factual contradictions on the exact fee figures the site ranks for, including a pre-2026 EUR 80 rate in a post written two weeks ago. |
| **AEO / GEO** | **58** | Verdict-first blocks on 40/40 posts and `FAQPage` on 52 pages are genuinely strong and server-rendered. But visa content is scored hard on provenance, and provenance is near-absent: no source links on 35 posts or any money page, no last-checked dates anywhere in content, only 4/40 posts using tables for comparative data, an unsourced success-rate claim baked into `FAQPage` schema on the primary money page, four separate AED figures for one EUR fee, a Terms page contradicting the product page on what is included, and the site's best-sourced content (the checker) entirely invisible to crawlers. AI crawlers are not blocked, which is the one thing that goes right. |
| **Internal Linking** | **60** | Every page is reachable and no post is orphaned, and the blog-to-money ratio (409:145 against cross-domain) is healthy. But the model is footer boilerplate: all 10 money pages have exactly 15 outbound internal links and not one contextual link out, so the 27-post Schengen cluster is a flat pile with no hub. `/about` has zero inbound links, `/uae/visa/saudi-arabia` has 2, 40 conversion CTAs pass through a 308 that keeps legacy URLs indexed, and the site's top internal-equity recipient is a post about a product sold on a different domain. |
| **Migration Integrity** | **71** | The redirect layer is close to exemplary: all 30 migrated post URLs plus the `/visa/*` and `/apply/*` wildcards resolve in a single permanent hop to a live 200, deliberately targeting the country-prefixed URL to avoid a chain, and all 33 distinct cross-domain links return 200 with no redirect. Analytics IDs are correct and distinct, and Cloudinary media is fully migrated. Deductions: legacy `/visa/*` still indexed and internally linked from 40 posts, a live "VisaWadi.ae" artefact, insurance-policy copy still on `/contact`, `/about` and Terms contradicting the migrated product definition, 11 stock assets byte-identical to Travl's, and `servicedSlugs` missing `greece-visa` and `saudi-arabia` so the checker dead-ends on two live products. |

**Overall: 68 / 100** = (78 × 0.25) + (62 × 0.20) + (72 × 0.15) + (58 × 0.15) + (71 × 0.15) + (60 × 0.10)

**Not fully assessed:** lab Core Web Vitals and mobile tap-target sizing (no browser). Production edge headers (measured against the local production build instead). These affect the Technical SEO bucket only; everything else was verified live.

---

## Fix list (ranked)

Impact is judged across rankings (R), AI presence (A) and conversion (C). Ranked High→Low by impact, then by lower effort, then by whether the fix unblocks others.

| # | Issue | Affected pages / scope | Category | Impact | Effort | Serves | Fix summary |
|---|---|---|---|---|---|---|---|
| 1 | `/about` and `/terms-and-conditions` state VisaWadi does not sell flight reservations, insurance or hotel bookings, while all 6 Schengen money pages and their FAQ schema say the package includes them | `/about`, `/terms-and-conditions`, 6 money pages | Factual / credibility | **High** | Low | A, C | Rewrite both to say the package *includes* a reservation, hotel booking, 9-day insurance and itinerary sourced on the customer's behalf, and that VisaWadi is not the issuer of record. Keeps the disclaimer accurate without contradicting the offer |
| 2 | The same EUR 90 fee is quoted as AED 350, 355-370, 360 and 385 across pages and within single posts | `schengen-visa-fees-...`, `italy-visa-from-uae-...`, `netherlands-...`, `switzerland-...`, 6 money pages | Factual / consistency | **High** | Low | R, A | Pick one figure (AED 385, matching the money pages), state it with an "at current rates, checked <date>" qualifier, and replace every other instance |
| 3 | `/blog/spain-visa-uae-bls-international-process` states the pre-2026 Schengen fee, EUR 80 / EUR 40 | 1 post (written 2026-09-03) | Factual error | **High** | Low | R, A, C | Correct to EUR 90 / EUR 45 and add the official-source link |
| 4 | 22 striking-distance fee/cost queries at positions 4.6-13.6 convert 0 clicks; the page has no question-shaped H2 | `/blog/schengen-visa-fees-...` | On-page / AEO | **High** | Low | R, A, C | Lead the title with the number ("Schengen Visa Cost from the UAE in 2026: AED 385 Embassy Fee Plus What Else You Pay"), rewrite the 7 H2s as literal questions, and put a 40-80 word answer under each |
| 5 | Unsourced "We have a high success rate on second applications" in body copy **and** `FAQPage` schema | `/uae/visa/schengen` | Credibility / ads policy | **High** | Low | A, C | Delete, or replace with a cited figure. Fix the source FAQ record so it leaves the schema too |
| 6 | `servicedSlugs` omits `greece-visa` and `saudi-arabia`, so the checker returns `isServiced: false` and renders **no CTA** for two live, priced money pages | `apps/visawadi-backend/src/routes/index.js`, checker on `/` and `/uae` | Live bug / conversion | **High** | Low | C | Add both slugs to the array |
| 7 | 40 blog CTAs point at legacy `/visa/*` which 308s; those legacy URLs are still indexed (`/visa/france-visa` 226 impr, `/visa/canada` 190 impr) competing with their own canonicals | 40 blog posts, 9 legacy URLs | Crawl / equity | **High** | Med | R, C | Rewrite the CTA hrefs in post content to `/uae/visa/*`. Keep the redirects in place for external links |
| 8 | No `Offer` or `priceSpecification` schema anywhere, despite 10 pages rendering explicit AED tiers | 10 money pages | Structured data | **High** | Med | R, A | Add `offers` to each `Service` node with one `Offer` per tier, `priceCurrency: AED`, and `priceSpecification` |
| 9 | 35 of 40 posts cite no official source; 0 of 40 carry a last-checked date | 35 posts | Provenance / AEO | **High** | High | A, R | Backfill an official-source link per factual claim and a visible "Last checked <date>" line. The 5 new posts are the template |
| 10 | `/contact` renders insurance-policy copy, an empty `<address>`, and a "View on Google Maps" anchor with **no href** | `/contact` | Live bug / brand leakage | **Med** | Low | C | Remove the policy-number sentence and the meta-description insurance reference; hide the office block and the maps link while `ADDRESS`/`GMB_URL` are null |
| 11 | `36/40` posts share `dateModified = 2026-08-23`, rendered on-page, in `BlogPosting` and in the sitemap | 36 posts | Freshness signal | **Med** | Low | R, A | Reset `updatedAt` to each post's genuine last content change, and only touch it on real edits going forward |
| 12 | Checker is fully client-rendered: no crawlable result URL, no `<option>` in server HTML, no schema. ~1,200 long-tail answers unreachable | Checker on `/` and `/uae` | Rendering / AEO | **Med** | High | R, A, C | Add `/uae/visa-check/<nationality>/<destination>` server-rendered result pages with `FAQPage` schema, the last-checked date, the source link and a CTA to the money page. Generate from the existing API |
| 13 | `/about` has zero inbound internal links despite ranking at position 3.77 with 7.69% CTR | `/about` | Internal linking | **Med** | Low | R, C | Add to the footer "Company" column and link from the homepage |
| 14 | `/uae/visa/saudi-arabia` has 2 inbound links and is absent from the footer while its 9 siblings get 73 each | `/uae/visa/saudi-arabia` | Internal linking | **Med** | Low | R, C | Add to the footer destination list |
| 15 | Money pages have zero contextual outbound internal links; the 27-post Schengen cluster is a flat pile with no hub | 10 money pages | Internal linking | **Med** | Med | R, C | Add a "Guides" block to each money page linking its 4-6 most relevant posts. Designate `/uae/visa/schengen` as the cluster hub |
| 16 | "Concierge" means AED 699, 2,299, 2,499 or 2,799 depending on the page; "Standard" means 599, 699 or 799 | 10 money pages | Consistency / AEO | **Med** | Med | A, C | Rename the non-Schengen tiers so no name maps to two prices |
| 17 | Live "VisaWadi.**ae**" anchor text in body copy | `/blog/bls-international-uae-schengen-visa-application-guide` | Brand leakage | **Med** | Low | C | Change to "VisaWadi FAQ" |
| 18 | 6 money-page titles exceed 60 chars and truncate away their differentiator | `france-visa` (69), `italy-visa` (69), `saudi-arabia` (66), `spain-visa` (65), `greece-visa` (64), `germany-visa` (61) | On-page | **Med** | Low | R | Trim to ≤60 keeping the distinguishing term (VIDEX, Annex A, Wafi) |
| 19 | `/blog/tags/us-visa` is in the sitemap with **zero posts** | 1 tag page | Crawl / thin content | **Med** | Low | R | Filter empty tags out of the sitemap and noindex them, or publish a US post |
| 20 | `/` and `/uae` share a title and H1, targeting one keyword with two URLs | `/`, `/uae` | Cannibalisation | **Med** | Low | R | Retarget `/uae` on the residence-specific term ("Visa Assistance in Dubai for UAE Residents") and leave the brand term to `/` |
| 21 | `/about` and `/contact` emit no JSON-LD at all | 2 pages | Structured data | **Med** | Low | A | Add the standard Organization graph plus `AboutPage` / `ContactPage` |
| 22 | Legal entity "City Tours LLC" appears only in schema; the licence expired 17/05/2026 and its registered address is Sharjah while schema publishes Dubai | Schema on all 69 pages, `/terms-and-conditions`, `/privacy-policy`, footer | Legal / trust | **Med** | High | A, C | Renew the licence, then publish the entity name, licence number and registered address consistently in Terms, footer and schema. Until then, remove `addressLocality: Dubai` rather than publish a placeholder |
| 23 | 6 posts promote Travl's USD 13 itinerary generator when the VisaWadi package the post is selling already includes an itinerary | 6 posts | Conversion leak | **Med** | Low | C | Replace with a line noting the itinerary is included in the visa packages |
| 24 | 6 `quickAnswer` blocks are under 40 words, below the extractable-snippet floor | `schengen-visa-rejection-top-10` (29), `interview-questions` (34), `how-long-does-processing-take` (35), `proof-of-accommodation` (36), `single-entry-vs-multiple-entry` (37), `bls-international-guide` (38) | AEO | **Med** | Low | A | Expand each to 40-80 words |
| 25 | Only 4 of 40 posts use a table, on content that is almost entirely comparative and numeric | 36 posts | AEO / extractability | **Med** | Med | A | Convert fee breakdowns, processing times and document checklists to tables |
| 26 | `/blog/vietnam-visa-from-uae-...` has zero GSC impressions despite a working redirect and sitemap inclusion | 1 post | Indexation | **Med** | Low | R | URL-inspect and request indexing in GSC |
| 27 | Money pages bury the answer; no 40-80 word extractable summary above the fold | 10 money pages | AEO | **Med** | Med | A, C | Add a short "What this costs and how long it takes" block under each H1 |
| 28 | All 14 homepage images are `loading="lazy"` with no priority hint; 12 lack intrinsic dimensions | `/`, `/uae` | Performance | **Med** | Low | R | Set `priority` / `fetchPriority="high"` on the LCP candidate. Verify CLS in a real browser |
| 29 | 17 travel-insurance posts and a `travel-insurance` tag page (19 inbound links) build topical authority for a product sold on another domain; the top internal-equity recipient is one of them | `/blog/tags/travel-insurance` and 17 posts | Cross-domain strategy | **Med** | Med | R, C | Decide whether these stay. If they do, cut their internal link weight and stop pointing 44 links at the top one |
| 30 | No `apple-touch-icon.png`, no `favicon.ico`, no web manifest | Site-wide | Brand assets | **Low** | Low | C | Add all three from the existing favicon source |
| 31 | 11 stock images byte-identical to Travl's, 3 of them rendered on live pages; `logo.webp` is Travl's logo | `public/`, homepage, `/uae` | Brand differentiation | **Low** | Med | C | Delete the unused `logo.webp`. Replace the rendered stock photos with VisaWadi-specific imagery |
| 32 | 347 em dashes across 38 pages, including 3 H1s, against house style | Site-wide | House style | **Low** | Med | — | Replace with commas or full stops |
| 33 | 6 tag pages use the generic `<Tag> \| Blog Tag \| VisaWadi` title template and are 80-224 words | 6 tag pages | On-page / thin | **Low** | Low | R | Hand-write titles, descriptions and 150-word intros as done for the other 7 |
| 34 | Shared stock images requested at `w=3840`; header logo at `w=2048` for a 1000px render | `/`, `/uae` | Performance | **Low** | Low | R | Correct the `sizes` attribute |
| 35 | Tag pages emit `Blog` + `WebPage` rather than `CollectionPage` + `ItemList`; h1→h3 skip on all 14 listing pages | `/blog`, 13 tag pages | Structured data / semantics | **Low** | Low | A | Switch the type and insert an h2 |
| 36 | `lastVerifiedAt` is uniform at 2026-08-20 across every checker rule | Checker, all destinations | Data freshness | **Low** | Med | A | Introduce a per-rule review cadence so the date reflects real verification |
| 37 | Homepage canonical omits the trailing slash the sitemap uses | `/` | Canonical | **Low** | Low | R | Make them match |
| 38 | Sitemap `lastmod` values for static pages and all tag entries are hardcoded strings | `src/app/sitemap.js` | Sitemap hygiene | **Low** | Low | R | Derive from real modification data or drop the field |
| 39 | VisaWadi ranks position 6.3 for "dummyticket365" / "dummy ticket 365", a sister brand's navigational terms | Blog posts mentioning DT365 | Cross-domain | **Low** | Low | — | Accept, or reduce brand-name repetition in those posts |

### Top 10 highest-leverage fixes

1. **Resolve the package-inclusions contradiction** (#1). `/about` and the Terms say the opposite of what every money page sells. Low effort, and it is a live commercial misrepresentation in the document a customer would cite in a dispute.
2. **Unify the EUR 90 → AED conversion** (#2). Four different figures on the exact query cluster the site ranks for. This is what an AI model would call the site out on.
3. **Fix the EUR 80 error on the Spain post** (#3). A two-week-old post publishing a superseded government fee.
4. **Rewrite `/blog/schengen-visa-fees-...` title, meta and H2s** (#4). 22 queries at positions 4.6-13.6 producing 2 clicks. The single largest ranking-to-traffic conversion available on the site.
5. **Delete the unsourced success-rate claim** (#5). It is in `FAQPage` schema on the primary money page, which means it is machine-readable and citable.
6. **Add `greece-visa` and `saudi-arabia` to `servicedSlugs`** (#6). A one-line change that stops the checker dead-ending users on two live products.
7. **Repoint the 40 legacy `/visa/*` CTAs to `/uae/visa/*`** (#7). Unblocks deindexing of the legacy URLs that are currently competing with their own canonicals.
8. **Add `Offer` / `priceSpecification` to all 10 money pages** (#8). The largest structured-data gap on a site whose entire proposition is price.
9. **Backfill official sources and last-checked dates on the 35 migrated posts** (#9). Highest effort here, and the highest ceiling: provenance is the deciding factor for AI citation on YMYL-adjacent visa content, and the site currently has almost none of it.
10. **Fix `/contact`** (#10). Insurance-policy copy on a visa site, an empty address block, and a Google Maps link with no destination, on the page a user reaches when they are ready to buy.
