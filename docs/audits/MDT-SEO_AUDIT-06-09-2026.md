# MDT / MyDummyTicket: Technical SEO, AEO and GEO Audit

**Run date:** 06-09-2026
**Branch / commit:** `master` @ `0018cb5`
**Scope:** `apps/mdt-frontend`, `apps/mdt-backend`, and the shared packages they consume (`@travel-suite/frontend-shared`, `@travel-suite/config`, `@travel-suite/utils`, plus the `blog`, `insurance`, `tickets`, `payments` domain packages).

## Environment audited

| Item | Value |
|---|---|
| Frontend (dev, used for HTML/schema/crawl) | `http://localhost:3111` (Next.js 16.3.0, Turbopack) |
| Frontend (production build, used for CWV) | `http://localhost:3222` (`next build` + `next start`, build exit 0) |
| Backend | `http://localhost:3001` (Express 5, Mongoose 9, MongoDB connected) |
| Stack | Next.js 16.3.0 App Router, React 19.2.5, Tailwind v4, ESM, Node 22 target |
| Metadata | `generateMetadata` / `metadata` export via `frontend-shared/utils/publicMetadata` |
| Structured data | `frontend-shared/utils/schema` factories wired through `src/lib/schema.js` |
| Sitemap / robots | `src/app/sitemap.js` and `src/app/robots.js` (Next file conventions, sitemap revalidates hourly) |
| Blog source | MongoDB via backend REST (`/api/blogs`), not MDX or a CMS |
| i18n | None configured. No locale segments, no `hreflang`. Marked N/A below. |

### What was checked

Live rendered HTML for all 19 public static pages, all 14 published blog posts, 4 tag pages, blog pagination page 2, `robots.txt`, `sitemap.xml`, response headers, 404 behaviour, trailing-slash handling, JSON-LD parsing and field validity, the full internal link graph, and real Lighthouse mobile Core Web Vitals on three representative URLs against the production build.

### What was not checked

- **No GSC export.** The `GSC EXPORT PATH` input was left as the literal placeholder and no Search Console export exists anywhere in the repo. **Phase 6 was not run**, and no bucket score credits or penalises real query data. Striking-distance, CTR and content-gap analysis remain open.
- **Production redirects.** The apex to `www` redirect and the `/blog/tag/:slug` legacy redirect live in `next.config.mjs` behind a `host` condition that only matches on the live domain, so they could not be exercised locally. Code reviewed, behaviour not verified.
- **Live `x-robots-tag` and CDN cache headers** as served by Fly.io. Local `next start` sets no `x-robots-tag` (correct), but the production edge was not measured.
- Off-page factors (backlinks, entity presence, third-party citations) were out of scope.

### Note on files touched

Running `next dev` caused Next.js to auto-generate `apps/mdt-frontend/AGENTS.md` and `apps/mdt-frontend/CLAUDE.md`. Both were deleted after the audit. No other file was created or modified except this report.

---

## Executive summary

| Bucket | Score | Weight |
|---|---|---|
| Technical SEO | 72 / 100 | 25% |
| On-page SEO | 70 / 100 | 20% |
| Content & Blog | 74 / 100 | 20% |
| AEO / GEO | 68 / 100 | 20% |
| Internal Linking | 38 / 100 | 15% |
| **Overall (weighted)** | **66 / 100** | |

The engineering foundation is genuinely good. Every public page is server-rendered with a self-referencing canonical, a single H1, complete OG and Twitter tags, and valid JSON-LD that parses without error. Lighthouse scores SEO 100 on the home page. The blog is better structured for AI extraction than most commercial sites: every post ships a 50 to 80 word "Short Answer" block, a table of contents, question-shaped H2s, a FAQ with `FAQPage` markup, and correct `datePublished` / `dateModified`.

Three things are holding the site back, and they are not evenly weighted.

**Internal linking is the single biggest gap and it is dragging everything else down.** Across all 33 crawled pages there is not one contextual internal link into a money page. Every link to `/emirates-dummy-ticket`, `/travel-insurance`, `/onward-ticket` and the rest comes from the global header or footer. All 14 blog posts contain **zero in-article links**. The blog is doing the ranking work and passing none of it to the pages that convert. Since organic is the only live channel, this is directly costing revenue.

**Two factual errors are live and both are credibility problems.** The `/schengen-travel-insurance` page displays "from AED 30" on-page while its `Offer` schema declares `price: "49.00"`, a mismatch Google treats as a structured-data violation. Separately, the pricing FAQ on the home page, `/faq` and `/dummy-ticket-us-visa` states that price varies "depending on availability selected", when pricing is actually tiered by validity period (AED 49 / 69 / 79 for 2 / 7 / 14 days). The AED 69 tier appears nowhere on the entire site.

**There is a 99% duplicate page pair.** `/schengen-travel-insurance` and `/travel-insurance/schengen-visa` share the same H1 and the identical meta description, with 99% token overlap. Both are indexable and self-canonical. They are competing with each other for the same UAE Schengen insurance queries.

### Top 10 highest-leverage fixes

| # | Fix | Impact | Effort | Serves |
|---|---|---|---|---|
| 1 | Add in-article contextual links from all 14 blog posts to the relevant money page | High | Med | Rankings, conversion |
| 2 | Fix the `/schengen-travel-insurance` Offer price (49.00 vs on-page AED 30) | High | Low | AI presence, conversion |
| 3 | Resolve the `/schengen-travel-insurance` vs `/travel-insurance/schengen-visa` duplicate | High | Low | Rankings |
| 4 | Add the 5 missing `/travel-insurance/*` pages to `sitemap.js` | High | Low | Rankings |
| 5 | Correct the "depending on availability" pricing FAQ and publish the 49/69/79 tier table | High | Low | AI presence, conversion |
| 6 | Fix home page mobile LCP (6.7s, fails threshold) | High | Med | Rankings, conversion |
| 7 | Reconcile contradictory PNR verification claims across pages | High | Med | AI presence |
| 8 | Stop passing full title tags as schema `Product.name` / `Service.name` | Med | Low | AI presence |
| 9 | Self-canonical `/blog?page=2` instead of pointing it at `/blog` | Med | Low | Rankings |
| 10 | Broaden positioning beyond visa-only (add check-in and immigration use cases) | Med | Med | Rankings, conversion |

---

## Phase 0: Stack and route inventory

**Framework:** Next.js 16.3.0, App Router, `output: 'standalone'`, Turbopack in dev. Styling is Tailwind v4 via `@tailwindcss/postcss`. Fonts come from `next/font/google` (Commissioner, `display: swap`). Images run through `next/image` with AVIF and WebP enabled and Cloudinary allowlisted as a remote pattern.

**Metadata** is produced by `generateMetadata` (dynamic routes) and static `metadata` exports (static routes), both funnelling into `buildMetadata` in `packages/frontend-shared/src/utils/publicMetadata.js`. That helper always emits `alternates.canonical`, `robots`, `openGraph` and `twitter`, which is why coverage is uniform.

