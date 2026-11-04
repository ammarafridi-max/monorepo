# Picturesk SEO / AEO / GEO Audit

**Date:** 22 October 2026
**Branch:** `picturesk-design-pass` · **Commit:** `ce0fd33` (working tree dirty: CSS design pass uncommitted)
**Primary environment audited:** production, `https://www.picturesk.ai` (Fly app `picturesk-web`, region `iad`)
**Secondary environment:** local `http://localhost:3000` (frontend), `http://localhost:3001` (backend)

---

## 1. Instruments and coverage

Declared before any finding, so nothing below is mistaken for a measurement it is not.

| Instrument | Available | Notes |
|---|---|---|
| Real browser | **Yes** | Chrome DevTools MCP. Core Web Vitals measured on a throttled mobile profile (412x915, Slow 4G, 4x CPU). Lighthouse navigation run on mobile. |
| Live production domain | **Yes** | 64 URLs fetched directly. All on-page, schema, header and link findings are from rendered production HTML. |
| Local dev servers | **Yes, pre-existing** | Both were **already running** when the audit started (`next dev -p 3000`, PID 8387; backend `src/server.js`, PID 92061). I did not start them and did not shut them down. |
| GSC export | **No** | **Phase 6 is skipped entirely.** This is the single most damaging gap in this audit. See §9. |
| Google index state | **Not verified** | No GSC and no reliable `site:` operator. Two brand-level web searches returned nothing from the domain, which is consistent with the symptom but is **not** a Google index check. |
| Backlink data | **Not verified** | No access to any backlink index. Every statement about off-site authority below is explicitly labelled as inference. |

**What was checked:** indexability, robots, sitemap, canonicals, pagination, redirects, 404 handling, structured data validity and rendering, titles and descriptions on every indexable route, heading structure, word counts, image hygiene, Core Web Vitals, internal link graph, blog content and schema, AEO structure, pricing consistency against code.

**What was not checked:** actual ranking positions, impressions, clicks, CTR, backlinks, competitor rank, keyword search volume. None of these were reachable. No number in this report is estimated.

**Dev/production database:** the local dev backend points at a **remote Atlas cluster**. The production connection string lives in Fly secrets and is not readable from the repo, so whether dev and prod share a database **could not be verified**. Treat local dev as potentially live data until you confirm otherwise. This audit wrote nothing anywhere.

One measurement discrepancy worth recording: the local sitemap returns **35** URLs, production returns **48**. The 13 missing are all blog posts. The dev backend's database holds 7 published posts; production holds 20. That is evidence the two databases are **not** the same, but it is indirect, so it does not override the line above.

---

## 1b. Changes applied after the audit (22 Oct 2026)

The audit itself was read-only. Fixes 1 and 2 were then applied at the user's request, in the working tree only. **Nothing is committed and nothing is deployed**, so production still shows the pre-fix state measured above.

Two corrections to §7 and §4.9 came out of doing the work, and two live bugs were found and fixed. Both are marked below.

### Fix 2: `og:image`

`public/og-image.png` added (1200x630, PNG, 604 kB, supplied by the user). Verified serving `200 image/png` locally. This resolves the sitewide `og:image` 404 on deploy.

Two things to decide before shipping: 604 kB is heavy for a social card and a JPEG at the same dimensions would be roughly a tenth of that; and the image is a photograph of a person. If it is not a Picturesk-generated result, using it as the brand's social card implies that it is, which is the same provenance problem as finding C-1.

### Fix 1: internal linking

**Blog to money pages.** The shared `BlogPostPage` already accepts `offers` and `inlineOffer` props and renders `BlogOfferCard`, `BlogOfferRail` and `BlogInlineOffer`. Picturesk was passing neither, so the mechanism existed and was unused. Added `apps/picturesk-frontend/lib/blogOffers.js`: a per-slug map giving each of the 20 posts two sidebar offer cards and one in-article offer, each with its own target and anchor text, following the §7.4 mapping. Wired into `app/(site)/blog/[slug]/page.js`. A tag-based fallback covers future posts.

**Money page to money page.** `sections/Pricing.js` takes a new optional `related` prop rendering a short contextual sentence of links beneath the plans. Populated per page on all 12 pages carrying a pricing section, plus contextual links added to `/faq` and `/tools/linkedin-photo-analyzer`.

Measured on the local dev server, in-body links only (`<main>`, nav and footer excluded):

| Page | In-body inbound before | After |
|---|---|---|
| `/pricing` | **0** | **5** |
| `/tools/linkedin-photo-analyzer` | **0** | **1** |
| `/blog` | **0** | **1** |
| `/ai-headshots-vs-photographer` | 1 | **6** |
| `/ai-dating-photos-vs-photographer` | 1 | **4** |
| `/linkedin-headshots` | 2 | **6** |
| `/ai-headshot-generator` | 1 | **3** |
| `/ai-dating-photos` | 2 | **6** |
| `/hinge-photos` | 3 | 4 |
| `/tinder-photos` | 3 | 4 |
| **Each of the 20 blog posts, links to money pages** | **0** | **2 distinct targets each** |

### Correction to §7: money pages were not unlinked from each other

My finding that all 20 money pages had **zero** contextual inbound links was partly an artifact of my own method. I classified any URL appearing on 90% or more of pages as boilerplate, and because every money page sits in the nav and footer, that rule discarded genuine in-body links to the same URLs.

Re-measured against `<main>` only, the accurate picture before the fix was:

- The home page linked in-body to **9** money pages, and the dating cluster was well cross-linked (`/hinge-photos`, `/tinder-photos`, `/bumble-photos` each had 3 in-body inbound).
- But `/pricing`, `/tools/linkedin-photo-analyzer` and `/blog` had **zero**, and the headshot cluster was thin: `/ai-headshots-vs-photographer` had 1, `/linkedin-headshots` and `/real-estate-agent-headshots` 2 each.
- `/faq`, `/terms` and `/refunds` received 11 to 13 in-body inbound links each, from the fine print under every pricing section, more than any product page.

So the accurate version of T-1 is: **the blog-to-money gap was total and is confirmed** (all 20 posts, zero links, verified directly), and the money-to-money graph existed but was lopsided, with the commercially most important page on the site, `/pricing`, receiving nothing. That is a smaller finding than I first reported, and the Internal Linking score of 38 was too harsh on that basis. On the corrected measurement it should have been roughly **52**, which moves the overall from 73 to **75**. Both numbers describe the pre-fix production site.

### New finding O-13, now fixed: dating plan cards pointed into the headshots funnel

Found while wiring the `related` prop. `sections/Pricing.js` hardcoded `/ai-headshot-generator/about?tier=${t.id}` on every plan card and ignored its own `href` prop, which all six dating pages were correctly passing. Verified live on production:

```
https://www.picturesk.ai/hinge-photos
  href="/ai-headshot-generator/about?tier=dating_pro"
  href="/ai-headshot-generator/about?tier=dating_starter"   (and the other two tiers)
```

Every dating plan card on `/ai-dating-photos`, `/hinge-photos`, `/tinder-photos`, `/bumble-photos`, `/dating-profile-photos-for-men` and `/ai-dating-photos-vs-photographer` sent the buyer into the **headshots** funnel carrying a dating tier id. This is a live revenue bug on all six dating pages, not an SEO one, and it is the most expensive thing found today.

Fixed by using the `href` prop the callers already pass. Verified locally: `/hinge-photos` plan cards now resolve to `/ai-dating-photos/about?tier=dating_*`, and `/linkedin-headshots` still resolves to `/ai-headshot-generator/about?tier=*`. **What happens to a buyer who already followed one of those links into the wrong funnel is untested and worth checking before you deploy.**

