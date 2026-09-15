# Picturesk SEO / AEO / GEO audit

**Date:** 10-09-2026
**Environment audited:** local dev, frontend `http://localhost:3000`, backend `http://localhost:3001`
**Branch / commit:** `master` @ `ae978b1` (working tree clean for Picturesk files)
**Live parity:** this commit is the one deployed to `picturesk-web` on the same day, so findings apply to production.

## What was and was not checked

Checked: full route enumeration from the file system, live rendered HTML for all 20 routes, robots.txt, sitemap.xml, live response headers, redirect behaviour, JSON-LD parsing and field completeness, per-page on-page signals, the internal link graph, the single published blog post, and copy against house facts.

Not checked, and why:

| Area | Status | Reason |
| --- | --- | --- |
| Lab Core Web Vitals (LCP, CLS, INP) | **Not verified** | No browser or Lighthouse available in this session (the chrome-devtools MCP server failed to connect). Performance is reported as server-side proxies: TTFB, transfer time, payload weight, image weight, and static analysis of loading attributes. Treat the performance sub-score as partial. |
| GSC data | **Not provided** | No export path given. Phase 6 is skipped and the Internal Linking score is based on graph structure alone. |
| Value of `GENERATION_BACKEND` | **Not verified** | The secret exists on `picturesk-worker` but its value is not readable. This gates a factual claim repeated across the site (see F1). |
| Mobile rendering | **Partial** | Viewport meta and responsive CSS reviewed in source; no real device or viewport rendering. |

Servers were already running and were left running; nothing was started or stopped. No file was modified except this report. No mutating API calls were made (dev `MONGODB_URI` points at the shared production database).

---

## Executive summary

| Bucket | Score |
| --- | --- |
| Technical SEO | 72 / 100 |
| On-page SEO | 61 / 100 |
| Content & Blog | 44 / 100 |
| AEO / GEO | 74 / 100 |
| Internal Linking | 38 / 100 |
| **Overall (weighted)** | **59 / 100** |

Weights: Technical 25%, On-page 20%, Content & Blog 20%, AEO/GEO 20%, Internal Linking 15%.

The site is technically tidy for its age: clean sitemap, correct canonicals on indexable pages, correct noindex on the funnel and admin, valid JSON-LD everywhere, and a genuinely strong home page for AI extraction. It is held back by three things: the canonical money page receives **zero** direct internal links, the content programme is one post old, and two live claims are not backed by the product.

### Top 10 fixes

1. **F1** Verify `GENERATION_BACKEND`. If production runs `pulid`, "we train a model on your face" is false in nine places.
2. **F2** Link directly to `/ai-headshot-generator`. Nothing does; every internal path goes through a 308 on `/`.
3. **F3** Enforce the advertised outfit and background limits, or remove them from the pricing cards.
4. **F4** Replace the invented testimonials and their invented 5-star ratings.
5. **F5** Fix the broken `/blog/tags/*` links rendered on every blog post (404).
6. **F6** Stop lazy-loading the hero images; they are the LCP element.
7. **F7** Add the missing `og-image.png` (every OG and Twitter card currently points at a 404).
8. **F8** Give the five content pages OG/Twitter tags and schema; they have none.
9. **F9** Rewrite the five content-page titles; they carry no keyword and average 25 characters.
10. **F10** Publish more than one blog post, and interlink posts to the money page.

---

## Phase 0 — Stack

| Item | Finding |
| --- | --- |
| Framework | Next.js 16.3.0, App Router, React 19.2.5 |
| Rendering | Marketing and content pages server-rendered; funnel steps and `/success` are client components |
| Styling | Two systems by design: plain CSS (`app/globals.css`) for `app/(site)`, Tailwind v4 scoped to `app/admin`, plus a third scoped Tailwind entry (`app/(site)/shared-ui.css`) that compiles only the shared components the site renders |
| Blog source | API-driven. `@travel-suite/blog` domain on `picturesk-backend`, consumed through `@travel-suite/frontend-shared` client pages |
| Metadata | `export const metadata` and `generateMetadata` across 16 page files; home and blog use the `lib/schema.js` builders, content pages hand-roll a bare object |
| Sitemap / robots | `app/sitemap.js` and `app/robots.js`, both dynamic; sitemap revalidates hourly and pulls published posts from the API |
| i18n | None. Single locale, no hreflang. **N/A** for this audit |

**Routes enumerated: 41** (20 rendered pages, 9 API route handlers, 12 admin pages). Public indexable pages: **8**. Blog posts published: **1**.

---

## Phase 1 — Technical SEO

### Indexability