**Structured data** is built by `createSchemaBuilders` in `packages/frontend-shared/src/utils/schema.js`, instantiated per-brand in `apps/mdt-frontend/src/lib/schema.js` with the MDT organisation identity (Dubai address, `info@mydummyticket.ae`, no telephone).

**Backend exists** (`apps/mdt-backend`, Express 5 + Mongoose 9). It serves blog content, tags, tickets, insurance, payments and auth. The frontend is not a static export; `/blog` and `/blog/tags/[slug]` are server-rendered on demand, blog posts are SSG via `generateStaticParams` with `revalidate = 300`.

### Route inventory

**Public indexable pages: 19**

`/`, `/dummy-ticket-schengen-visa`, `/dummy-ticket-us-visa`, `/emirates-dummy-ticket`, `/etihad-dummy-ticket`, `/onward-ticket`, `/flight-itinerary`, `/faq`, `/travel-insurance`, `/travel-insurance/annual-multi-trip`, `/travel-insurance/international`, `/travel-insurance/medical`, `/travel-insurance/schengen-visa`, `/travel-insurance/single-trip`, `/schengen-travel-insurance`, `/blog`, `/blog/tags`, `/privacy-policy`, `/terms-and-conditions`

**Blog posts: 14** (all published, all returning 200)

**Tag pages: 4** (`dummy-tickets`, `visa-application`, `travel-insurance`, `schengen-visa`)

**Excluded from audit (correctly disallowed in `robots.txt`): 26** admin routes plus `/booking/*` and `/insurance-booking/*` funnel steps.

**Total audited: 37 URLs** (19 static + 14 posts + 4 tags), plus `/blog?page=2`, `robots.txt` and `sitemap.xml`.

---

## Phase 1: Technical SEO

### Indexability

Clean. Every one of the 37 audited URLs returns `index, follow` in a rendered `<meta name="robots">`. No stray `noindex` on any real page. No `x-robots-tag` header is set locally, which is correct. The only `noindex` in the codebase is the deliberate one in `blog/[slug]/page.js` for unresolvable slugs, which pairs with a genuine 404 status.

`robots.txt` is generated correctly and disallows exactly the right things: `/admin`, `/booking`, and the four `/insurance-booking/*` funnel steps. Note that `/insurance-booking` itself is not disallowed, but no such route exists, so this is harmless.

**AI crawlers are not blocked.** There are no `GPTBot`, `ClaudeBot`, `PerplexityBot` or `CCBot` disallow rules. For a brand whose only channel is organic, that is the right call and should stay that way.

### Sitemap

`sitemap.xml` returns **32 URLs**. Cross-referenced against the Phase 0 route list, **5 indexable money pages are missing**:

- `/travel-insurance/annual-multi-trip`
- `/travel-insurance/international`
- `/travel-insurance/medical`
- `/travel-insurance/schengen-visa`
- `/travel-insurance/single-trip`

The cause is in `apps/mdt-frontend/src/app/sitemap.js`: the `staticPages` array was written before the `/travel-insurance/*` subtree existed and was never extended. These are real, purchasable, indexable pages with unique content and their own `Product` offers. They are absent from the only discovery signal the site controls, and (see Phase 5) they receive no contextual internal links either, so their only route to discovery is the header nav.

Blog posts and tag pages are picked up dynamically and correctly. The hourly `revalidate` with a `try/catch` around the backend fetch is a sound design; it degrades to static entries rather than failing the build.

`robots.txt` correctly references the sitemap at the production URL.

### Canonicals and duplication

Every audited page carries a self-referencing canonical on the production `https://www.mydummyticket.ae` origin. Trailing-slash requests return a `308` to the non-slash form. HTTP to HTTPS and apex to `www` are handled in `next.config.mjs` via a `host`-conditioned redirect (code reviewed, not verifiable locally).

Two problems:

**Duplicate page pair.** `/schengen-travel-insurance` (781 words) and `/travel-insurance/schengen-visa` (757 words) have **99.0% token overlap**, the **identical H1** ("Schengen Travel Insurance for UAE Residents from AED 30") and the **identical meta description**. Both are indexable and self-canonical. Only the first is in the sitemap. This is unambiguous self-competition on the highest-intent UAE insurance term the site targets.

**Pagination canonical.** `/blog?page=2` renders correctly, links to the 5 posts not shown on page 1, and is reachable via a real crawlable `<a href="/blog?page=2">Next</a>`. But its canonical points to `https://www.mydummyticket.ae/blog`, not to itself. Canonicalising page 2 to page 1 tells Google page 2 is a duplicate and suppresses it, weakening the discovery path for those 5 posts. Paginated pages should be self-canonical.

### i18n and geo signals

**hreflang: N/A.** The site has no locale or market variants, so hreflang is correctly absent.

**UAE market signals are mostly right.** `Organization` schema carries a Dubai `PostalAddress` with `addressCountry: "AE"`. Every `Service` block sets `areaServed: "AE"`. Every `Offer` uses `priceCurrency: "AED"` and the site-wide `CURRENCY` constant is `AED`. Nothing miscommunicates the serving region.

Two gaps: the `Organization` node has **no `telephone`** and **no `sameAs`** profile array, both of which are standard UAE local-business trust signals and are supported by the schema builder already. And "Abu Dhabi" appears **zero times across every page on the site**, with "Dubai" appearing at most twice on any page. For a UAE-primary brand this leaves the second-largest emirate's local-intent queries entirely untargeted.

### Performance (live, production build, Lighthouse mobile)

Measured against `next start` on the production build with mobile form factor and screen emulation.

| URL | Perf | FCP | **LCP** | CLS | TBT | Speed Index |
|---|---|---|---|---|---|---|
| `/` | **74** | 0.9s | **6.7s** (fail) | 0 | 140ms | 3.9s |
| `/emirates-dummy-ticket` | 92 | 0.9s | 3.2s (needs work) | 0 | 160ms | 0.9s |
| `/blog/how-do-dummy-tickets-work` | 94 | 0.9s | 2.9s (needs work) | 0 | 100ms | 1.6s |

**CLS is a perfect 0 on all three.** TBT is comfortably inside the 200ms threshold everywhere. FCP is excellent and consistent. The problem is isolated to LCP.

The home page LCP element is the hero subheading paragraph (`section#form > div > div > p.text-[15px]`, the "Book verifiable dummy tickets for visa applications..." line). Its LCP breakdown is **21.8ms time-to-first-byte and 1,974ms element render delay**. This is not a network problem, it is a render-blocking and hydration problem: the text is present in the server HTML but does not paint until the page's JavaScript has processed. The home page ships the heaviest client bundle of the three (a 70KB chunk plus **86KB of unused JavaScript**), which is what pushes it from the 2.9 to 3.2s the other pages manage out to 6.7s under mobile throttling.