### New finding T-21, now fixed: `BlogOfferRail` never received its `offers` prop

In `packages/frontend-shared/src/pages/client/BlogPostPage.js`, `<BlogOfferRail>` was rendered without `offers`, so `hasOffers` was always false and the desktop sidebar offer cards could never appear for **any** brand in the monorepo. The mobile grid below the article used `offers` correctly, so the bug was invisible on a phone. One-line fix. Brand-neutral and backwards compatible: `offers` defaults to `[]`, so brands that pass nothing behave exactly as before.

### Correction to §4.9: `apple-touch-icon` is present

I reported `apple-touch-icon.png` as a 404. It is served at `/apple-icon.png` under the App Router convention, with a correct `<link rel="apple-touch-icon" ... sizes="180x180">` in the head. The finding was wrong.

`/favicon.ico` genuinely does 404, but a correct `<link rel="icon" href="/icon.png" sizes="512x512">` is present, so the practical cost is limited to clients that probe `/favicon.ico` at the root without parsing the head. Fix T-7 drops from Medium to Low and is now only about that one file.

### Verification status of these changes

- All edited routes compile and render: 8 representative pages return `200` from the local dev server, including every page type touched.
- Link counts above were measured on rendered local HTML, not inferred from source.
- The in-article offer and the sidebar cards were confirmed rendering on `/blog/how-much-do-professional-headshots-cost`.
- `pnpm test` passes, 5 of 5 tasks. **This proves nothing about these changes.** The four packages with tests are `picturesk-backend`, `domains/assistant`, `domains/tickets` and `shared/utils`; none covers `picturesk-frontend` or `frontend-shared`, and Turbo reported every task cached.
- **Not done:** no production build was run, nothing was committed, nothing was deployed. The remaining 21 items on the fix list are untouched.

---

## 2. Executive summary

### Scores

| Bucket | Score | Weight |
|---|---|---|
| Technical SEO | **84** / 100 | 25% |
| On-page SEO | **82** / 100 | 20% |
| Content and Blog | **72** / 100 | 20% |
| AEO / GEO | **76** / 100 | 20% |
| Internal Linking | **38** / 100 (corrected to **52**, see §1b) | 15% |
| **Overall** | **73** / 100 (corrected to **75**, see §1b) | |

Weights put technical highest because the stated symptom is total absence from search results, which is first a technical question. Internal linking is weighted lowest in the composite but is the lowest-scoring bucket and the largest single lever; do not read 15% as unimportant.

### The symptom, tested

**Stated symptom:** "Picturesk isn't appearing anywhere on SERPs."

**Hypothesis tested and rejected:** there is no technical reason this site cannot be indexed. I checked every mechanism that would cause it and all of them are correct:

- `robots.txt` allows everything except `/api/` and `/admin`, and names the sitemap.
- The sitemap returns 48 URLs, auto-generated, correct, and excludes every utility route.
- Every one of the 48 indexable pages carries a **self-referencing canonical** and `index, follow`.
- No stray `noindex` on any real page. Every utility page (`/login`, `/signup`, `/success`, `/cancel`, `/admin`) correctly carries `noindex, nofollow`.
- No `x-robots-tag` header anywhere.
- Apex to www is a 308, http to https is a 301, trailing slash is a 308, the legacy `/generator/*` paths are 308s.
- The 404 page returns a real 404 with `noindex`.
- Google Search Console **is** verified, by two DNS TXT records on the apex.
- Lighthouse mobile: **SEO 100**, Best Practices 100, Accessibility 96.
- Core Web Vitals on throttled mobile: home **LCP 1056 ms, CLS 0.00**; `/pricing` **LCP 849 ms, CLS 0.00**. Both well inside Google's thresholds.

**The actual explanation has three parts, in order of size:**

1. **The domain is three months old.** `picturesk.ai` was created **2026-07-19** (registrar WHOIS). The blog's first post went live **2026-09-15**; the most recent is **2026-10-04**. A domain this young, in the AI-headshot niche (one of the most commercially saturated and spam-heavy SERP categories there is), has no business ranking yet. Chrome's CrUX dataset has **no field data for either page I traced**, which independently confirms real traffic is below CrUX's reporting threshold. This is not a failure. It is a three-month-old site. Any fix list has to be read against that, and no fix below will produce rankings this month.

2. **Nothing on the site passes authority to a page that sells anything.** This is the one genuine structural defect, and it is severe. See finding T-1 and §7: **not one of the 20 money and marketing pages has a single contextual inbound internal link.** Every one of them appears in the nav and footer on all 54 crawled pages and nowhere else. **Not one of the 20 blog posts links to a single money page.** The blog is a sealed cluster that links to other posts, to tag pages, and to the author page. Whatever crawl equity the content earns, none of it is pointed at `/pricing`, `/linkedin-headshots`, `/ai-dating-photos` or any other page that takes money.

3. **The brand has no entity footprint.** `Organization` schema carries name, URL, logo and email, and nothing else: no `legalName`, no `address`, no `sameAs`. The Terms page names UAE law and Dubai courts but **names no company**. There is no registered entity, address or phone anywhere on the site. For a transactional site asking for selfies and card details, that is a trust gap that affects both Google's assessment and whether a model will cite you.

Alongside those, two live bugs are actively costing you: the sitewide **`og:image` returns 404**, and **`/favicon.ico` returns 404**.

### Top 10 highest-leverage fixes

| # | Fix | Bucket | Status |
|---|---|---|---|
| 1 | Add contextual links from all 20 blog posts to the money pages they are topically adjacent to | Internal linking | **APPLIED** |
| 2 | Ship the missing `og-image.png` (currently 404 on every page that references it) | Technical, AEO | **APPLIED** |
| 3 | Add sample imagery to the six dating pages, `/pricing` and `/faq`, all of which render **zero images** | On-page, conversion | |
| 4 | Verify or remove the three hardcoded testimonials rendering as genuine customer reviews | Credibility | |
| 5 | Add `legalName`, `address`, `telephone` and `sameAs` to `Organization` schema, and name the legal entity in Terms and the footer | AEO, trust | |
| 6 | Repeat the title question as an H2 with a 40 to 80 word answer on every money page | AEO | |
| 7 | Add `/favicon.ico` (apple-touch-icon is in fact present, see §1b) | Technical | |
| 8 | Write commercial-intent dating content; six dating money pages have zero supporting posts | Content | |
| 9 | Stop the sitemap stamping `lastmod` = now on all 20 static pages every hour | Technical | |
| 10 | Fix or de-index the two empty tag pages, and resolve the vs-photographer cannibalisation pair | On-page | |

---

## 3. Phase 0: Stack and route inventory

**Framework:** Next.js 16.3.0, App Router, React 19.2.5, Node 22, ESM throughout. `output: 'standalone'`, deployed as a Docker image to Fly.io.

**Styling:** two surfaces on purpose. `app/(site)` is plain CSS with the Forest & Gold tokens in `app/globals.css`. `app/admin` is Tailwind v4 via `@travel-suite/frontend-shared`.

**Metadata:** per-page `metadata` exports plus a shared `buildMetadata` in `lib/schema.js`. Root `metadata` in [app/layout.js](apps/picturesk-frontend/app/layout.js) sets `metadataBase` and `robots: { index: true, follow: true }`.

**Schema:** JSON-LD built in `lib/schema.js` and `lib/pageSchema.js`, emitted as `@graph` with `@id` cross-references.