Correct and deliberate. All eight public pages return `index, follow` with a self-referencing absolute canonical. The funnel, auth, account, success, cancel and every admin route return `noindex, nofollow`. No stray noindex on a real page. No `X-Robots-Tag` headers are set at the edge, so meta tags are the only signal, which is fine but means a CDN misconfiguration would be invisible.

### Sitemap

`sitemap.xml` lists exactly the 8 indexable URLs and the published post, excludes every noindex route, and is referenced from robots.txt with a `Host` directive. Cross-checked against the Phase 0 route list: **no gaps, no leaks**. This is the strongest part of the technical setup.

### Canonicals and duplication

- `/` 308-redirects to `/ai-headshot-generator`, and `/` carries a canonical pointing at the destination. Correct.
- Legacy `/generator/select`, `/generator/upload`, `/generator/pay`, `/generator/capture` all 308 to their new paths. No chains.
- Apex to www redirect is configured in `next.config.mjs`, host-matched so it never fires on localhost or fly.dev.
- Blog pagination exists in the component but there is only one post, so page 2+ canonical behaviour is untested.
- An unknown blog slug returns a hard **404**, not a soft 200. Correct, and the code comments show this was deliberate.

### Performance (proxy measurements, not lab CWV)

| Page | TTFB | Total | HTML | Images | Missing width/height | Lazy |
| --- | --- | --- | --- | --- | --- | --- |
| `/ai-headshot-generator` | 0.054s | 0.054s | 115 KB | 10 | 10 | 10 |
| `/blog` | 0.100s | 0.100s | 37 KB | 1 | 1 | 1 |
| `/blog/how-many-photos...` | 0.123s | 0.123s | 75 KB | 1 | 1 | 0 |
| `/faq` | 0.129s | 0.130s | 31 KB | 0 | 0 | 0 |
| `/contact` | 1.644s | 1.645s | 21 KB | 0 | 0 | 0 |

Findings:

- **All three hero images carry `loading="lazy"`.** The hero cluster is the LCP element on the primary landing page, and it is explicitly deferred. `Frame.js` hardcodes the attribute for every use.
- **No image on the site sets `width`/`height`.** CLS is partly protected by `aspect-ratio: 1/1` on `.frame`, but the blog cover and option-card images rely on their own containers.
- **The site uses raw `<img>`, not `next/image`, for all marketing images.** No srcset, so a phone downloads the same 1024px files a desktop does. The home page ships ~928 KB of images from `public/work` alone.
- Fonts: Commissioner is loaded from Google Fonts as a render-blocking stylesheet in `<head>`, preconnected and preloaded. `display=swap` is set, so FOUT not FOIT, but it is still a third-party round trip in the critical path.
- `/contact` TTFB of 1.64s is an outlier worth a second measurement; every other page is under 350ms.

### Crawl hygiene

- **Broken internal link:** every blog post renders tag chips linking to `/blog/tags/<slug>`. Picturesk never built that route. `/blog/tags/headshot-tips` returns **404**. The link comes from the shared `BlogPostPage`, so it will appear on every post ever published.
- **Redirect-only path to the money page:** see Phase 5.
- Footer anchors use `/#work`, `/#how`, `/#pricing`, which pass through the 308 on every click from any non-home page.

### Structured data

Every JSON-LD block on every page parses. **Zero malformed blocks.** Types present: `Organization`, `WebSite`, `WebPage`, `Product`, `FAQPage` (home); `Blog`, `BreadcrumbList` (blog index); `BlogPosting`, `FAQPage`, `BreadcrumbList` (post).

Gaps:

- `BlogPosting.author` is **missing**. The post was created through the `ADMIN_TOKEN` break-glass path, which has no user id, so `author` is null in the database and omitted from schema. E-E-A-T signal lost.
- No `Organization.sameAs` (no social profiles declared), no `aggregateRating` anywhere (correctly, since there are no real reviews).
- The five content pages emit **no schema at all**.

---

## Phase 2 — On-page SEO