Other observations: the logo is preloaded **twice** with two different `imageSrcSet` values, which is wasted bytes on the critical path. Nine images on the ticket and insurance pages lack explicit `width`/`height` attributes; CLS is currently 0 so this is not yet biting, but it is fragile. All three pages fail `unused-javascript` with roughly 86KB of savings available.

Lighthouse **SEO scores 100** and **accessibility scores 90** on the home page. The two accessibility deductions are `button-name` (buttons without an accessible name) and `color-contrast`. Tap-target sizing and font legibility both pass.

### Rendering

All metadata, all JSON-LD and all body copy are present in the **server-rendered HTML**, confirmed by inspecting raw `curl` output with no JavaScript execution. `generateMetadata` resolves correctly for blog posts and tag pages. There is no hydration gap and no client-only content that would hurt extraction. This is a genuine strength and it is what makes the blog AI-extractable.

Note the deliberate comment in `blog/[slug]/page.js` warning that no ancestor may add a `loading.js`, because the resulting Suspense boundary would flush a 200 shell before `notFound()` could set the status and turn bad slugs into indexable soft 404s. That constraint is real and should be respected.

### Mobile

`viewport` meta is set correctly (`width=device-width, initialScale=1`) in the root layout. Responsive behaviour is sound. Lighthouse mobile confirms tap targets and font sizes pass.

### Crawl hygiene

| Check | Result |
|---|---|
| Broken internal links | None. All 37 URLs plus `/blog?page=2` return 200. |
| Redirect chains | None found. Trailing slash is a single 308. |
| 404 handling | Correct. `/this-page-does-not-exist`, `/blog/no-such-post` and `/blog/tags/no-such-tag` all return a true **404**, not a soft 200. |
| Orphan pages | See Phase 5. Severe: no page receives a contextual internal link. |

### Structured data validity

**Every JSON-LD block on every audited page parses without error.** Zero parse failures across 37 URLs. Types are appropriate and the `@graph` / `@id` referencing between `Organization`, `WebSite`, `WebPage` and `Product` is correctly wired.

Defects found:

**1. Price contradiction on `/schengen-travel-insurance`.** On-page copy reads "Schengen Travel Insurance for UAE Residents from AED 30" and "Plans from AED 30". The `Offer` declares:

```json
{ "@type": "Offer", "price": "49.00", "priceCurrency": "AED", ... }
```

Its duplicate twin `/travel-insurance/schengen-visa` correctly declares `"30.00"`. This is a live structured-data error that can trigger a Merchant listing penalty and will feed a wrong price to any AI system reading the markup.

**2. `Product.name` and `Service.name` are being fed the full SEO title tag.** For example on `/emirates-dummy-ticket`:

```
"name": "Emirates Dummy Ticket From AED 49 | Verifiable PNR | Accepted by VFS"
```

A product name containing pipe separators, a price and a marketing claim is not a product name. This affects **all 10 pages** carrying `Product` or `Service` schema and degrades how the entity is understood and displayed.

**3. Inconsistent Product coverage.** `/travel-insurance/medical` and `/travel-insurance/single-trip` carry `Service` but **no `Product`/`Offer`**, while their four siblings carry both. Both pages are purchasable.

**4. No `priceValidUntil` or `hasMerchantReturnPolicy`** on any Offer. Not required, but both are recommended and Google increasingly surfaces warnings for their absence.

**Positive:** all Offers correctly set `priceCurrency: "AED"` (correct for the market) and `availability: InStock`. No stale schema describing a hotel service was found anywhere. `FAQPage` markup is present on 15 pages and all `mainEntity` arrays are well-formed.

---

## Phase 2: On-page SEO

### Static pages

| URL | Target keyword (inferred) | Title (len) | Desc (len) | H1 | Canonical | Idx | Schema | Words | Links out | OG/TW |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | dummy ticket | Dummy Ticket from AED 49 \| Verifiable, Quick \| My Dummy Ticket (62) | 129 | 1 | self | Y | Org, WebSite, WebPage, Service, FAQPage | 1102 | 23 | Y/Y |
| `/dummy-ticket-schengen-visa` | dummy ticket schengen visa | Dummy Ticket for Schengen Visa From AED 49 \| Accepted by VFS (60) | 156 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 909 | 21 | Y/Y |
| `/dummy-ticket-us-visa` | dummy ticket us visa | Dummy Ticket for US Visa from AED 49 \| Verifiable, Instant (58) | 142 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 1268 | 24 | Y/Y |
| `/emirates-dummy-ticket` | emirates dummy ticket | Emirates Dummy Ticket From AED 49 \| Verifiable PNR \| Accepted by VFS (**68**) | 156 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 1022 | 24 | Y/Y |
| `/etihad-dummy-ticket` | etihad dummy ticket | Etihad Dummy Ticket From AED 49 \| Verifiable PNR for Visa (57) | 156 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 1085 | 24 | Y/Y |
| `/onward-ticket` | onward ticket | Onward Ticket From AED 49 \| Instant, Genuine, & Affordable (58) | 150 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 1174 | 24 | Y/Y |
| `/flight-itinerary` | flight itinerary | Flight Itinerary From AED 49 \| Instant Delivery With PNR (56) | **87** | 1 | self | Y | +Product, Breadcrumb (**no FAQ**) | **259** | 13 | Y/Y |
| `/faq` | dummy ticket faq | Dummy Ticket FAQ \| Common Questions Answered \| My Dummy Ticket (62) | 129 | 1 | self | Y | FAQPage, Breadcrumb | 499 | 18 | Y/Y |
| `/travel-insurance` | travel insurance uae | Travel Insurance for UAE Residents \| Instant Policy Delivery (60) | 112 | 1 | self | Y | Service, FAQPage (**no Product**) | 717 | 18 | Y/Y |
| `/travel-insurance/annual-multi-trip` | annual multi trip insurance uae | Annual Multi-Trip Travel Insurance in UAE \| AED 245 \| My Dummy Ticket (**69**) | 152 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 789 | 24 | Y/Y |
| `/travel-insurance/international` | international travel insurance uae | International Travel Insurance for UAE Residents \| My Dummy Ticket (**66**) | 157 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 739 | 24 | Y/Y |
| `/travel-insurance/medical` | travel medical insurance uae | Travel Medical Insurance for UAE Residents \| My Dummy Ticket (60) | 152 | 1 | self | Y | Service, FAQPage (**no Product**) | 751 | 24 | Y/Y |
| `/travel-insurance/schengen-visa` | schengen travel insurance uae | Schengen Travel Insurance UAE \| From AED 30 \| My Dummy Ticket (61) | 153 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 757 | 24 | Y/Y |
| `/travel-insurance/single-trip` | single trip travel insurance uae | Single Trip Travel Insurance for UAE Residents \| My Dummy Ticket (64) | **164** | 1 | self | Y | Service, FAQPage (**no Product**) | 757 | 24 | Y/Y |
| `/schengen-travel-insurance` | schengen travel insurance uae | Schengen Travel Insurance for UAE Residents \| From AED 30 \| Instant Policy (**74**) | 153 | 1 | self | Y | +Product, FAQPage, Breadcrumb | 781 | 18 | Y/Y |
| `/blog` | dummy ticket visa blog | Dummy Ticket & Visa Travel Blog \| Tips, Guides & Updates (56) | 133 | 1 | self | Y | Blog, WebPage, Breadcrumb | 670 | 28 | Y/Y |
| `/blog/tags` | blog tags | Blog Tags \| My Dummy Ticket (27) | 112 | 1 | self | Y | WebPage, Breadcrumb | 150 | 23 | Y/Y |
| `/privacy-policy` | privacy policy | Privacy Policy - My Dummy Ticket (32) | 118 | 1 | self | Y | **Breadcrumb only** | 325 | 18 | Y/Y |
| `/terms-and-conditions` | terms and conditions | Terms & Conditions - My Dummy Ticket (36) | 129 | 1 | self | Y | **Breadcrumb only** | 441 | 19 | Y/Y |