**Sitemap and robots:** generated, not static. [app/sitemap.js](apps/picturesk-frontend/app/sitemap.js) with `revalidate = 3600`, [app/robots.js](apps/picturesk-frontend/app/robots.js). Both read `SITE_URL` from [lib/seo.js](apps/picturesk-frontend/lib/seo.js), which falls back to `https://www.picturesk.ai` when `WEB_BASE_URL` is unset. `WEB_BASE_URL` is **not** in `fly.picturesk-web.toml`, so production runs on the fallback. That happens to be correct, but it is correct by accident.

**Redirects:** `next.config.mjs` `redirects()`, not middleware. There is no `proxy.js` or `middleware.js` in this app, unlike the travel brands. Redirects are honoured in the `standalone` output and were verified live.

**i18n:** none. `<html lang="en">`, no locale variants. hreflang is **N/A**.

**Blog source:** MongoDB via `picturesk-backend`, fetched through `@travel-suite/frontend-shared/services/apiBlog`.

### Route count

| Group | Count |
|---|---|
| Public site pages (static routes) | 20 |
| Blog posts (production) | 20 |
| Blog tag pages | 7 |
| Author pages | 1 |
| **Total indexable** | **48** |
| Funnel steps (auth-gated, 307) | 22 |
| Utility pages (`noindex`) | 7 |
| Admin pages | 13 |
| API routes | 17 |

Sitemap contains **48** URLs. That matches the indexable count exactly. No gap.

Two routes exist and are reachable but are **not** in the sitemap: `/blog?page=2` and `/blog/tags` (the latter is in fact present; `/blog?page=2` is not). Minor, noted in §4.

---

## 4. Phase 1: Technical SEO

### 4.1 Indexability — pass

Everything in this section was verified against live production responses, not config.

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin

Host: https://www.picturesk.ai
Sitemap: https://www.picturesk.ai/sitemap.xml
```

No AI crawler is blocked. `GPTBot`, `ClaudeBot`, `PerplexityBot`, `CCBot` and the rest all fall under `User-Agent: *` and are allowed. That is the right call for a brand that wants to be cited, and it is worth stating explicitly because it is a common accidental own-goal.

All 48 indexable pages: `index, follow`, self-referencing canonical, no `x-robots-tag`. All 7 utility pages: `noindex, nofollow`. No canonical points at another domain.

### 4.2 Sitemap — mostly pass, one defect

**T-9: all 20 static pages carry `lastmod` = the moment the sitemap was generated.** Because `revalidate = 3600`, every static page claims it was modified within the last hour, every hour, forever. Blog posts correctly use `updatedAt || publishedAt`; only the static `PAGES` array is affected. The practical effect is that crawlers learn the field carries no information and discount it, which costs you the signal on the pages where it would be genuinely useful.

Fix in [app/sitemap.js](apps/picturesk-frontend/app/sitemap.js): replace `lastModified: now` for the static block with a per-path date you update when you actually edit the page, or drop the field from static entries entirely. Dropping it is better than lying.

**T-20: `/blog?page=2` is absent from the sitemap.** It holds the 5 oldest posts. They are reachable via tag pages and related-post links, so they are not orphans, but the paginated URL itself is not declared.

### 4.3 Canonical, duplication, pagination — pass

Pagination is handled properly, which is unusual enough to call out:

| Check | Result |
|---|---|
| `/blog?page=2` canonical | `https://www.picturesk.ai/blog?page=2` (self) |
| `/blog?page=2` robots | `index, follow` |
| `/blog?page=2` title | `AI Headshot Guides and Tips \| Picturesk Blog \| Page 2` (distinct) |
| `rel=prev` / `rel=next` | Absent (deprecated by Google; no action needed) |
| Apex to www | `308` |
| http to https | `301` |
| Trailing slash (`/pricing/`) | `308` to `/pricing` |
| Legacy `/generator/select` | `308` to `/ai-headshot-generator/select` |
| 404 | real `404` + `noindex` |

### 4.4 Performance — pass, measured

Measured in Chrome at 412x915, Slow 4G, 4x CPU throttling.

| Page | LCP | CLS | TTFB |
|---|---|---|---|
| `/` | **1056 ms** | **0.00** | 407 ms |
| `/pricing` | **849 ms** | **0.00** | 372 ms |

The LCP image on the home page is correctly preloaded with a full `imageSrcSet` and is **not** lazy-loaded. The 7 proof-grid images below it are lazy, which is correct. Image hygiene on the home page is clean: 8 images, 0 missing `alt`, 0 missing `width`/`height`.

CrUX reports **no field data** for either page. That is a traffic-volume statement, not a performance one.

Minor, with measured savings of zero: 14.6 kB of unnecessary legacy JavaScript polyfills, and a forced reflow. Neither is worth your time.

**T-18: every page is served `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`.** Marketing pages that change monthly are being served as uncacheable on every request. This does not hurt indexing and TTFB is already fine, so it is low priority, but it means you are paying for every byte and Fly's edge cannot help you.

### 4.5 Rendering and structured-data plumbing — pass

This is the failure mode the audit specifically tests for, and it is clean. Every title, description, canonical, OG tag and JSON-LD block is present in the **server-rendered HTML**. Pricing is server-rendered from `packages/picturesk-shared/src/pricing.js`, not fetched client-side. Every FAQ answer is in the initial HTML. There is no prop-name mismatch dropping the graph: all JSON-LD blocks on all 48 pages parsed without error.

### 4.6 Structured data validity — strong

The graph is well built. Entities use `@id` references rather than duplicating nodes, which is the correct pattern and is more than most sites manage:

- `Organization` (`#organization`) — name, url, logo, email, contactPoint
- `WebSite` (`#website`) — publisher → `#organization`
- `WebPage` (`#webpage`) — isPartOf → `#website`
- `BlogPosting` (`#blogpost`) — headline, description, image, author → `#person`, datePublished, dateModified, publisher, mainEntityOfPage
- `Person` (`#person`) — name, jobTitle, a substantial description, image, `knowsAbout` array, `sameAs` LinkedIn, worksFor
- `FAQPage` (`#faq`) — 4 to 5 `Question`/`Answer` pairs per page
- `Product` + `Offer` on all priced pages, `BreadcrumbList`, `CollectionPage` on tags, `ProfilePage` on the author page, `WebApplication` on the tool

**Correction to a first reading:** `author` and `publisher` look absent from `BlogPosting` if you only inspect that node, because both are `@id` references into the graph. They are present and correctly resolved.

Three gaps:

**T-12: `Product` carries a single `Offer` at the lowest price.** `/pricing` declares `price: "9"` while actually selling a four-tier ladder ($0 / $9 / $29 / $49, and $0 / $19 / $39 / $59 for dating). Use `AggregateOffer` with `lowPrice`, `highPrice`, `priceCurrency` and `offerCount` so the machine-readable price matches what the page says.

**T-13: no `image` on any `Product` node.** This is a required property for product rich results.

**T-5: `Organization` has no `legalName`, `address`, `telephone` or `sameAs`.** Covered in §6.4, because its real cost is to AI citation and trust rather than to markup validity.

Also absent: any `Review` or `AggregateRating` markup. That is the right decision given finding C-1 below, and it should stay absent until those testimonials are verifiable.

### 4.7 Mobile — pass

Viewport meta present on all pages. Lighthouse mobile passed every tap-target and font-size audit. One accessibility failure, measured:

**T-15: contrast failure on the price chip inside the primary CTA.** `span.btn__price` renders `#bcdad6` on `#0f7a6b` — a ratio of **3.52:1** against a required 4.5:1, at 16px. It affects the "from $9" and "from $19" chips, which sit inside the main conversion button. Note that those two colours are not in the current `BRAND.md` token set; production is still serving the pre-design-pass palette, since the design-pass branch is uncommitted. Check the chip again after you deploy the new tokens, and if the new green is `#0E4A44` the ratio will likely clear on its own.