| URL | Target keyword | Title | Len | Meta desc | Len | H1 | Canonical | Index | Schema | Words | Links out | OG/TW |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/ai-headshot-generator` | AI headshot generator | AI Headshot Generator \| Studio Headshots from Selfies | 53 | yes | 158 | 1 | self | yes | Org, WebSite, WebPage, Product, FAQPage | 1466 | 20 | yes |
| `/blog` | AI headshot guides | AI Headshot Guides and Tips \| Picturesk Blog | 44 | yes | 147 | 1 | self | yes | Org, WebSite, WebPage, Blog, Breadcrumb | 101 | 16 | yes |
| `/blog/how-many-photos-for-ai-headshots` | how many photos for AI headshots | How Many Photos for AI Headshots? 10 to 12 | 42 | yes | 127 | 1 | self | yes | BlogPosting, FAQPage, Breadcrumb | 700 | 18 | yes |
| `/faq` | (none clear) | FAQ. Picturesk.ai | 17 | yes | 103 | 1 | self | yes | **none** | 714 | 14 | **no** |
| `/contact` | (none clear) | Contact. Picturesk.ai | 21 | yes | 78 | 1 | self | yes | **none** | 157 | 15 | **no** |
| `/privacy` | (none clear) | Privacy Policy. Picturesk.ai | 28 | yes | 73 | 1 | self | yes | **none** | 865 | 16 | **no** |
| `/terms` | (none clear) | Terms of Service. Picturesk.ai | 30 | yes | 94 | 1 | self | yes | **none** | 513 | 17 | **no** |
| `/refunds` | (none clear) | Refund Policy. Picturesk.ai | 27 | yes | 87 | 1 | self | yes | **none** | 239 | 16 | **no** |

Noindex pages (not scored): `/login`, `/signup`, `/account`, `/success`, `/cancel`, the four funnel steps, and all admin routes.

Flags:

- **No title exceeds 60 characters and no description exceeds 160.** The project's own SEO rule is being followed on every page. Good.
- **Five titles average 25 characters** and follow a `Thing. Picturesk.ai` pattern with no keyword. `/faq` at 17 characters is wasting the single strongest on-page field on a page with 714 words of genuine buying-objection content.
- **Duplicate meta description on 11 pages.** Every noindex page inherits the root layout's default description. Harmless for ranking since they are noindex, but it means the root layout default is doing work nobody reviews.
- **Duplicate title and description on `/` and `/ai-headshot-generator`** is expected and correct given the canonical.
- **Missing H1 on 5 routes** (`/success`, three funnel steps, `/admin`). All are noindex client-rendered shells, so low impact, but `/ai-headshot-generator/upload` and `/payment` render no H1 even after hydration in the crawled HTML.
- **Zero OG/Twitter tags on the five content pages.** Shared links to the refund policy or FAQ render as a bare URL.
- **`og-image.png` returns 404.** Every page that does emit OG tags points `og:image` and `twitter:image` at `https://www.picturesk.ai/og-image.png`, which does not exist. Every social share of the home page, blog index and blog post currently renders with a broken image.
- **Cannibalisation risk, mild:** `/faq` and the home page FAQ section both answer "How many photos do I need?", and the blog post targets the same question at length. The blog post is the right owner; the other two should stay short and link to it.

---

## Phase 3 — Content and blog

### The single post

| Field | Value |
| --- | --- |
| Title | How Many Photos Do You Need for AI Headshots? |
| Meta title / description | 42 / 127 chars, both within limits |
| Words | ~700 |
| `datePublished` / `dateModified` | present in schema and shown on page |
| Schema | `BlogPosting` + `FAQPage` (3 questions) + `BreadcrumbList` |
| Author | **missing in schema and on page** |
| Headings | h2 x5, h3 x2, clean hierarchy, no skips |
| Images | 1, with alt text |
| Internal links in | 1 (the blog index) |
| Internal links out | funnel select, blog index, plus chrome |
| Outbound citations | **0** |

The post itself is well built: verdict in the first sentence, the title question repeated as an H2 with a direct answer beneath it, a comparison table, a numbered process, and three FAQs marked up. This is the template the rest of the programme should follow.

### Collection level

There is no collection. One post is not a content programme, and it produces the following:

- **No topical cluster.** One tag (`Headshot Tips`) with one post in it, and the tag page 404s.
- **No internal linking between posts**, because there is nothing to link to.
- **No blog links into the money page beyond the generic CTA.** The post links to `/ai-headshot-generator/select`, skipping the landing page entirely.
- Obvious gaps, all of which the existing site copy already half-answers and could be expanded into posts: LinkedIn headshot guidance, what to wear, AI headshots vs a photographer (cost and time comparison), team and company headshots, how AI headshots work, headshot mistakes to avoid.

---

## Phase 4 — AEO / GEO

Strong, and the best-performing bucket after technical.

**Verdict-first:** the home page opens with a 53-word quick answer directly under the H1 that names the product category, the input, the process, the turnaround and the exclusions. The blog post opens with "Ten to twelve photos is the sweet spot" before any preamble. Both are directly extractable.