### Findings

**Strengths.** Exactly one H1 on every page. No skipped heading levels detected. Canonical, OG and Twitter tags are present and correct on 100% of pages. No missing titles or descriptions. No duplicate titles.

**Titles over 60 characters (5, will truncate in SERPs):** `/schengen-travel-insurance` (74), `/travel-insurance/annual-multi-trip` (69), `/emirates-dummy-ticket` (68), `/travel-insurance/international` (66), `/travel-insurance/single-trip` (64). Two more sit exactly at 60 to 62 and are borderline.

**Description over 160 characters (1):** `/travel-insurance/single-trip` at 164.

**Thin content (1):** `/flight-itinerary` at **259 words** is the thinnest page on the site by a factor of three. It also has the shortest meta description (87 chars), **no FAQ section and no `FAQPage` schema** (the only ticket page missing both), and the fewest outbound links (13). It ranks for a commercially valuable head term and is the weakest asset on the site.

**Keyword cannibalisation (1 confirmed pair):** `/schengen-travel-insurance` and `/travel-insurance/schengen-visa`, 99% identical, same H1, same meta description, both targeting "schengen travel insurance UAE". Detailed in Phase 1.

A softer overlap exists between `/flight-itinerary` and `/onward-ticket`, both of which sell what is effectively the same artefact. `/onward-ticket` is far stronger (1,174 words vs 259) and clearly owns the "proof of onward travel" intent, so the fix is to differentiate `/flight-itinerary` rather than merge.

**Missing schema on legal pages:** `/privacy-policy` and `/terms-and-conditions` carry only `BreadcrumbList`, with no `WebPage` or `Organization` node, unlike every other page. Low impact but inconsistent.

**UAE-intent modifiers.** Insurance pages handle this well (6 to 11 "UAE" mentions each). The ticket pages are weaker (1 to 4) and `/flight-itinerary` mentions the UAE **zero times**. Critically, **"Abu Dhabi" appears zero times site-wide** and "Dubai" appears at most twice on any page. No page is stuffed unnaturally; the problem is under-use, not over-use.

**Missing pricing tier.** House pricing is AED 49 / 69 / 79 for 2 / 7 / 14 days. **"AED 69" appears nowhere on the site.** Only 49 and 79 are ever shown, and no page presents the tiers as a structured comparison.

---

## Phase 3: Content and blog audit

All 14 published posts, all returning 200, all in the sitemap.

| Post | Title (len) | Desc | Words | H2 (q-shaped) | Schema | Dates | Author | In-links | Out (in-article) | Alt |
|---|---|---|---|---|---|---|---|---|---|---|
| `what-documents-are-required-for-a-schengen-visa-from-uae` | 57 | 151 | 3342 | 18 (2) | BlogPosting + FAQPage | pub 04-05, mod 04-05 | Ammar Afridi | 1 | **0** | Y |
| `best-country-to-apply-for-first-schengen-visa-from-uae` | 54 | 159 | 1862 | 8 (2) | BlogPosting + FAQPage | pub 24-06, mod 24-06 | Ammar Afridi | 1 | **0** | Y |
| `common-visa-rejection-reasons-for-uae-residents` | 47 | 129 | 1842 | 7 (0) | BlogPosting + FAQPage | pub 22-04, mod 29-04 | Ammar Afridi | 1 | **0** | Y |
| `how-long-does-a-schengen-visa-take-from-the-uae` | 48 | 155 | 1690 | 8 (1) | BlogPosting + FAQPage | pub 25-06, mod 25-06 | Ammar Afridi | 1 | **0** | Y |
| `budget-airlines-uae-to-europe-2026-guide` | 41 | 138 | 1681 | 8 (0) | BlogPosting + FAQPage | pub 22-04, mod 29-04 | Ammar Afridi | 1 | **0** | Y |
| `how-much-bank-balance-is-needed-for-schengen-visa-from-uae` | 59 | 155 | 1662 | 9 (3) | BlogPosting + FAQPage | pub 04-05, mod 04-05 | Ammar Afridi | 1 | **0** | Y |
| `how-to-prepare-documents-for-visa-application-uae` | 49 | 144 | 1632 | 7 (0) | BlogPosting + FAQPage | pub 22-04, mod 29-04 | Ammar Afridi | 1 | **0** | Y |
| `how-much-does-travel-insurance-cost-in-the-uae` | 47 | 157 | 1392 | 5 (2) | BlogPosting + FAQPage | pub 14-04, mod 29-04 | Ammar Afridi | 1 | **0** | Y |
| `how-do-dummy-tickets-work` | 26 | 158 | 1362 | 8 (5) | BlogPosting + FAQPage | pub 11-04, mod 29-04 | Ammar Afridi | 1 | **0** | Y |
| `do-embassies-accept-dummy-tickets-in-2026` | 42 | 155 | 1274 | 8 (5) | BlogPosting + FAQPage | pub 12-04, mod 29-04 | Ammar Afridi | **0** | **0** | Y |
| `are-dummy-tickets-accepted-for-evisa-applications` | 50 | 160 | 1270 | 5 (2) | BlogPosting + FAQPage | pub 14-04, mod 29-04 | Ammar Afridi | 1 | **0** | Y |
| `are-dummy-tickets-legal-for-visa-application` | 46 | 143 | 1208 | 8 (3) | BlogPosting + FAQPage | pub 11-04, mod 29-04 | Ammar Afridi | 1 | **0** | Y |
| `is-travel-insurance-mandatory-for-schengen-visa-from-uae` | 57 | 157 | 1190 | 9 (5) | BlogPosting + FAQPage | pub 14-04, mod 29-04 | Ammar Afridi | **0** | **0** | Y |
| `how-long-should-a-dummy-ticket-be-valid` | 59 | 149 | 1131 | 8 (6) | BlogPosting + FAQPage | pub 14-04, mod 29-04 | Ammar Afridi | **0** | **0** | Y |