### 4.8 Crawl hygiene — pass, with one structural note

No broken internal links. No redirect chains. Every nav and footer link resolves to a real route. No orphan pages: all 48 sitemap URLs are linked from somewhere.

**T-4: every money page's primary CTA passes through a 307 to a signup wall.** The only contextual outbound links on the money pages are `/ai-headshot-generator/about` and `/ai-dating-photos/about`, and both 307-redirect to `/signup?next=...`. A crawler following the main conversion path on `/pricing` or `/linkedin-headshots` hits an auth gate and stops. The entire funnel is invisible to search engines.

This is defensible as a product decision and I am not telling you to open the funnel. But it means the crawlable surface of this site is exactly the 48 marketing pages, with no depth behind them, and it means your money pages have **no** contextual outbound links that go anywhere a crawler can follow. That makes every cluster a funnel with a closed end rather than a hub. The fix is not to unlock the funnel; it is to give money pages real contextual links to each other and to the posts that support them.

### 4.9 Brand assets — two live 404s

| Asset | Status |
|---|---|
| `/icon.png` | **200** (32 kB) |
| `/logo.png` | **200** (23 kB) |
| `/og-image.png` | **404** |
| `/favicon.ico` | **404** |
| `/apple-touch-icon.png` | **404** |
| `/manifest.json`, `/site.webmanifest` | **404** |
| `/llms.txt` | **404** |

**T-2: `og:image` points at `https://www.picturesk.ai/og-image.png`, which 404s.** This is referenced by `og:image` and `twitter:image` on every page that does not have its own image, which is every money page, every legal page, the home page and the FAQ. Blog posts and the author page are unaffected: they use their own Cloudinary images, which resolve.

The cost is concrete. Every time one of your money pages is shared in Slack, iMessage, WhatsApp, LinkedIn or X, or surfaced in an AI assistant's preview card, it renders with a broken or blank image. For a business selling photographs, that is the worst possible failure. It is also one of the cheapest fixes on this list.

**T-7: `/favicon.ico` 404s.** Modern browsers find `/icon.png` through the App Router convention, so most users see an icon, but `/favicon.ico` is still requested directly by some crawlers, feed readers and older clients. Add it, plus `apple-touch-icon.png`.

No sister-brand filenames or assets leaked into this app. Brand neutrality is clean.

---

## 5. Phase 2: On-page SEO

### 5.1 Money and marketing pages

All titles are within 60 characters and all descriptions within 160, which is the rule in `apps/picturesk-frontend/CLAUDE.md` and it is being followed without a single violation across 48 pages. Every page has exactly one H1. Every page has a self-referencing canonical. No duplicate titles, no duplicate descriptions, no truncation.

| URL | Target keyword | Title (len) | Desc (len) | H1 | Words | Schema | Imgs | Ctx in | OG |
|---|---|---|---|---|---|---|---|---|---|
| `/` | AI headshot generator | 54 | 154 | One set of selfies. Every photo you need. | 1242 | Org, WebSite, WebPage, ItemList, FAQPage | 8 | **0** | y |
| `/pricing` | AI headshot pricing | 46 | 151 | What AI headshots cost here. | 945 | + Product, Breadcrumb, FAQPage | **0** | **0** | y |
| `/ai-headshot-generator` | AI headshot generator | 53 | 158 | Headshots that don't look AI. | 1494 | + Product, FAQPage | 10 | **0** | y |
| `/ai-dating-photos` | AI dating photos | 52 | 159 | Dating photos that look like you on a good day. | 1328 | + Product, Breadcrumb, FAQPage | **0** | **0** | y |
| `/linkedin-headshots` | LinkedIn headshots | 50 | 156 | A LinkedIn photo people take seriously. | 1147 | + Product, Breadcrumb, FAQPage | 7 | **0** | y |
| `/tinder-photos` | Tinder photos | 54 | 157 | A first photo people stop on. | 1018 | + Product, Breadcrumb, FAQPage | **0** | **0** | y |
| `/hinge-photos` | Hinge photos | 51 | 156 | Six Hinge photos, none of them a mirror selfie. | 1048 | + Product, Breadcrumb, FAQPage | **0** | **0** | y |
| `/bumble-photos` | Bumble profile pictures | 52 | 159 | Photos that make someone want to say hello. | 963 | + Product, Breadcrumb, FAQPage | **0** | **0** | y |
| `/dating-profile-photos-for-men` | dating profile photos for men | 51 | 154 | Your photos are the problem. This fixes them. | 1040 | + Product, Breadcrumb, FAQPage | **0** | **0** | y |
| `/real-estate-agent-headshots` | real estate agent headshots | 50 | 153 | The headshot buyers decide to call. | 1074 | + Product, Breadcrumb, FAQPage | 7 | **0** | y |
| `/ai-headshots-vs-photographer` | AI headshots vs photographer | 52 | 156 | When AI headshots beat a photographer, and when they do not. | 1264 | + Product, Breadcrumb, FAQPage | 7 | **0** | y |
| `/ai-dating-photos-vs-photographer` | AI dating photos vs photographer | 52 | 160 | When AI dating photos beat a photographer, and when they do not. | 1187 | + Product, Breadcrumb, FAQPage | **0** | **0** | y |
| `/tools/linkedin-photo-analyzer` | LinkedIn photo analyzer | 57 | 153 | Is your LinkedIn photo working? | 506 | + WebApplication, FAQPage | **0** | **0** | y |
| `/faq` | AI headshot FAQ | 52 | 128 | Questions, answered. | 726 | + Breadcrumb, FAQPage | **0** | **0** | **n** |
| `/blog` | AI headshot guides | 44 | 147 | (blog index) | 1178 | + Blog, Breadcrumb | 15 | **0** | y |
| `/blog/tags` | blog topics | **23** | 124 | (tag index) | **162** | + Breadcrumb | 0 | **0** | y |
| `/contact` | contact Picturesk | 49 | 128 | (contact) | **120** | + Breadcrumb | **0** | **0** | **n** |
| `/privacy` | privacy policy | 48 | 130 | (privacy) | 888 | + Breadcrumb | 0 | **0** | **n** |
| `/terms` | terms of service | 50 | 132 | (terms) | 501 | + Breadcrumb | 0 | **0** | **n** |
| `/refunds` | refund policy | 53 | 136 | (refunds) | **231** | + Breadcrumb | 0 | **0** | **n** |
| `/authors/ammar-afridi` | Ammar Afridi | **24** | 157 | (author) | 1752 | + ProfilePage, Person, Breadcrumb | 21 | 20 | y |

### 5.2 Findings

**O-3: six dating pages, `/pricing`, `/faq` and `/contact` render zero images.** Confirmed by direct `<img>` count on live HTML: `/ai-dating-photos`, `/hinge-photos`, `/tinder-photos`, `/bumble-photos`, `/dating-profile-photos-for-men`, `/ai-dating-photos-vs-photographer`, `/pricing`, `/faq` and `/contact` all return **0**.

The headshot side has proof imagery: the home page shows a before/after grid, `/ai-headshot-generator` has 10 images, `/linkedin-headshots` and `/real-estate-agent-headshots` have 7 each. The entire dating product has none. Not one sample. You are selling photographs, on pages with no photographs, against competitors whose landing pages are wall-to-wall sample grids.