**Snippet targets:** the home page carries 6 question-shaped H3s (the FAQ), all marked up as `FAQPage`, and the schema matches exactly what is visible, which is what Google's FAQ guidance requires. The post adds a comparison table and its own `FAQPage`.

**Extractability:** semantic HTML throughout, one H1 per page, no skipped heading levels on any indexable page, tables used for the plan comparison in the post.

**Citability:** specific and checkable figures are everywhere (5 to 15 photos, three prices, 5/25/60 headshots, about an hour, 14 days). That is exactly what an LLM will lift. Weaknesses: **zero outbound citations to any authority** on any page, and **no author attribution** anywhere on the site, so there is no entity to associate the expertise with.

**Machine access:** robots.txt allows all user agents, with no AI-crawler blocks. Key content is server-rendered. Nothing here impedes extraction.

**Consistency against house facts:**

| Fact | Result |
| --- | --- |
| Single product, no second service | Consistent everywhere |
| Prices $9 / $29 / $49 | Consistent on the home page; no contradictory price found anywhere |
| 5 to 15 photos, screened before payment | Consistent across home, FAQ, blog |
| Delivery by email in about an hour | Consistent |
| Two distinct refund promises | Kept distinct on home, refunds page and FAQ |
| No auto-delete claim | Privacy page correctly says photos are deleted **on request**, never automatically |
| Brand neutrality | Clean. No other monorepo brand is named anywhere on the site |
| "We train a model on your face" | **At risk.** See F1 |
| Per-tier outfit and background limits | **Contradicted by the product.** See F3 |

---

## Phase 5 — Internal linking and equity

This is the weakest bucket and it has one dominant cause.

**`/ai-headshot-generator` has zero inbound internal links.** Verified across all 18 site pages: not one links to it directly. The brand wordmark, the footer product column and the footer anchors all point at `/`, which 308-redirects. The canonical, indexable, keyword-targeted money page is an orphan in its own link graph, reachable only through a redirect. Redirects pass most equity but they are not a substitute for direct links, and they cost a round trip on every internal navigation.