### Per-post assessment

This is a well-executed content set. Every post has a single H1, a compliant title and meta description, 700+ words (1,131 minimum in rendered form), a complete `BlogPosting` node with both `datePublished` and `dateModified`, a `FAQPage` block with 5 questions, a cover image, and **100% image alt-text coverage**. On-page dates are rendered as a visible "Updated" line. No thin posts, no missing metadata, no broken markup.

**Author / E-E-A-T is the weak signal.** Every post credits "Ammar Afridi", but the schema emits an inline node:

```json
"author": { "@type": "Person", "name": "Ammar Afridi" }
```

There is no `@id`, no `url`, no `jobTitle`, no `knowsAbout`, no `sameAs`, and **no author page exists**. The shared `buildPerson` builder in `frontend-shared/utils/schema.js` already supports all of this and its own code comment makes the point exactly: "A byline is only an E-E-A-T signal if it resolves to something." MDT is not using that path. For a YMYL-adjacent niche (visa documentation, insurance) where trust is the ranking currency, this is a real miss.

### Collection-level assessment

**Topical clusters.** Three clear clusters, well covered:
- Schengen visa process (5 posts): documents, bank balance, processing time, best country, rejection reasons
- Dummy ticket mechanics and legitimacy (5 posts): how they work, legality, validity, embassy acceptance, eVisa
- Travel insurance (2 posts): cost, Schengen mandate
- Flights (1 post): budget airlines UAE to Europe

**Topical gaps.** Nothing covers **airline check-in**, **proof of onward travel at the border**, or **immigration checks**, despite these being three of the four stated use cases. Nothing covers **UAE visit visa**, **UK visa** or **Canada visa** despite those being high-volume UAE resident queries and despite the site having dedicated US and Schengen ticket pages. Nothing covers **Abu Dhabi**-specific or **Dubai**-specific visa logistics.

**Orphan posts (3, zero inbound links from anywhere):** `do-embassies-accept-dummy-tickets-in-2026`, `is-travel-insurance-mandatory-for-schengen-visa-from-uae`, `how-long-should-a-dummy-ticket-be-valid`. All three fall on `/blog?page=2`, which is itself canonicalised to page 1. They are reachable but structurally starved.

The remaining 11 posts have exactly **one** inbound link each, from the `/blog` listing (9 of them) or from `how-to-prepare-documents-for-visa-application-uae`, which is the only post in the entire collection linked to by another post, and even that comes from the related-posts widget rather than prose.

**Posts that should interlink but don't.** `how-do-dummy-tickets-work`, `are-dummy-tickets-legal-for-visa-application` and `do-embassies-accept-dummy-tickets-in-2026` cover overlapping ground and should form a tight hub. `is-travel-insurance-mandatory-for-schengen-visa-from-uae` and `how-much-does-travel-insurance-cost-in-the-uae` are a natural pair. None of them link to each other in prose.

**Cannibalising posts.** None. Each post has a distinct primary query. This is genuinely well planned.

**Money-page linking: this is the critical failure.** Across all 14 posts there are **zero in-article links**. Verified by extracting every `<a href>` from the rendered HTML of every post: the only internal links are the global header nav, the breadcrumb, the tag chips and the footer. Not one post links to `/emirates-dummy-ticket`, `/etihad-dummy-ticket`, `/dummy-ticket-us-visa`, `/dummy-ticket-schengen-visa`, `/onward-ticket`, `/flight-itinerary`, `/travel-insurance` or any insurance subpage from within its prose.

Several posts contain unlinked CTA sentences that are clearly written to be links, for example: "verifiable flight reservations and Schengen-compliant travel insurance policies, delivered to your inbox in minutes" appears in four posts as plain text.

**Service pages receiving zero blog links: all of them.** Every money page on the site.

**CTAs pointing to unsold services.** None found. All CTAs point at dummy tickets or insurance, both of which are live and purchasable. Hotel reservations are consistently and correctly described as email-served ("We provide hotel reservations by email"), matching house facts.

---

## Phase 4: AEO / GEO readiness

### Verdict-first

**Blog: excellent.** Every post opens with a labelled **"The Short Answer"** block of 52 to 77 words placed immediately under the H1, before any other content, and closes with a **"The Bottom Line"** summary. This is exactly the structure AI answer engines extract. Example from `how-do-dummy-tickets-work`:

> "A dummy ticket is a temporary flight reservation made in an airline's official booking system. It includes a real, verifiable PNR code but has not been paid for and cannot be used to board a flight. People use them to meet proof of onward travel requirements for visa applications without committing to a full ticket purchase."

That is 56 words, self-contained, and directly extractable. All 14 posts follow this pattern.

**Money pages: weaker but not buried.** Hero subheadings do answer the implied question up front. `/emirates-dummy-ticket` opens: "Get an official Emirates flight reservation with a live 6-digit PNR for your visa application in minutes. Our dummy ticket is verifiable on the Emirates website under 'Manage Booking'..." That works. The gap is structural, not positional: there is no discrete, marked-up quick-answer block, and the hero copy is styled as marketing rather than as an answer.

### Snippet and extraction targets

**The title question is never repeated as an H2 on the money pages.** Their H2s are uniformly generic and non-question-shaped: "About Us", "Why Choose Us?", "Simple, Hassle-Free Process", "Testimonials". Across all 19 static pages there is essentially no question-shaped H2 outside the FAQ accordion. The blog does far better, with 5 to 6 question H2s on the strongest posts, though 3 posts (`budget-airlines`, `common-visa-rejection-reasons`, `how-to-prepare-documents`) have **zero** question-shaped H2s despite serving question intent.

**FAQ coverage is strong.** 15 of 19 static pages and all 14 posts carry `FAQPage` markup with well-formed `mainEntity` arrays. The exceptions are `/flight-itinerary`, `/blog`, `/blog/tags` and the two legal pages. `/flight-itinerary` is the meaningful one: a commercial page with no FAQ and no FAQ schema.

**No comparison tables anywhere.** The most obviously extractable asset the brand could publish, a 2 / 7 / 14 day validity vs AED 49 / 69 / 79 price table, does not exist on any page. Neither does an airline-by-airline verification method table, which is the single highest-value differentiator the brand has and which AI engines would readily cite.

### Citability and trust

**Good signals:** specific figures throughout (EUR 30,000 medical cover, AED 15,000 bank balance, 6-digit PNR, "since 2008, over 16 years"), named authorities (VFS Global, BLS, AXA, Amadeus, Sabre, Travelport, ViewTrip), and visible dates on every post.