`docs/picturesk/BRAND.md` is unambiguous on this: *"DO show real before/after and result grids as the hero of the product"* and *"Let the photos be the loudest thing on any screen."* The dating pages violate the brand's own first design rule. This costs you conversion, it costs you Google Images and AI visual surfaces entirely, and it is the reason a visitor who lands on `/hinge-photos` has no evidence the product works.

**O-6: money-page H1s carry no keyword.** Every H1 is benefit-led: "A LinkedIn photo people take seriously", "A first photo people stop on", "What AI headshots cost here". The keyword sits in an eyebrow label above the H1 ("LinkedIn Headshots", "Tinder Photos", "Pricing"), so it is on the page, but it is not in the H1 element.

This is a genuine trade-off and the copy is good, so do not gut it. The cheap fix is to promote the eyebrow into the H1 and demote the current H1 to an H2 lede, or to merge them. For `/linkedin-headshots`:

> **H1:** LinkedIn Headshots People Take Seriously
> **H2 lede:** Your profile photo is the first thing a recruiter, a client or a hiring manager sees.

That keeps the voice and puts the keyword in the heading.

**O-8: the home page title does not contain its own documented primary keyword.** `apps/picturesk-frontend/CLAUDE.md` states the home page's primary keyword is **"AI Headshot Generator"** and that both the title and description must contain it. The live title is `Picturesk: AI Headshots and Dating Photos From Selfies` and the description opens `Picturesk turns a few selfies into professional headshots...`. Neither contains the exact phrase. This is your own rule being broken on your most important page.

A replacement that holds the phrase, stays under 60, and keeps both products visible:

> **Title (59):** `AI Headshot Generator and Dating Photos From Your Selfies`
> **Description (157):** `Picturesk is an AI headshot generator that turns a few selfies into professional headshots and candid dating photos. One payment, delivered in about an hour.`

**O-10: seven pages have no OG or Twitter tags at all.** `/faq`, `/contact`, `/privacy`, `/terms`, `/refunds` (and the two empty tag pages). `/faq` is the one that matters: it is a strong AEO asset and is exactly the sort of page that gets shared and cited.

**O-11: two indexable tag pages are empty.** `/blog/tags/team-headshots` renders **30 words** and `/blog/tags/real-estate-headshots` renders **39 words**, both with zero posts, zero outbound links, and `CollectionPage` schema describing a collection that does not exist. Both are in the sitemap and both are `index, follow`. `/blog/tags/pricing-and-value` at 173 words and 2 posts is borderline.

Either write posts into those two tags or stop emitting tag pages with fewer than two posts. Shipping indexable pages with nothing on them teaches a crawler that your tag space is thin, on a domain that has no credit to spend.

**O-12: one real cannibalisation pair.** `/ai-headshots-vs-photographer` (money page, 1264 words) and `/blog/ai-headshots-vs-photographer-compared` (post, 2643 words) target the same query with the same intent. Two URLs competing for one term, and on a three-month-old domain you cannot afford to split the signal. Pick the money page as canonical for the term, retitle the post toward a narrower angle (the cost breakdown, say, which the post already does better), and link the post to the money page with the exact-match anchor.

`/pricing` versus `/blog/how-much-do-professional-headshots-cost` is **not** cannibalisation: one is your price, the other is a photographer's price. Different intent, both legitimate.

**Pricing consistency: pass.** I extracted every dollar figure from the script-stripped text of all 13 commercial pages and cross-checked against `packages/picturesk-shared/src/pricing.js`. Headshots render $0 / $9 / $29 / $49 and dating renders $0 / $19 / $39 / $59 on every page that mentions them. No contradictions, no stale figures. The `$150`, `$500` and `$60` figures on the vs-photographer pages are photographer-cost comparisons, handled in §6.5.

One methodology note: a first pass appeared to find stray figures like `$8`, `$15`, `$16`, `$17` and `$18`. Those are React Server Component flight-data references in the inline script payload, not prices. Stripping scripts removed them. There is no pricing inconsistency on this site.

---

## 6. Phase 3 and 4: Content, blog, AEO and GEO

### 6.1 Blog inventory

20 posts, published daily from 2026-09-15 to 2026-10-04. Word counts run **1498 to 2673**, averaging roughly 2170. Nothing thin.

| Post | Words | Published | Modified | Ext cites | Tables | FAQ Qs |
|---|---|---|---|---|---|---|
| selfies-that-make-ai-headshots-look-like-you | 2673 | 09-22 | 09-22 | 5 | 1 | 5 |
| ai-headshots-vs-photographer-compared | 2643 | 10-04 | 10-04 | 6 | 2 | 5 |
| how-much-do-professional-headshots-cost | 2567 | 10-03 | 10-03 | 5 | 2 | 5 |
| can-people-tell-a-headshot-is-ai | 2565 | 09-30 | 09-30 | 6 | 1 | 5 |
| what-to-wear-for-a-linkedin-headshot | 2564 | 09-17 | **09-17** | 4 | 1 | 5 |
| are-ai-headshots-professional-enough | 2545 | 09-29 | 09-29 | 7 | 1 | 5 |
| how-do-ai-headshot-generators-work | 2533 | 09-27 | 09-27 | 4 | 1 | 5 |
| ai-headshot-vs-face-swap | 2387 | 09-28 | 09-28 | 4 | 1 | 5 |
| why-ai-headshots-look-nothing-like-you | 2342 | 09-23 | 09-23 | 5 | 1 | 5 |
| best-background-for-linkedin-headshot | 2334 | 09-16 | **09-17** | 8 | 1 | 5 |
| what-makes-a-good-linkedin-profile-photo | 2302 | 09-15 | 09-15 | 8 | 1 | 5 |
| what-happens-to-your-photos... | 2278 | 10-01 | 10-01 | 4 | 1 | 5 |
| how-many-photos-for-ai-headshots | 2013 | 09-21 | 09-21 | 4 | 2 | 5 |
| glasses-beards-hats-ai-headshots | 1986 | 09-25 | 09-25 | 4 | 1 | 5 |
| linkedin-photo-cropped-how-to-stop-it | 1824 | 09-18 | 09-18 | 3 | 1 | 4 |
| is-it-honest-to-use-an-ai-headshot | 1751 | 10-02 | 10-02 | 4 | 1 | 4 |
| how-often-to-update-linkedin-photo | 1708 | 09-20 | 09-20 | 4 | 1 | 4 |
| can-you-use-old-photos-for-ai-headshots | 1702 | 09-24 | 09-24 | 3 | 1 | 4 |
| should-you-smile-in-your-linkedin-headshot | 1638 | 09-19 | 09-19 | 3 | 1 | 4 |
| good-light-for-selfies-before-you-upload | 1498 | 09-26 | 09-26 | 3 | 1 | 4 |

**Freshness: clean.** No bulk-set `dateModified`. Only two posts have been edited since publication, both on 2026-09-17, and both legitimately. There is no fake-freshness problem here, which is the usual finding and is worth noting as a pass.

### 6.2 AEO structure — the strongest part of this site

This is textbook, and I want to be precise about it because it means the AEO fix list is short.

**19 of 20 posts repeat the title question verbatim as the first H2**, with a directly extractable answer beneath it. Every post carries `FAQPage` markup with 4 to 5 `Question`/`Answer` pairs. Every post uses at least one table. Headings are question-shaped and match real query phrasing. Semantic HTML throughout, clean hierarchy, no skipped levels.

Measured answer length under the first H2:

| Range | Posts |
|---|---|
| Below 40 words (under the snippet floor) | **0** |
| 40 to 80 words (the target) | 3 |
| 81 to 110 words | 10 |
| Over 110 words | **7** |