| Page | Inbound internal links (excluding chrome) |
| --- | --- |
| `/blog`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refunds` | 17 each (all from the footer, on every page) |
| `/blog/how-many-photos-for-ai-headshots` | 1 (blog index only) |
| `/ai-headshot-generator` | **0** |

Other findings:

- **Anchor text is generic where it matters.** The footer uses "Samples", "How it works", "Pricing" pointing at fragments of the home page, and the wordmark is the only other route in. No internal link anywhere uses the phrase "AI headshot generator" as anchor text.
- **The legal pages are the best-linked pages on the site** at 17 inbound links each, which is backwards. Privacy, terms and refunds do not need equity; the landing page does.
- **The blog post is one link from the index and nothing else.** It should be linked from the home FAQ answer on the same question and from `/faq`.
- **The funnel receives the CTAs but the landing page receives nothing**, so link equity flows past the page that has to rank.

---

## Phase 6 — GSC opportunities

**Not run.** No export was supplied. Re-run with `GSC EXPORT PATH` set to get striking-distance queries, low-CTR rewrite candidates, and content gaps tied to real impressions.

---

## Scoring

| Bucket | Score | Justification |
| --- | --- | --- |
| Technical SEO | **72** | Sitemap, canonicals, robots policy, redirect handling and 404 behaviour are all correct, and every JSON-LD block parses. Held down by a broken internal route emitted on every post, a lazy-loaded LCP image, no image dimensions anywhere, no `next/image`, and a 404 OG image. Lab CWV unverified, so this is scored on what was measurable. |
| On-page SEO | **61** | Title and description length rules are followed perfectly and every indexable page has one H1 and a self-canonical. Five of eight indexable pages have no keyword in the title, no OG/Twitter and no schema, which is a third of the site running on defaults. |
| Content & Blog | **44** | The one post is genuinely well constructed and is the right template. But one post is not a programme: no clusters, no inter-post linking, a 404ing tag page, no author, and no outbound citations. Scored on what exists, which is thin. |
| AEO / GEO | **74** | Verdict-first copy, extractable quick answers, question-shaped headings, FAQ schema matching visible content, specific figures, and no crawler blocks. Loses points for zero outbound citations, no author entity, and two factual claims that may not hold. |
| Internal Linking | **38** | The money page has zero direct inbound links and is reachable only via a redirect; legal pages are the best-linked pages on the site; anchor text is generic; the only blog post is nearly orphaned. Structurally the weakest area and the cheapest to fix. |
| **Overall** | **59** | Weighted: Technical 25, On-page 20, Content 20, AEO 20, Linking 15. |

---

## Fix list

| # | Issue | Scope | Category | Impact | Effort | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | "We train a model on your face" may be false if production runs the PuLID backend, which does no training | Home (x3), FAQ, blog post, Trustpilot copy | Credibility / AEO | **High** | Low | Read `GENERATION_BACKEND` on `picturesk-worker`. If `pulid`, rewrite every training claim to describe reference-image generation. Serves conversion and AI-citation accuracy |
| F2 | `/ai-headshot-generator` has zero direct inbound internal links; all paths go through the 308 on `/` | Whole site | Linking | **High** | Low | Point the wordmark, footer product links and footer anchors at `/ai-headshot-generator` directly. Serves rankings |
| F3 | Advertised per-tier outfit and background limits are not enforced in the funnel or at `/checkout` | Pricing section, select step, checkout | Credibility / conversion | **High** | Med | Cap selection on the select step and validate against the tier server-side, or remove the limits from the cards. Serves conversion and refund exposure |
| F4 | Home page testimonials are invented people with invented 5-star ratings | Home | Credibility | **High** | Low | Replace with real attributable quotes or remove the section. Serves conversion and regulatory exposure |
| F5 | Every blog post links to `/blog/tags/<slug>`, which 404s | All posts | Technical | **High** | Med | Build the tag route (the shared `BlogTagDetailPage` exists) or suppress tag chips. Serves rankings and crawl |
| F6 | All three hero images are `loading="lazy"`; the hero is the LCP element | Home | Performance | **High** | Low | Make `Frame` accept a priority flag; eager-load the hero cluster with `fetchPriority="high"`. Serves rankings |
| F7 | `og-image.png` returns 404; every OG and Twitter card points at it | All pages with OG | On-page | **High** | Low | Add the file. Serves conversion via share CTR |
| F8 | Five content pages have no OG/Twitter tags and no schema | faq, contact, privacy, terms, refunds | On-page | Med | Low | Route them through `buildMetadata` and `buildGraph` like the home page. Serves rankings and share CTR |
| F9 | Five content-page titles carry no keyword, averaging 25 characters | Same five | On-page | Med | Low | Rewrite, e.g. `AI Headshot FAQ: Photos, Timing, Refunds \| Picturesk`. Serves rankings |
| F10 | One blog post; no clusters, no inter-post links, no links to the landing page | Blog | Content | Med | High | Publish a cluster around the six gaps listed in Phase 3, each linking to `/ai-headshot-generator`. Serves rankings and AI presence |
| F11 | `BlogPosting.author` missing; no author entity anywhere on the site | Blog | AEO / E-E-A-T | Med | Low | Publish posts from a logged-in admin account rather than the token path, and render the author box. Serves AI citation |
| F12 | No image on the site sets width/height; marketing images use raw `<img>` with no srcset | All image pages | Performance | Med | Med | Move marketing images to `next/image` or add explicit dimensions and srcset. Serves rankings |
| F13 | Zero outbound citations to any authority | All content | AEO | Med | Low | Cite sources where claims are checkable. Serves AI citation |
| F14 | Legal pages are the best-linked pages on the site (17 inbound each) while the landing page has none | Footer | Linking | Med | Low | Rebalance the footer; keep legal links but add a direct product link. Serves rankings |
| F15 | `/contact` TTFB measured at 1.64s against a sub-350ms baseline | Contact | Performance | Low | Low | Re-measure and profile. Serves rankings |
| F16 | Generic anchor text throughout; no internal link uses "AI headshot generator" | Whole site | Linking | Low | Low | Use descriptive anchors on the product link. Serves rankings |
| F17 | Mild cannibalisation between `/faq`, the home FAQ, and the blog post on "how many photos" | 3 pages | On-page | Low | Low | Let the post own it; have the other two link to it. Serves rankings |
| F18 | Blog pagination canonical behaviour untested (only one post exists) | Blog | Technical | Low | Low | Re-test once there are 16+ posts. Serves rankings |
| F19 | No `Organization.sameAs`; no social profiles declared in schema | Site-wide | AEO | Low | Low | Add profiles once they exist. Serves AI citation |
| F20 | Three funnel steps and `/success` render no H1 | Noindex pages | On-page | Low | Low | Cosmetic for SEO since noindex; fix for accessibility. Serves neither ranking nor conversion directly |

### Top 10 highest-leverage fixes

F1, F2, F3, F4, F5, F6, F7, F8, F9, F10 in that order. The first four are credibility or accuracy defects and outrank pure optimisations; F2, F6 and F7 are one-line changes with site-wide effect.