**Weak signals:** no outbound citations to authoritative external sources anywhere in the content. Not one link to an embassy site, to VFS Global, to IATA, or to a consulate page. For a niche where the reader's core anxiety is "is this legitimate", outbound authority links are one of the cheapest trust wins available and they materially increase LLM citation likelihood.

**House-style violations.** Em dashes appear **53 times across 12 pages**, concentrated in `/onward-ticket` (12), `/etihad-dummy-ticket` (11), `/schengen-travel-insurance` (9) and `/travel-insurance/schengen-visa` (7). All 4 blog tag pages have em dashes in their `metaTitle`, which means they render **in the SERP** ("Dummy Tickets — Guides, Tips and Visa Advice", "Visa Application — Guides and Tips", "Travel Insurance — Guides and Tips", "Schengen Visa — Application Guides for UAE Residents"). These live in the database tag records, not in code.

### Consistency against house facts

This is where the site does real damage to its own credibility.

**Fact 3, PNR verification: contradicted across pages.** The house position is that verification is GDS-primary, with a minority of airlines also permitting verification on their own websites. The site says three different things:

- **Overclaims universal airline-website verification.** The home page hero states PNRs "can be verified directly on airline websites in just a few clicks". The shared pricing/verification FAQ, which appears on `/`, `/faq` **and** `/dummy-ticket-us-visa`, states the ticket can be "verified directly on the airline's website using the airline reservation code (or PNR) and your surname" with no qualification. `/dummy-ticket-schengen-visa` states reservations "can be verified on the airline's official website". Two blog posts repeat it: `how-long-should-a-dummy-ticket-be-valid` ("verified on the airline's website") and `are-dummy-tickets-legal-for-visa-application` ("verifiable on the airline's own website for a short period"). This is the inaccurate absolute the house facts flag, in the opposite direction: it promises something most airlines do not offer, and a customer who tries and fails has been actively misled.
- **Gets it right in two places.** `how-do-dummy-tickets-work` says "verified on the GDS and airline systems". `do-embassies-accept-dummy-tickets-in-2026` says officers "verify these details directly through a reservation system such as ViewTrip or a Global Distribution System (GDS)".
- **Correctly airline-specific on two pages.** `/emirates-dummy-ticket` ("verify directly on the Emirates website under the Manage Booking section") and `/etihad-dummy-ticket` ("verifiable on Etihad's Manage My Booking system") are accurate, because those are exactly the minority carriers that permit it.

No page makes the opposite error of claiming verification is impossible on any airline site. The problem is entirely one of overclaiming, and it is the highest-frequency factual inconsistency on the site.

**Fact 4, pricing: two errors.**
- The shared FAQ on `/`, `/faq` and `/dummy-ticket-us-visa` states pricing runs "from AED 49 ... up to AED 79 per person, **depending on availability selected**". Pricing is tiered by **validity period**, not availability. The blog states it correctly: "Costs typically range from AED 49 to AED 79 depending on the **validity period** selected." The customer-facing page is wrong and the blog post is right.
- The **AED 69 / 7-day tier is invisible site-wide**. It exists in `src/config.js` as `PRICING_OPTIONS` and is presumably selectable in the booking funnel, but no public page names it.
- The `/schengen-travel-insurance` Offer/on-page price mismatch (49.00 vs AED 30) documented in Phase 1.

**Fact 5, positioning: visa-only.** Measured across all static pages: "visa" appears 17 to 32 times on each ticket page; "check-in" appears **zero times on every page except `/onward-ticket`** (2 mentions); "immigration" appears 0 to 1 times on every page except `/onward-ticket` (13). The home page meta description reads "for visa applications from the UAE" and the hero says "Book verifiable dummy tickets for visa applications", full stop. `/onward-ticket` is the one page that properly covers proof of onward travel, immigration and border control, and it is the strongest-written page on the site. Everything else is positioned as visa paperwork only, which forfeits the airline check-in and proof-of-onward-travel query space entirely.

**Fact 1, services sold: correct.** Dummy tickets and insurance are both presented as purchasable. Hotel reservations are consistently described as email-served. One minor inconsistency: the "How to book" step 2 on 8 pages reads "Select from dummy tickets, hotel reservations, or travel insurance", implying hotels are selectable in the on-site flow when they are not.

**Fact 2, insurance is genuine: correct and well handled.** `/travel-insurance` and `/schengen-travel-insurance` both lead with the badge "Real Policy, Not a Placeholder" and the copy says plans are "genuine, legally valid" and "issued by AXA". Nothing anywhere blurs insurance with dummy documentation. This is the cleanest house-fact compliance on the site.

### Machine access

`robots.txt` blocks no AI crawler. All key content is server-rendered and present without JavaScript. Semantic HTML with `<main>`, `<section>` and a clean heading hierarchy. Extraction conditions are good; the limiting factor is content structure on the money pages, not machine access.

---

## Phase 5: Internal linking and equity

### The headline finding

Excluding the global header and footer (links present on 30 or more of 33 crawled pages), the contextual internal link graph is close to empty.

**Contextual inbound links, by page:**

| Page | Contextual inbound | Source |
|---|---|---|
| `/faq` | 7 | Ticket pages |
| `/travel-insurance/annual-multi-trip` | 4 | Its 4 insurance siblings only |
| `/travel-insurance/international` | 4 | Its 4 insurance siblings only |
| `/travel-insurance/medical` | 4 | Its 4 insurance siblings only |
| `/travel-insurance/schengen-visa` | 4 | Its 4 insurance siblings only |
| `/travel-insurance/single-trip` | 4 | Its 4 insurance siblings only |
| 11 blog posts | 1 each | `/blog` listing |
| **`/`** | **0** | |
| **`/dummy-ticket-schengen-visa`** | **0** | |
| **`/dummy-ticket-us-visa`** | **0** | |
| **`/emirates-dummy-ticket`** | **0** | |
| **`/etihad-dummy-ticket`** | **0** | |
| **`/onward-ticket`** | **0** | |
| **`/flight-itinerary`** | **0** | |
| **`/travel-insurance`** | **0** | |
| **`/schengen-travel-insurance`** | **0** | |
| **`/blog`** | **0** | |
| 3 blog posts | **0** | True orphans |

**Every single money page has zero contextual inbound links.** Their entire internal authority comes from the header nav, which passes the same undifferentiated signal to all of them and gives Google no way to distinguish priority. The one commercial page that receives contextual links is `/faq`, which does not convert.

The insurance subtree is the one place contextual linking exists, and it is a closed loop: the 5 subpages link only to each other, nothing outside links in, and 5 of them are also missing from the sitemap. That subtree is almost entirely cut off.

### Equity flow gaps

The blog is the site's content asset: 14 posts, 1,131 to 3,342 words each, well-structured and topically coherent. It is generating whatever organic authority the domain has. It passes **none** of it to a money page contextually.

The reverse path is equally broken. The home page and ticket pages link out to `/faq` and to the blog listing, but no money page links to a supporting blog post that would reinforce its topical authority.