**A-7: seven posts run over the 80-word ceiling** for the first answer block: `what-happens-to-your-photos` (176), `good-light-for-selfies` (154), `how-many-photos` (138), `what-makes-a-good-linkedin-profile-photo` (123), `selfies-that-make-ai-headshots-look-like-you` (113), `should-you-smile` (102), `can-people-tell` and `best-background` (100 each). None are below the floor, which is the failure that actually loses snippets, so this is a tightening job and not urgent. Trim each to a 40 to 80 word verdict and push the rest into the body.

**A-6: money pages do not repeat the title question as an H2 with a standalone answer.** This is the real AEO gap. On every commercial page the pattern is: keyword eyebrow, benefit H1, then a strong verdict-first opening paragraph, then sections, then an FAQ block where the question finally appears as an **H3**.

`/pricing` is the clearest case. The title is `AI Headshot Pricing: Plans From $9`. The H1 is "What AI headshots cost here." The question "How much do AI headshots cost?" exists only as an H3 inside the FAQ. When a model is asked what AI headshots cost, the page that gets cited is the one with that question as a heading and a crisp answer directly beneath it. Your blog does this perfectly and your money pages do not, which is backwards: the commercial pages are the ones that should be cited on commercial queries.

Add an H2 to each money page, directly beneath the opening. For `/pricing`:

> ## How much do AI headshots cost?
>
> Picturesk AI headshots cost $9 for 5 headshots, $29 for 25, or $49 for 60, paid once with no subscription and no credits. A free plan gives you 3 headshots so you can check the likeness before you spend anything. Dating photo packs are $19, $39 and $59. Every plan trains a model on your own face and delivers full resolution with no watermark.

That is 71 words, verdict first, every figure machine-extractable, and it matches `pricing.js` exactly.

Do the same on each one: `/linkedin-headshots` → "Do AI LinkedIn headshots look professional?"; `/ai-dating-photos` → "Do AI dating photos work on Hinge, Tinder and Bumble?"; `/hinge-photos` → "What photos get the most likes on Hinge?"; `/ai-headshots-vs-photographer` → "Are AI headshots better than a photographer?". The FAQ answers you already have are mostly the right length; promote the best one to an H2 near the top rather than writing new copy.

**Verdict-first openings: pass.** Every money page and every post states the outcome in the first 100 words. Sampled openings:

- `/ai-headshots-vs-photographer`: *"For a profile photo you need this week, AI headshots from your own selfies win on price and time: $9 to $49, about an hour, no booking. A photographer still wins when you need a specific creative direction..."*
- `/bumble-photos`: *"On Bumble, women send the first message, so your photos have a different job than on Tinder: they have to look approachable and give someone something to open with."*

Both lead with the answer and both admit a limitation, which is exactly the shape models reward. Nothing buries the answer. No hedgy filler. The house style in `CLAUDE.md` is being followed closely, including no em dashes.

### 6.3 Citability and provenance — strong, with one serious exception

12 unique outbound citations across the blog, and they are real primary sources rather than SEO filler:

| Source | Used for |
|---|---|
| PNAS (two papers) | First-impression and face-judgment research |
| ScienceDirect / Cognition | Face perception |
| Princeton University news | Snap-judgment research |
| US Bureau of Labor Statistics | Photographer self-employment rate |
| Association for Psychological Science | First impressions |
| ICO (UK) — two guidance pages | Biometric data, right to erasure |
| LinkedIn Help / LinkedIn Business — four pages | Platform rules and photo guidance |

**Verification caveat, stated plainly:** I attempted to resolve all 12. Five returned `403` (sciencedirect.com, both pnas.org links, princeton.edu, bls.gov) and one returned `999` (linkedin.com profile). Those codes are **bot-blocking, not dead links** — all six are domains that refuse automated requests as a matter of policy. I am not reporting them as broken. The six that did resolve returned `200`. **Open the five 403s by hand before you rely on them**, because a dead citation on a page whose whole purpose is provenance is worse than no citation.

The `$150 to $500` photographer figure is handled well: it is hedged in the copy as *"a typical range, not a fixed rate, so get a written quote"*, and the BLS 67% self-employment statistic is attributed to BLS by name inside the schema answer. That is the right way to put a figure into machine-readable markup.

**C-1: three testimonials are hardcoded with no provenance and render as genuine customer reviews.**

This is the one credibility finding, and under the audit's own tie-breaker it outranks every pure optimisation on the list.

[data/landing.js:78-99](apps/picturesk-frontend/data/landing.js#L78-L99) holds a static `testimonials` array: "Dana Whitfield, Product Manager", "Marcus Oyelaran, Co-founder, remote agency", "Tomas Reinholt, Freelance consultant". Each has `rating: 5` and a detailed, specific quote. They render on the **home page**, **`/ai-headshot-generator`** and **`/ai-dating-photos`** under the heading "What people say about their set."

What I verified: the quotes are hardcoded in a static data file, carry no customer reference, no order ID, no date, no verification link, and no source of any kind. One quote describes a twelve-person team across four countries.

What I cannot verify, and am not asserting: whether these are real customers. **You need to confirm this.** If they are real, get written permission and add provenance (first name plus role is fine, a date helps). If they are placeholder copy that shipped, remove them now. Three invented five-star reviews on a payment page is an FTC endorsement-rule problem in the US and a consumer-protection problem in the UAE, independent of any SEO consideration. It is also precisely the signal that makes a model refuse to cite you.

A three-month-old site with few customers has an honest alternative that converts better than fake praise: show the founder's own results, which you already do and already say so (`BRAND.md` notes the home page headshots are the founder's own, generated from his own selfies). "Here is my face, here are my selfies, here is what came out" is more persuasive than a stranger's five stars, and it is true.

Leave `Review` and `AggregateRating` schema off until this is resolved. Marking up unverifiable reviews would turn a copy problem into a structured-data violation.

### 6.4 Consistency and entity identity

**A-5: there is no legal entity anywhere on this site.**

- `/terms` (691 words) says the terms *"are governed by the laws of the United Arab Emirates"* and names *"the exclusive jurisdiction of the courts of Dubai"*, and **names no company**.
- No registered entity name, trade licence, registered address or phone number on `/terms`, `/privacy`, `/refunds`, `/contact` or in the footer.
- `/contact` (120 words) offers an email address and nothing else.
- `Organization` schema has `name`, `url`, `logo`, `email`, `contactPoint` — no `legalName`, no `address`, no `telephone`, no `sameAs`.

Two consequences. For Google, a transactional site that collects face photographs and card payments while naming no legal entity is a weak trust profile, and trust is weighted heavily in exactly this category. For AI citation, `sameAs` is how you tell a model that the Picturesk on this domain is the same Picturesk on LinkedIn, X, Product Hunt or anywhere else. With no `sameAs` and no entity record, there is nothing for a model to connect, which is a large part of why nothing surfaces when you ask one about Picturesk.

Fix in `lib/schema.js`:

```js
"legalName": "<registered entity name>",
"address": { "@type": "PostalAddress", "streetAddress": "...", "addressLocality": "Dubai", "addressCountry": "AE" },
"telephone": "+971...",
"sameAs": ["https://www.linkedin.com/company/...", "https://x.com/...", "https://www.producthunt.com/products/..."],
"foundingDate": "2026"
```

and name the entity in Terms, Privacy, Refunds and the footer. I could not supply the values because you did not provide HOUSE FACTS; see §9.

**Other consistency checks: pass.** I checked product claims across money pages, legal pages and the FAQ. "One payment, no subscription, no credits" holds everywhere. The look-like-you guarantee and the automatic refund on a failed run are described consistently on `/refunds`, `/faq` and every product page. The "about an hour" delivery claim is uniform. Photo handling on `/privacy` matches `/faq` and matches the architecture (`picturesk-shared/storage.js`, direct-to-R2 upload). The two products are described consistently and neither page claims the other's features. No roadmap service is presented as live.

### 6.5 Collection-level content findings

**C-2: all 20 posts are informational. Zero commercial intent.** Every post answers a question; not one targets a buying query. The structural consequence is that your money pages have to rank entirely unaided, with no topical support and, per §7, no internal links either.

**C-3: the dating product has no content at all.** Six dating money pages (`/ai-dating-photos`, `/hinge-photos`, `/tinder-photos`, `/bumble-photos`, `/dating-profile-photos-for-men`, `/ai-dating-photos-vs-photographer`) are supported by **zero** blog posts. All 20 posts are headshot and LinkedIn topics. Half your product surface has no content cluster behind it, and the tag taxonomy has no dating tag.

Given the dating pages also have zero images (O-3), the dating product is currently the weakest half of the site on every axis measured here. Worth deciding deliberately whether it is a priority; if it is, it needs content and samples, and if it is not, it should stop consuming six indexable URLs' worth of crawl budget on a young domain.

**Cluster shape.** Two real clusters exist in the content:

- **LinkedIn photo tips** — 7 posts, tag `linkedin-headshots`, well interlinked.
- **AI headshots explained** — 8 posts, tag `ai-headshots-explained`, well interlinked.

Both are genuine hub-and-spoke structures around tag pages. Neither is a hub around a **money page**, which is the problem: the hubs are `/blog/tags/linkedin-headshots` and `/blog/tags/ai-headshots-explained`, not `/linkedin-headshots` and `/ai-headshot-generator`. The clusters are well built and pointed at the wrong centre.

**Money pages receiving zero blog links:** all 20. Named explicitly, because this is the finding: `/`, `/pricing`, `/ai-headshot-generator`, `/ai-dating-photos`, `/linkedin-headshots`, `/tinder-photos`, `/hinge-photos`, `/bumble-photos`, `/dating-profile-photos-for-men`, `/real-estate-agent-headshots`, `/ai-headshots-vs-photographer`, `/ai-dating-photos-vs-photographer`, `/tools/linkedin-photo-analyzer`, `/faq`, `/blog`, `/blog/tags`, `/contact`, `/privacy`, `/terms`, `/refunds`.

### 6.6 Machine access — pass, with one omission

Nothing of value is client-rendered. Every answer, every price, every FAQ is in the server HTML. No AI crawler is blocked. Extraction is clean.

**A-9: no `/llms.txt`.** Returns 404. This is not a ranking factor and I am not going to overstate it, but it is a cheap, standard way to hand a model a curated map of your best pages, and a direct competitor is already doing it — `headshotpro.com/llms.txt` surfaced in search results during this audit. A short `llms.txt` listing your money pages, your pricing, your guarantee terms and your strongest posts costs an hour.

---

## 7. Phase 5: Internal linking and equity flow

This is the lowest-scoring bucket and the largest lever on the stated symptom.

**Method:** I built the full graph from 54 crawled production pages, normalised every href, and classified any link appearing on 90% or more of pages as nav/footer boilerplate. Everything below counts **contextual links only**.