Concretely, these are the links that should exist and do not:
- `how-do-dummy-tickets-work` and `are-dummy-tickets-legal-for-visa-application` should link to `/` and `/onward-ticket`
- `do-embassies-accept-dummy-tickets-in-2026` and `how-long-should-a-dummy-ticket-be-valid` should link to `/dummy-ticket-schengen-visa`
- `is-travel-insurance-mandatory-for-schengen-visa-from-uae` and `how-much-does-travel-insurance-cost-in-the-uae` should link to `/travel-insurance/schengen-visa`
- `what-documents-are-required-for-a-schengen-visa-from-uae` (3,342 words, the strongest post) should link to both `/dummy-ticket-schengen-visa` and `/travel-insurance/schengen-visa`
- `budget-airlines-uae-to-europe-2026-guide` should link to `/flight-itinerary`, which badly needs the help

### Anchor text quality

Navigation anchors are descriptive and keyword-appropriate ("Dummy Ticket For Schengen Visa", "Emirates Dummy Ticket", "Travel Insurance for Schengen Visa"). That is good, but because these are global nav links repeated identically on every page, they carry little differentiating weight.

Two empty-anchor links to `/` appear on every page (the logo and one other), which is a minor accessibility and signal issue and likely relates to the Lighthouse `button-name` failure.

Since there are no in-article links at all, there is no editorial anchor text on the site to assess.

### Cross-reference with GSC

**Not possible.** No export was provided. Identifying which ranking pages sit one strong internal link away from improving is exactly what this data would answer, and it is the highest-value follow-up to this audit.

---

## Phase 6: GSC-informed opportunities

**Not run.** The `GSC EXPORT PATH` input was left as the unreplaced placeholder and no Search Console export exists in the repository. Striking-distance queries, high-impression low-CTR rewrite candidates, untargeted ranking queries, and UAE-local query clusters could not be analysed.

To unblock this, export from Search Console with a 3 to 6 month window at Query and Page dimensions, place the file under `docs/audits/data/`, and re-run. Given that organic is the only live channel, this is worth doing before committing to a content roadmap.

---

## Scoring

Weights reflect that organic is the only channel, so conversion-path and authority-flow factors carry more than usual.

**Technical SEO: 72 / 100** (weight 25%)
Foundations are strong: universal self-referencing canonicals, full SSR, true 404s, correct trailing-slash 308s, clean `robots.txt`, no stray `noindex`, zero JSON-LD parse errors across 37 URLs, Lighthouse SEO 100. Deductions come from five indexable money pages missing from the sitemap, a live `Offer` price contradicting on-page copy, a home page mobile LCP of 6.7s against a 2.5s threshold, `/blog?page=2` canonicalised away, and schema `name` fields stuffed with full title tags.

**On-page SEO: 70 / 100** (weight 20%)
Metadata discipline is genuinely good: one H1 everywhere, no missing or duplicate titles, complete OG and Twitter coverage, no heading-level skips. Held back by a 99% duplicate page pair competing on the primary insurance term, five titles over 60 characters, one 259-word thin page carrying a commercial head term with no FAQ schema, uniformly generic non-question H2s on every money page, and Abu Dhabi absent site-wide.

**Content & Blog: 74 / 100** (weight 20%)
The highest-scoring bucket. All 14 posts have complete `BlogPosting` and `FAQPage` schema, both date fields, 100% image alt coverage, healthy word counts and non-overlapping target queries. Deducted for zero in-article links, three fully orphaned posts, an author byline that resolves to nothing despite the shared builder supporting a full `Person` node, no outbound authority citations, no coverage of the check-in or immigration use cases, and factual verification claims that contradict other pages.

**AEO / GEO: 68 / 100** (weight 20%)
The blog is close to exemplary: labelled short-answer blocks in the 40 to 80 word range, question H2s, FAQ markup, bottom-line summaries, all server-rendered and machine-accessible with no AI crawler blocks. The money pages undo much of it: no quick-answer blocks, no question-shaped H2s, no comparison tables including the obvious pricing tier table. The larger penalty is factual inconsistency, since contradictory verification and pricing claims across pages are precisely what suppresses AI citation. 53 em dashes and 4 SERP-visible em-dash tag titles compound it.

**Internal Linking: 38 / 100** (weight 15%)
The weakest bucket by a wide margin, and scored on verified crawl data. Zero contextual inbound links to every money page. Zero in-article links across all 14 posts. Three orphan posts. The only contextual link cluster is a closed 5-page insurance loop that nothing links into and that is also absent from the sitemap. Credit retained for descriptive nav anchors, crawlable pagination and a clean footer structure.

**Overall: 66 / 100**
Calculated as (72 x 0.25) + (70 x 0.20) + (74 x 0.20) + (68 x 0.20) + (38 x 0.15) = 18.0 + 14.0 + 14.8 + 13.6 + 5.7 = **66.1**.

All five buckets were assessed against live rendered output. No bucket was scored on GSC data, so query-performance factors are absent from every score.

---

## Fix list, ranked

Ranked by impact, then by live-bug-or-factual-error precedence, then by lower effort, then by whether the fix unblocks others.