**Boilerplate (present on all 54 pages):** `/`, `/ai-headshot-generator`, `/linkedin-headshots`, `/real-estate-agent-headshots`, `/ai-headshots-vs-photographer`, `/ai-dating-photos`, `/hinge-photos`, `/tinder-photos`, `/bumble-photos`, `/dating-profile-photos-for-men`, `/ai-dating-photos-vs-photographer`, `/tools/linkedin-photo-analyzer`, `/pricing`, `/blog`, `/login`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refunds`.

Note what that list is: **it is every money page and every marketing page on the site.** They are all in the nav and footer, and that is the whole of their internal link profile.

### 7.1 Contextual inbound links

| Page | Contextual inbound |
|---|---|
| `/authors/ammar-afridi` | **20** |
| `/blog/is-it-honest-to-use-an-ai-headshot` | **20** |
| `/blog/tags/headshot-tips` | 14 |
| `/blog/ai-headshots-vs-photographer-compared` | 13 |
| `/blog/tags/ai-headshots-explained` | 13 |
| `/blog/what-happens-to-your-photos...` | 12 |
| `/blog/how-often-to-update-linkedin-photo` | 10 |
| ...16 further blog posts and tag pages | 2 to 9 |
| `/blog/tags/real-estate-headshots` | 1 |
| `/blog/tags/team-headshots` | 1 |
| **Every one of the 20 money and marketing pages** | **0** |

**T-1: zero contextual inbound internal links to any page that sells anything.** The two most internally linked pages on this site are an **author bio** and a **blog post about whether using an AI headshot is honest**. Not `/pricing`. Not `/ai-headshot-generator`. Not `/linkedin-headshots`.

The author page gets 20 contextual inbound links because every post bylines it. That is correct for E-E-A-T and I would not remove it. But the result is that the single strongest internal destination on the site is a page that cannot take a payment, and it passes nothing onward to one that can: its 20 outbound contextual links all go back into the blog.

### 7.2 Contextual outbound links

| Page | Contextual outbound | Where to |
|---|---|---|
| `/authors/ammar-afridi` | 20 | all blog posts |
| `/blog` | 15 | blog posts (page 1) |
| `/blog/tags/headshot-tips` | 9 | blog posts |
| `/blog/tags/ai-headshots-explained` | 9 | blog posts |
| each blog post | 5 to 7 | author, 1-2 tags, 3-4 sibling posts |
| `/` | **2** | both are 307s to signup |
| `/pricing` | **2** | both are 307s to signup |
| each other money page | **1 to 2** | 307s to signup |
| `/faq`, `/contact`, `/privacy`, `/terms`, `/refunds` | **0** | — |
| `/blog/tags/team-headshots`, `/blog/tags/real-estate-headshots` | **0** | — |

Every blog post's contextual outbound set is: the author page, one or two tag pages, and three or four sibling posts. **Never a money page.** The blog is a closed loop.

And every money page's only contextual outbound links are the two funnel entry points, both of which 307 to `/signup`. So the money pages have, in effect, **no** followable contextual outbound links at all.

### 7.3 Anchor text

Within the blog, anchor text is descriptive and varied, which is good. The boilerplate nav uses keyword-appropriate labels. The problem is not anchor quality; it is that no contextual anchor anywhere on the site points at a commercial page, so there is no anchor-text signal for any commercial term.

### 7.4 What to do

This is fix #1 on the list and it is mostly a content-editing job, not an engineering one.

**Add 2 to 3 contextual links from each post to the money page it is adjacent to.** The mapping is obvious from the existing titles:

| Posts | Should link to | Suggested anchor |
|---|---|---|
| `what-makes-a-good-linkedin-profile-photo`, `best-background-for-linkedin-headshot`, `should-you-smile-in-your-linkedin-headshot`, `what-to-wear-for-a-linkedin-headshot`, `linkedin-photo-cropped-how-to-stop-it`, `how-often-to-update-linkedin-photo` | `/linkedin-headshots` | "AI LinkedIn headshots from your selfies" |
| `how-much-do-professional-headshots-cost`, `ai-headshots-vs-photographer-compared` | `/pricing`, `/ai-headshots-vs-photographer` | "what AI headshots cost here" |
| `how-many-photos-for-ai-headshots`, `selfies-that-make-ai-headshots-look-like-you`, `good-light-for-selfies-before-you-upload`, `can-you-use-old-photos-for-ai-headshots`, `glasses-beards-hats-ai-headshots` | `/ai-headshot-generator` | "our AI headshot generator" |
| `are-ai-headshots-professional-enough`, `can-people-tell-a-headshot-is-ai`, `is-it-honest-to-use-an-ai-headshot`, `why-ai-headshots-look-nothing-like-you`, `ai-headshot-vs-face-swap`, `how-do-ai-headshot-generators-work` | `/ai-headshot-generator`, `/ai-headshots-vs-photographer` | "headshots trained on your own face" |
| `what-happens-to-your-photos...` | `/privacy`, `/ai-headshot-generator` | "how we handle your photos" |
| `linkedin-photo-cropped-how-to-stop-it`, `what-makes-a-good-linkedin-profile-photo` | `/tools/linkedin-photo-analyzer` | "score your current LinkedIn photo" |

**Cross-link the money pages to each other contextually**, not just through the nav. `/linkedin-headshots` should link in prose to `/pricing` and `/ai-headshots-vs-photographer`. `/pricing` should link to both product pages. `/hinge-photos`, `/tinder-photos` and `/bumble-photos` should link to each other and to `/ai-dating-photos` and `/dating-profile-photos-for-men` — `/dating-profile-photos-for-men` already has H3s named for all three apps, so the links belong there and are currently absent.

**Add outbound contextual links to `/faq` and the legal pages.** All four currently have zero.

**Make the author page pass equity forward.** One line in the bio linking to `/ai-headshot-generator` turns the site's most-linked page from a sink into a source.

No GSC export, so I cannot tell you which ranking pages are one internal link away from improving. That analysis needs Phase 6.

---

## 8. Master fix list

Ranked by impact. Ties broken by: live bugs and credibility errors first, then lower effort, then fixes that unblock others.

| # | Issue | Scope | Category | Impact | Effort | Fix | Serves |
|---|---|---|---|---|---|---|---|
| 1 | No contextual internal links to any money page; blog is a closed loop | all 20 money pages, all 20 posts | Internal linking | **Critical** | M | Add 2-3 contextual links per post per the §7.4 map; cross-link money pages in prose | Rankings, conversion |
| 2 | `og:image` 404s sitewide | ~28 pages | Technical / live bug | **Critical** | **S** | Ship `public/og-image.png` at 1200x630 | AI presence, conversion |
| 3 | Three unverifiable testimonials render as real reviews | `/`, `/ai-headshot-generator`, `/ai-dating-photos` | Credibility / legal | **Critical** | **S** | Verify and attribute, or delete [data/landing.js:78-99](apps/picturesk-frontend/data/landing.js#L78-L99) | Trust, AI citation | |
| 4 | Six dating pages, `/pricing`, `/faq` render zero images | 9 pages | On-page / conversion | **High** | M | Add before/after and result grids per `BRAND.md` | Conversion, image search |
| 5 | No legal entity, address or `sameAs` anywhere | sitewide | AEO / trust | **High** | S | Add to `Organization` schema, Terms, Privacy, Refunds, footer | AI citation, trust |
| 6 | Money pages lack a question H2 with a 40-80 word answer | 13 money pages | AEO | **High** | M | Add one H2 + answer per page; §6.2 has `/pricing` written out | AI citation |
| 7 | All 20 posts are informational; dating product has zero content | collection level | Content | **High** | L | Write commercial-intent posts; build a dating cluster | Rankings |
| 8 | `/favicon.ico` and `apple-touch-icon.png` 404 | sitewide | Technical / live bug | Medium | **S** | Add both to `public/` | Trust, polish |
| 9 | Sitemap stamps `lastmod` = now on 20 static pages hourly | sitemap | Technical | Medium | **S** | Per-path dates or drop the field, [app/sitemap.js](apps/picturesk-frontend/app/sitemap.js) | Crawl signal |
| 10 | Two empty indexable tag pages (30 and 39 words) | 2 pages | On-page | Medium | **S** | Write posts into the tags or suppress tags with <2 posts | Crawl quality | |
| 11 | Money-page H1s carry no keyword | 13 pages | On-page | Medium | M | Promote the eyebrow into the H1, demote current H1 to H2 lede | Rankings |
| 12 | Home title misses its own documented primary keyword | `/` | On-page | Medium | **S** | Use the 59-char replacement in §5.2 | Rankings |
| 13 | `Product` has one `Offer` at lowest price, no `image` | 12 priced pages | Structured data | Medium | S | `AggregateOffer` with low/high price; add `image` | Rich results |
| 14 | vs-photographer cannibalisation pair | 2 URLs | On-page | Medium | S | Money page canonical for the term; retitle the post narrower; link post → page | Rankings |
| 15 | Seven pages have no OG or Twitter tags | 7 pages | On-page | Low-Med | **S** | Add `buildMetadata` OG block, `/faq` first | Sharing |
| 16 | No `/llms.txt` | sitewide | AEO | Low-Med | **S** | Curated map of money pages, pricing, guarantee, best posts | AI presence |
| 17 | Seven posts' first answer exceeds 80 words | 7 posts | AEO | Low-Med | M | Trim to a 40-80 word verdict, push the rest down | AI citation |
| 18 | Every page served `no-store` | sitewide | Technical | Low | S | Cache headers on static marketing routes | Cost, TTFB |
| 19 | CTA price chip fails contrast at 3.52:1 | money pages | Accessibility | Low | **S** | Recheck after the design-pass deploy; darken the chip ground if still failing | Accessibility |
| 20 | `/blog?page=2` absent from sitemap | 1 URL | Technical | Low | **S** | Include paginated blog URLs | Crawl |
| 21 | `WEB_BASE_URL` unset in production; correct only by fallback | config | Technical | Low | **S** | Set it explicitly in `fly.picturesk-web.toml` | Robustness |
| 22 | Author page is the top internal destination and passes nothing forward | `/authors/ammar-afridi` | Internal linking | Low | **S** | One bio link to `/ai-headshot-generator` | Equity flow |
| 23 | Five citations could not be auto-verified (403/999 bot blocks) | 5 blog posts | Provenance | Low | **S** | Open each by hand and confirm before relying on them | Provenance |

---

## 9. What this audit could not tell you, and why it matters

**Get a Google Search Console export.** It is verified by DNS, so the data already exists in two properties. Without it this audit cannot tell you:

- whether your 48 pages are **indexed** or merely crawled. This is the first thing you need to know and I could not determine it.
- whether you have impressions at all. "Not appearing on SERPs" has two very different diagnoses: zero impressions (not indexed, or no authority) versus impressions with no clicks (a CTR problem). The fixes barely overlap, and I cannot distinguish them.
- which queries you already surface for, and which are in striking distance.
- which pages Google chose as canonical, versus which you declared.

The honest summary is that this site is **technically excellent and commercially unlinked, on a three-month-old domain**. Lighthouse SEO 100, perfect Core Web Vitals, clean canonicals, a well-formed schema graph with `@id` references, 20 substantial posts with real primary-source citations and textbook FAQ structure. Someone built this carefully.

What it does not have is any internal path to a page that sells something, any entity identity a machine can resolve, a working social preview image, or time. Three of those four are fixable in a week. The fourth is not, and no fix list substitutes for it.

Also worth stating plainly: do not read the overall score of 73 as a projection of what the site will score after these fixes. Closing the fix list is not the same measurement as observing live behaviour. Re-run this audit with a GSC export in 60 to 90 days, and any new score then will be a measurement rather than a forecast.