| # | Issue | Affected scope | Category | Impact | Effort | Fix summary | Serves |
|---|---|---|---|---|---|---|---|
| 1 | Zero in-article internal links; no money page has any contextual inbound link | All 14 posts, all 9 money pages | Internal linking | High | Med | Add 2 to 4 editorial in-prose links per post to the matching service page, using descriptive anchors. Hyperlink the existing unlinked CTA sentences. | Rankings, conversion |
| 2 | `Offer` price 49.00 contradicts on-page "from AED 30" | `/schengen-travel-insurance` | Structured data, factual | High | Low | Pass `price: 30` and `currency: 'AED'` to `buildProduct` on this route. | AI presence, conversion |
| 3 | 99% duplicate pair, same H1 and meta description, both indexable | `/schengen-travel-insurance`, `/travel-insurance/schengen-visa` | Duplication | High | Low | Pick one canonical URL, 301 the other to it, or cross-canonical. Keep the sitemap entry aligned. | Rankings |
| 4 | 5 indexable money pages missing from sitemap | `/travel-insurance/*` (5 pages) | Sitemap | High | Low | Add the 5 subpaths to `staticPages` in `src/app/sitemap.js`. | Rankings |
| 5 | Pricing FAQ says price varies by "availability"; AED 69 tier invisible site-wide | `/`, `/faq`, `/dummy-ticket-us-visa` | Factual, conversion | High | Low | Correct to "validity period". Publish the 2/7/14 day vs AED 49/69/79 table on the ticket pages. | AI presence, conversion |
| 6 | Home mobile LCP 6.7s (threshold 2.5s), 1,974ms element render delay | `/` | Performance | High | Med | Cut the home client bundle (86KB unused JS), remove the duplicate logo preload, ensure the hero paragraph paints without waiting on hydration. | Rankings, conversion |
| 7 | Contradictory PNR verification claims; several pages overclaim universal airline-website verification | `/`, `/faq`, `/dummy-ticket-us-visa`, `/dummy-ticket-schengen-visa`, 2 posts | Factual, AEO | High | Med | Standardise on GDS-primary framing with airline-website verification named as carrier-specific. Keep Emirates and Etihad pages as-is. | AI presence, conversion |
| 8 | Schema `Product.name` / `Service.name` set to the full SEO title tag | 10 pages with Product or Service | Structured data | Med | Low | Pass a clean product name separate from the title, for example "Emirates Dummy Ticket". | AI presence |
| 9 | `/blog?page=2` canonicalises to `/blog`, suppressing 5 posts | `/blog?page=2` | Canonical | Med | Low | Make paginated pages self-canonical. | Rankings |
| 10 | Visa-only positioning; check-in and immigration use cases absent | All ticket pages except `/onward-ticket` | Content, AEO | Med | Med | Add check-in, proof of onward travel and immigration sections to the ticket pages and home hero. | Rankings, conversion |
| 11 | `/flight-itinerary` is 259 words, no FAQ, no FAQ schema, no UAE mention | `/flight-itinerary` | Thin content | Med | Med | Expand to 800+ words, add an FAQ block with `FAQPage` markup, differentiate from `/onward-ticket`. | Rankings, conversion |
| 12 | Author byline resolves to nothing; no `@id`, no author page | All 14 posts | E-E-A-T | Med | Med | Use the existing `buildPerson` slug path and add an author page with credentials. | Rankings, AI presence |
| 13 | 3 orphan posts with zero inbound links | `do-embassies-accept-dummy-tickets-in-2026`, `is-travel-insurance-mandatory-for-schengen-visa-from-uae`, `how-long-should-a-dummy-ticket-be-valid` | Internal linking | Med | Low | Link them from related posts and from the relevant money page. Fix #9 helps too. | Rankings |
| 14 | Insurance subtree is a closed loop, nothing links in | 5 `/travel-insurance/*` pages | Internal linking | Med | Low | Link from `/travel-insurance` hub and from the two insurance blog posts. | Rankings, conversion |
| 15 | 53 em dashes across 12 pages; 4 tag `metaTitle`s show them in SERPs | 12 pages, 4 tag records | House style | Med | Low | Replace with commas or full stops. Tag titles are DB records, edit via admin. | AI presence |
| 16 | 5 titles exceed 60 chars and will truncate | `/schengen-travel-insurance` (74), `/travel-insurance/annual-multi-trip` (69), `/emirates-dummy-ticket` (68), `/travel-insurance/international` (66), `/travel-insurance/single-trip` (64) | On-page | Med | Low | Trim to 55 to 60 chars, keeping the head term first. | Rankings |
| 17 | Money pages have no quick-answer block and no question-shaped H2s | All 9 money pages | AEO | Med | Med | Add a title-question H2 with a 40 to 80 word answer near the top of each. | AI presence |
| 18 | No outbound authority citations anywhere | All pages and posts | AEO, trust | Med | Low | Cite VFS Global, embassy pages and IATA where claims are made. | AI presence |
| 19 | `Organization` schema has no `telephone` and no `sameAs` | Site-wide | Local SEO | Med | Low | Add both to the `createSchemaBuilders` call in `src/lib/schema.js`. | Rankings |
| 20 | "Abu Dhabi" absent site-wide; "Dubai" used at most twice per page | All money pages | Local SEO | Med | Med | Add natural emirate-level references and consider Abu Dhabi and Dubai landing content. | Rankings |
| 21 | `Product`/`Offer` missing on 2 purchasable pages | `/travel-insurance/medical`, `/travel-insurance/single-trip` | Structured data | Low | Low | Add `buildProduct` with the correct AED price. | AI presence |
| 22 | 9 images lack explicit `width`/`height` | Ticket and insurance pages | Performance | Low | Low | Add intrinsic dimensions. CLS is 0 today but this is fragile. | Rankings |
| 23 | "Select from dummy tickets, hotel reservations, or travel insurance" implies on-site hotel purchase | 8 pages | Factual | Low | Low | Reword to make clear hotels are arranged by email. | Conversion |
| 24 | Legal pages carry only `BreadcrumbList` | `/privacy-policy`, `/terms-and-conditions` | Structured data | Low | Low | Add `WebPage` and `Organization` nodes for consistency. | AI presence |
| 25 | `/travel-insurance/single-trip` meta description is 164 chars | 1 page | On-page | Low | Low | Trim to under 160. | Rankings |
| 26 | Duplicate logo preload with two different srcsets | Site-wide | Performance | Low | Low | Emit one preload. | Rankings |
| 27 | Lighthouse a11y 90: `button-name` and `color-contrast` failures | `/` and likely site-wide | Accessibility | Low | Low | Add `aria-label` to unnamed buttons, fix contrast ratios. | Conversion |
| 28 | 3 posts have zero question-shaped H2s despite question intent | `budget-airlines-uae-to-europe-2026-guide`, `common-visa-rejection-reasons-for-uae-residents`, `how-to-prepare-documents-for-visa-application-uae` | AEO | Low | Low | Rewrite section headings as questions. | AI presence |
| 29 | No GSC data available | Whole audit | Data gap | Low | Low | Export Query and Page dimensions over 3 to 6 months to `docs/audits/data/` and re-run Phase 6. | Rankings |

### Top 10 highest-leverage fixes

1. **Add in-article contextual links from all 14 blog posts to the matching money page.** The blog holds the site's authority and currently passes none of it. Biggest single lever available.
2. **Fix the `/schengen-travel-insurance` Offer price.** A live structured-data error declaring AED 49 where the page says AED 30.
3. **Resolve the 99% duplicate insurance pair.** Two identical pages competing for the primary UAE insurance term.
4. **Add the 5 `/travel-insurance/*` pages to the sitemap.** Five purchasable pages currently invisible to the only discovery signal the site controls.
5. **Correct the "depending on availability" pricing FAQ and publish the 49/69/79 tier table.** Fixes a factual error on three pages and creates the site's most extractable asset.
6. **Fix home page mobile LCP.** 6.7s against a 2.5s threshold on the highest-traffic page, driven by a 1,974ms render delay.
7. **Reconcile the PNR verification claims.** Six pages overclaim universal airline-website verification. Contradiction suppresses AI citation and misleads customers.
8. **Clean up schema `Product.name` / `Service.name`.** Ten pages currently pass a pipe-delimited title tag as a product name.
9. **Self-canonical `/blog?page=2`.** Restores the discovery path for the 5 posts that only appear there, including all 3 orphans.
10. **Broaden positioning past visa-only.** Check-in appears zero times on every page but one, forfeiting an entire use-case query space.
