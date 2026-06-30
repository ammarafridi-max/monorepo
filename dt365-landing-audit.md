# DT365 Landing Page Audit — SEO & GEO

**Scope:** 16 routes under `apps/dt365-frontend/src/app`, excluding `admin/`, `booking/`, `privacy-policy/`, `terms-and-conditions/`.
**Date:** 2026-06-30.
**Method:** Static read of route files, shared section components, and supporting infrastructure (`layout.js`, `sitemap.js`, `robots.js`, `src/lib/schema.js`).

## Shared infrastructure (cross-page constraints)

| Concern | Status |
|---|---|
| `layout.js` global `<title>` / description | `'Dummy Ticket 365'` / `'Dummy Ticket 365'` — uninformative. Acts as fallback only; every audited page overrides. |
| `metadataBase` | `https://www.dummyticket365.com` — set. Resolves relative OG images. |
| Favicon / OG fallback | `/favicon.png`, `/og-image.png` configured globally. |
| `viewport` | Configured. |
| `robots.js` | Allows `/`, disallows `/admin`, `/booking`, `/travel-insurance`, `/insurance-booking/*`. **`/travel-insurance` and `/insurance-booking/*` don't exist as routes in this app** — leftover/template, harmless but worth pruning. Sitemap correctly declared. |
| `sitemap.js` | All 16 in-scope routes plus dynamic blog post / tag entries, ISR via `revalidate = 3600`. **Includes `/terms-and-conditions` and `/privacy-policy` at low priority** despite those being excluded from this audit (intentional sitemap inclusion). |
| `src/lib/schema.js` | Wraps shared builders; sets siteUrl, org address (Dubai/AE), 24/7 contact point. Solid. |
| Heading hierarchy components | `Hero` → `<h1>`. `SectionTitle` → `<h2>`. `Process`/`Benefits` cards → `<h3>`. `FaqAccordion` → `<h3>`. `PageHero` → `PageTitle` → `<h1>`. |
| FAQ render cap | `<FAQ>` component slices to the first 6 items: `faqs?.slice(0, 6)`. Pages passing more than 6 to schema will produce a **render-vs-schema mismatch**. |
| hreflang | None set anywhere. Single-locale (en) site — acceptable for now, becomes a gap if regional variants launch. |
| Open Graph / Twitter | Generated consistently by `buildMetadata`; pages that bypass it (home, blog index, blog tags index) still hand-roll OG and Twitter correctly. |

## Page meta map

Title char counts include spaces. Google truncation thresholds: title ≈ 60, description ≈ 160.

| # | Route | Title | T-len | Desc-len | Meta method | Canonical | OG | Twitter |
|---|---|---|---:|---:|---|---|---|---|
| 1 | `/` | `Dummy Ticket for Onward Travel from USD 13 \| Instant & Verifiable` | **65 ⚠** | 158 | hardcoded `metadata` export | self | ✓ | ✓ |
| 2 | `/air-france-dummy-ticket` | `Book a Dummy Ticket on Air France from $13 \| Verifiable PNR` | 59 | 158 | `buildMetadata` | self | ✓ | ✓ |
| 3 | `/blog` | `Dummy Ticket & Visa Travel Blog \| Tips, Guides & Updates` | 56 | 133 | hardcoded `metadata` export | self | ✓ | ✓ |
| 4 | `/blog/[slug]` | dynamic (`blog.metaTitle \|\| blog.title`) | n/a | n/a | `generateMetadata` | dynamic, self | ✓ (article) | ✓ |
| 5 | `/blog/tags` | `Blog Tags \| Dummy Ticket 365` | 28 | 119 | hardcoded `metadata` export | self | ✓ | ✓ |
| 6 | `/blog/tags/[slug]` | dynamic (`tag.metaTitle \|\| \`${tag.name} \| Blog Tag \| Dummy Ticket 365\``) | n/a | n/a | `generateMetadata` | dynamic, self | ✓ | ✓ |
| 7 | `/dummy-ticket-australia-visa` | `Dummy Ticket for Australia Visa From $13 \| Verifiable PNR` | 57 | 110 | `buildMetadata` | self | ✓ | ✓ |
| 8 | `/dummy-ticket-canada-visa` | `Dummy Ticket for Canada Visa From $13 \| Verifiable PNR` | 54 | 109 | `buildMetadata` | self | ✓ | ✓ |
| 9 | `/dummy-ticket-japan-visa` | `Dummy Ticket for Japan Visa From $13 \| Verifiable PNR` | 53 | 106 | `buildMetadata` | self | ✓ | ✓ |
| 10 | `/dummy-ticket-schengen-visa` | `Dummy Ticket for Schengen Visa From $13 \| Verifiable PNR` | 56 | 143 | `buildMetadata` | self | ✓ | ✓ |
| 11 | `/dummy-ticket-uk-visa` | `Dummy Ticket for UK Visa From $13 \| Verifiable PNR` | 50 | 109 | `buildMetadata` | self | ✓ | ✓ |
| 12 | `/faq` | `Dummy Ticket FAQ \| Common Questions Answered \| Dummy Ticket 365` | 64 ⚠ | 132 | `buildMetadata` | self | ✓ | ✓ |
| 13 | `/flight-itinerary` | `Flight Itinerary From USD 13 \| Instant Delivery With PNR` | 56 | **77 ⚠** | `buildMetadata` | self | ✓ | ✓ |
| 14 | `/lufthansa-dummy-ticket` | `Book a Dummy Ticket on Lufthansa from $13 \| Verifiable PNR` | 58 | **162 ⚠** | `buildMetadata` | self | ✓ | ✓ |
| 15 | `/onward-ticket` | `Onward Ticket From USD 49 \| Instant, Genuine, & Affordable` | 58 | 144 | `buildMetadata` | self | ✓ | ✓ |
| 16 | `/turkish-airlines-dummy-ticket` | `Book a Dummy Ticket on Turkish Airlines from $13 \| Verifiable PNR` | **65 ⚠** | **168 ⚠** | `buildMetadata` | self | ✓ | ✓ |

**Truncation flags:** Home (65), Turkish (65), FAQ (64) titles will likely truncate in SERPs (≈60-char threshold). Turkish (168) and Lufthansa (162) descriptions exceed the 160-char limit. **Flight Itinerary (77)** is dangerously thin — wastes snippet real estate and offers no CTA.

## Primary keyword map

| # | Route | Primary keyword | In title | In H1 | In first para | In H2s | In URL slug |
|---|---|---|---|---|---|---|---|
| 1 | `/` | dummy ticket | ✓ start | ✓ start | ✓ | ✓ | n/a |
| 2 | `/air-france-dummy-ticket` | air france dummy ticket | ✓ middle | ✓ middle | ✓ | partial ("Air France") | ✓ |
| 7 | `/dummy-ticket-australia-visa` | dummy ticket for australia visa | ✓ start | ✓ start | ✓ | ✓ | ✓ |
| 8 | `/dummy-ticket-canada-visa` | dummy ticket for canada visa | ✓ start | ✓ start | ✓ | ✓ | ✓ |
| 9 | `/dummy-ticket-japan-visa` | dummy ticket for japan visa | ✓ start | ✓ start | ✓ | ✓ | ✓ |
| 10 | `/dummy-ticket-schengen-visa` | dummy ticket for schengen visa | ✓ start | ✓ start | ✓ | ✓ | ✓ |
| 11 | `/dummy-ticket-uk-visa` | dummy ticket for uk visa | ✓ start | ✓ start | ✓ | ✓ | ✓ |
| 12 | `/faq` | dummy ticket faq | ✓ start | partial (only "FAQ") | ✓ (subtitle) | ✗ | ✗ (slug is `/faq` not `/dummy-ticket-faq`) |
| 13 | `/flight-itinerary` | flight itinerary | ✓ start | ✓ start | ✓ | ✓ | ✓ |
| 14 | `/lufthansa-dummy-ticket` | lufthansa dummy ticket | ✓ middle | ✓ middle | ✓ | partial | ✓ |
| 15 | `/onward-ticket` | onward ticket | ✓ start | ✓ start | ✓ | partial | ✓ |
| 16 | `/turkish-airlines-dummy-ticket` | turkish airlines dummy ticket | ✓ middle | ✓ middle | ✓ | partial | ✓ |
| 3 | `/blog` | (informational hub) | "blog" in title | ✓ (h1 = "Blog") | ✓ | n/a | ✓ |
| 5 | `/blog/tags` | (utility) | "blog tags" | ✓ | ✓ | n/a | ✓ |
| 4 | `/blog/[slug]` | per-post | dynamic | dynamic | dynamic | dynamic | dynamic |
| 6 | `/blog/tags/[slug]` | per-tag | dynamic | dynamic (PageHero title = tag.name) | dynamic | n/a | dynamic |

No keyword stuffing on any page. Visa pages keep keywords tight in headings; airline pages put the airline name late in the title (`Book a Dummy Ticket on Lufthansa`) — works for branded queries but loses some weight vs. an "X Dummy Ticket | …" frontload.

## Per-page deep analysis

### 1. `/` — Home

- **Meta method:** Hand-rolled `metadata` export. Inconsistent with the rest of the site, which uses `buildMetadata`. Easy to drift.
- **First 100 words (Hero subtitle):** "Reserve your dummy flight ticket in minutes with us. Get a verifiable ticket with a valid PNR that works for visa applications, onward travel, and immigration checks…" — **positioning, not a direct answer**. No "Yes, X is …" sentence.
- **Quick-answer H2:** None. Page jumps from Hero → "Get Your Dummy Ticket in 3 Simple Steps" (Process), which is operational not informational.
- **Heading outline:** H1 (`Dummy Tickets for Visa, Onward Travel From $13`) → H2 ×6 ("Get Your Dummy Ticket in 3 Simple Steps", "About Us", "Why Choose DummyTicket365 for Reliable Flight Reservations?", "Testimonials", "Frequently Asked Questions", "Blog Posts") → H3s per Process step, Benefit, FAQ accordion. Clean hierarchy.
- **FAQ section:** 6 questions present. `<FAQ>` renders all 6 (no slicing loss). FAQPage schema includes all 6 — matches.
- **Schema:** `Organization`, `WebSite`, `WebPage`, `Service`, `FAQPage`. **Missing:** `BreadcrumbList` (acceptable for home), and the Process section has no `HowTo` schema (missed opportunity).
- **Internal links:** Footer/header links handled by `Providers`. Body content has no inline internal links to country/airline pages — **a major linking gap**. The home page should be the hub seeding visits to every visa and airline subpage.
- **External links:** None on page body.
- **Hedging/fluff:** "Thousands of customers rely on…", "trusted international travel services provider…" — generic trust language. Won't hurt rankings but won't help GEO either.
- **Narrative drift:** Testimonials and benefits say "PNR was fully verifiable on the airline website" and "checked directly on airline systems". Conflicts with the GDS-systems wording on the three airline subpages. Pick a story.
- **Canonical:** `https://www.dummyticket365.com` (no trailing slash). Consistent with sitemap.
- **Indexability:** `robots: { index: true, follow: true }`. Sitemap: ✓.
- **Intent match:** Mixed. Slug-less landing on `/` targets brand + generic "dummy ticket" — transactional intent satisfied by the booking form in Hero.

### 2. `/air-france-dummy-ticket`

- **First 100 words:** "Get a verifiable Air France flight reservation for your visa application without purchasing a non-refundable ticket. As France's flag carrier and a founding member of SkyTeam…" — leads with **value + credibility, no direct answer**.
- **Quick-answer H2:** None.
- **Heading outline:** H1 (`Book a Dummy Ticket on Air France from $13`) → H2 ("How to Book Your Air France Dummy Ticket", "About DummyTicket365 Services", "Why Travelers Choose Air France for Visa Itineraries", "Frequently Asked Questions", "Questions on your Air France dummy ticket?") → H3 per process step, service card, benefit, FAQ.
- **FAQ section:** 6 questions, all in schema, all rendered.
- **Schema:** Org, Website, WebPage, Service, Product (price $13 USD), FAQPage, BreadcrumbList. Complete.
- **Internal links:** None inline. **No cross-link to Schengen page** despite the page's whole premise being Schengen visa applications via CDG.
- **GDS-only wording:** Consistent throughout (`Verifiable PNR on GDS Systems` in pills, benefits, FAQs).
- **Trust signals:** Mentions "EU Visa Code permits flight reservations" — strong, factual, but no outbound link to the source.
- **Canonical / robots / sitemap:** ✓ / index,follow / present.

### 3. `/blog`

- **Meta method:** Hand-rolled.
- **First 100 words:** "Our blog covers everything you need to know about dummy tickets, including how they work, when to use them, and why they are commonly required for visa and immigration purposes." — descriptive, not answering a specific query.
- **Heading outline:** H1 ("Blog" — single word, generic) → blog card titles (per `BlogPage` component).
- **H1 is too generic.** "Dummy Ticket Blog" or "Visa & Travel Documentation Blog" would carry more SEO weight than the bare word "Blog".
- **Schema:** Org, Website, WebPage, `Blog`. **No `ItemList` for the post listing** — adding it helps Google understand the page is a curated list.
- **Pagination:** `searchParams.page` honored; no `rel=prev/next` (deprecated by Google but other engines still use). Each page returns the same canonical (`/blog`) — **page 2+ canonicalize to page 1**. Either set page-specific canonicals or accept the loss.
- **Internal links:** Blog cards link to post slugs. Tags link to `/blog/tags`. No links to product pages from the listing template.
- **Indexability:** index,follow. ISR `revalidate = 3600`.

### 4. `/blog/[slug]` — dynamic post template

- **Meta:** `generateMetadata` reads from API; falls back to `blog.title` and a generic description. On 404, sets `robots: { index:false, follow:false }`. Solid pattern.
- **Canonical:** `${SITE_URL}/blog/${blog.slug || slug}` — self-referencing.
- **OG type:** `article` ✓.
- **Schema:** Org, Website, WebPage, `BlogPosting` (with image, datePublished, dateModified, author), optionally `FAQPage` if the post has `faqs[]`. Strong template.
- **Author / dates:** Author and dates only render if the API returns them. The site has no editorial profile pages — if author E-E-A-T matters for blog rankings, that's a gap.
- **Static at runtime:** `generateStaticParams` pulls up to 1000 posts; new posts ISR via `revalidate = 300`.
- **What can't be resolved statically:** post body, meta length, anchor texts, image alts, FAQ content. Template strategy is sound; per-post quality is invisible from this audit.

### 5. `/blog/tags`

- **Meta method:** Hand-rolled.
- **First 100 words:** "Explore topics and read the latest published posts under each tag." — short, descriptive.
- **Heading outline:** H1 ("Blog Tags") → H2 per tag.
- **Schema:** Org, Website, WebPage. **No `CollectionPage` or `ItemList`**.
- **Canonical:** self.
- **Comment:** Utility page. Don't over-invest, but linking the tag with its post count would help users and crawlers.

### 6. `/blog/tags/[slug]` — dynamic tag template

- **Meta:** `generateMetadata` from `tag.metaTitle`/`tag.metaDescription` with sensible fallback.
- **Schema:** Org, Website, WebPage, `Blog`. Could be `CollectionPage` with `mainEntity = ItemList` of posts under that tag.
- **Pagination:** Same as `/blog` — canonical is page-1 regardless of pagination.

### 7. `/dummy-ticket-australia-visa`

- **First 100 words:** "Get a verifiable flight reservation for your Australian visa application without purchasing a non-refundable airline ticket. Ready to upload to your ImmiAccount, with a real PNR that the Department of Home Affairs can verify."
- **Quick-answer H2:** None, but the **first FAQ ("Does the Department of Home Affairs require a flight ticket for the Subclass 600?")** delivers a near-perfect "quick answer" structure. Promoting that to an H2 above the fold would unlock GEO performance.
- **Heading outline:** H1 → H2 ×5 (Process / About / Benefits / FAQs / Contact). Clean.
- **Schema:** Full set incl. BreadcrumbList.
- **Trust signals:** Cites "Genuine Temporary Entrant test", "Subclass 600", "Sponsored Family Stream" — credible domain knowledge. **No outbound links to Home Affairs / IRCC / official sources.**
- **Internal links:** None inline.

### 8. `/dummy-ticket-canada-visa`

- Mirror of Australia in structure and quality. References IRCC, TRV, Super Visa correctly. Calls out the Super Visa CAD 100K insurance requirement as a disclaimer — good for trust. No outbound to IRCC. No cross-links.

### 9. `/dummy-ticket-japan-visa`

- Mirror of Australia/Canada. References JAPAN eVISA portal, MFA guidance. Same gaps: no outbound citations, no cross-links.

### 10. `/dummy-ticket-schengen-visa`

- The "template" sibling. Generic 6 benefits (`Authentic Reservation Structure`, `Cost-Effective Starting at Just $13`, `Wide Acceptance`, `Flexible Support`, `Timely Delivery`, `Selectable Validity`) — much **less specific than the AUS/CAN/JPN pages**, which have country-specific Benefits.
- 5 FAQs (vs. 6 elsewhere) — one fewer chance to capture FAQ-rich snippets.
- Same hierarchy, full schema graph. Solid base but feels under-built compared to siblings.

### 11. `/dummy-ticket-uk-visa`

- Same generic benefits as Schengen. 5 FAQs. UK content is thinner than AUS/CAN/JPN — could use UKVI-specific signals (TLScontact references, biometrics fee, etc.).

### 12. `/faq`

- **First 100 words (Hero subtitle):** "Our FAQs section answers the most common questions about dummy tickets, including validity, usage, and verification…" — meta-description of itself, not an answer.
- **Heading outline:** H1 ("Frequently Asked Questions") → H3 per FAQ. **No H2s** — entire section under H1 with no intermediate structure. Skipped level.
- **Schema:** Org, Website, WebPage, FAQPage. **Missing BreadcrumbList** despite breadcrumb being rendered on-page.
- **FAQ source:** `faqArray` with template variables (`{keyword}`) interpolated via `formatFaqArray(faqArray, 'dummy ticket')`. Works but the `{keyword}` token shows up in some answers (e.g., "How can I verify my {keyword}?") — verify the template substitution covers every occurrence.
- **Canonical / index / sitemap:** ✓ / index,follow / present.
- **Slug:** `/faq` not `/dummy-ticket-faq` — keyword in URL slug missing. Low priority but a missed opportunity.

### 13. `/flight-itinerary`

- **First 100 words (Hero subtitle):** "Receive a real itinerary in standard booking format with a valid PNR and trip details delivered by email." — short, generic.
- **Quick-answer H2:** None.
- **Heading outline:** H1 → H2 ×3 (Process / Benefits / Contact). **No About section, no FAQ section.**
- **Schema:** Org, Website, WebPage, Service, Product, BreadcrumbList. **No FAQPage** (because no FAQs). Easy win: add a 5-6 FAQ section and FAQPage schema.
- **Meta description (77 chars):** "Get a real flight itinerary with a valid PNR issued in standard airline booking format." — **truncates short of useful CTA**. No price hook, no urgency.
- **Internal links:** None inline. **Doesn't link to `/onward-ticket` or any visa page**.
- **Cannibalization risk:** "Flight itinerary" and "dummy ticket" are search synonyms in this space. Page targets `flight itinerary` keyword but the user lands on a page with no About, no FAQ, no testimonials — thin compared to `/onward-ticket` and visa pages. Consider whether `/flight-itinerary` and `/onward-ticket` should target different intent or be merged.

### 14. `/lufthansa-dummy-ticket`

- **First 100 words:** "Get a verifiable Lufthansa flight reservation for your visa application without purchasing a non-refundable ticket. As Germany's flag carrier and a founding member of Star Alliance…"
- **Heading outline:** H1 → H2 ×5 (Process / About / Benefits / FAQs / Contact) → H3 cards. Clean.
- **Schema:** Full set.
- **Meta description (162 chars):** Just over the 160 limit. Trim 2-5 chars.
- **GDS-only wording:** Consistent (`Verifiable PNR on GDS`, `Verifiable PNR on GDS Systems` benefit).
- **Cross-links:** None to Schengen page (natural pairing), none to Air France or Turkish.

### 15. `/onward-ticket`

- **Title (`Onward Ticket From USD 49 …`) vs. description (`Starting from USD 13.`) vs. schema Product (`price: '13.00'`).** **Three-way price inconsistency.** Either onward tickets are $13 or $49. Pick one.
- **H1 typo:** `Book a Your Onward Ticket from USD 49.` — `Book a Your` is a typo (should be `Book Your`). Also has a trailing period, unusual in H1s.
- **Audience drift:** Onward tickets are typically for immigration / airline check-in. But the **Benefits #1** says "Accepted by VFS" — VFS handles **visa** applications, not airline check-in or immigration. Either the page is also positioning for visas (in which case it cannibalizes the visa pages and the home page) or the benefit copy is wrong.
- **Heading outline:** H1 → H2 ×6 (Process / About / Benefits / Testimonials / FAQs / Blog) → H3.
- **Schema:** Full set incl. FAQPage. FAQs from `formatFaqArray(faqArray, 'onward ticket')` — **the array has 10+ items, but the `<FAQ>` component renders only the first 6**. Schema includes all of them. Render-vs-schema mismatch.
- **Internal links:** No inline.

### 16. `/turkish-airlines-dummy-ticket`

- **Meta:** Title 65 chars (truncates). Description 168 chars (truncates).
- **First 100 words:** "Get a verifiable Turkish Airlines flight reservation for your visa application without purchasing a non-refundable ticket. With over 340 destinations across 130 countries…" — value + credibility.
- **Heading outline / schema / GDS wording:** Same quality bar as the other two airline pages.
- **Cross-links:** None.

## Cross-page findings

### Keyword cannibalization

| Pages | Risk | Notes |
|---|---|---|
| `/` vs `/onward-ticket` | **Moderate** | Both target the head term "dummy ticket" + onward travel. Home title literally says "Dummy Ticket for Onward Travel". Onward-ticket page covers same ground. Sharper differentiation needed: home = brand hub, `/onward-ticket` = transactional sub-page for immigration use case. |
| `/` vs `/flight-itinerary` | **Low-Moderate** | Both target broad "flight itinerary / dummy ticket from $13". Flight Itinerary page is thin enough that it currently won't out-rank home; if you build it up, cannibalization rises. |
| `/onward-ticket` vs `/flight-itinerary` | **Low** | Different keyword anchors (onward vs itinerary) but conceptually overlapping product. |
| Visa pages (5) | **None** | Each targets a unique country-visa intent. Good separation. |
| Airline pages (3) | **None** | Unique airline names. |
| Visa vs Airline pages | **None — but missed cross-link opportunity** (see linking gaps). |

### Internal linking gaps

- **Visa ↔ Airline:** Lufthansa serves Schengen — no link from `/lufthansa-dummy-ticket` to `/dummy-ticket-schengen-visa` or vice versa. Same for Air France (Schengen via CDG) and Turkish (Schengen, UK, US, Canada — all relevant).
- **Visa ↔ Visa:** No "browse other visa types" footer block. Schengen and the four country pages should cross-link.
- **Airline ↔ Airline:** No "browse other airline pages" block.
- **Home → subpages:** Home page body has no inline links to country or airline pages. Header/footer (in `Providers`) likely handles this but inline contextual links carry more weight than nav links.
- **`/flight-itinerary`:** No internal links at all. Effectively orphaned from on-page perspective.
- **`/faq` ← landing pages:** Each landing page's `<FAQ>` component has a "Read More FAQs" link to `/faq` (confirmed in source). Good. Reverse direction (`/faq → product pages`) doesn't exist.

### Meta consistency

- 8 of the 13 product/landing pages use the formula `… From $13 | Verifiable PNR` — consistent and on-brand.
- Home, Onward Ticket, Flight Itinerary, FAQ, and the blog set follow different formulas. Not a problem, but **the Home page should adopt `buildMetadata`** for consistency with the rest of the codebase.
- **No duplicate titles or descriptions** across the set — clean.

### Schema coverage matrix

| Page | Org | Website | WebPage | Service | Product | FAQPage | BreadcrumbList | Other |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `/` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | — |
| `/air-france-dummy-ticket` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/blog` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | breadcrumb only | `Blog` |
| `/blog/[slug]` | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ if faqs | breadcrumb only | `BlogPosting` |
| `/blog/tags` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | breadcrumb only | — |
| `/blog/tags/[slug]` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | breadcrumb only | `Blog` |
| `/dummy-ticket-australia-visa` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/dummy-ticket-canada-visa` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/dummy-ticket-japan-visa` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/dummy-ticket-schengen-visa` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/dummy-ticket-uk-visa` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/faq` | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | — |
| `/flight-itinerary` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | — |
| `/lufthansa-dummy-ticket` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/onward-ticket` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `/turkish-airlines-dummy-ticket` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |

**Gaps:**
- Home page is missing `Product` and `BreadcrumbList`. Adding `Product` would let Google show price-rich snippets on brand search.
- `/faq` is missing `BreadcrumbList` despite rendering a breadcrumb visually.
- `/flight-itinerary` is missing `FAQPage` (and has no FAQs to populate it — adding both is the easy win).
- Blog index pages don't expose `ItemList`/`CollectionPage` — useful for category understanding.
- **No `HowTo` schema** for any of the "How to Book in 3 Steps" Process sections. Every landing page has one and could rank for "how to book a dummy ticket for X" queries.

### GEO (generative-engine-optimization) — content signals

| Signal | Status | Notes |
|---|---|---|
| Direct answer in first 100 words | ✗ across the board | Every page opens with positioning ("Get a verifiable…", "Book Your…") rather than a verdict ("Yes, a dummy ticket is accepted for…"). AI Overviews prefer the verdict-first format. |
| Quick-answer H2 + 40-80 word answer | ✗ | None of the pages have a dedicated "What is a dummy ticket for X?" H2 with a tight 50-word paragraph. The visa pages bury that answer in FAQ #1 — perfect content, wrong position. |
| FAQ schema | ✓ on 12/16 | Strong AI Overview surface. |
| Vague headings | A few. "Blog" (H1 on `/blog`), "About Us", "Why Choose Us?" (`/flight-itinerary`). |
| Hedging language | Reasonable. "Typically", "generally", "depending on" — appropriate accuracy hedges. |
| AI-sounding filler | Home page about: "trusted international travel services provider offering verifiable flight reservations and essential travel documentation" — generic. Could be tightened. |
| Hard data / specific numbers | ✓ on country pages (processing times, fees, IATA codes, GTE references). Adds GEO authority. |
| Authority citations | ✗ — no outbound links to embassies, EU Visa Code, IRCC, Home Affairs, even though pages reference these sources by name. Inline citations would lift trust. |

### Intent & trust

- **Transactional intent** (the dominant intent for these terms): satisfied. Every product page has the booking form in Hero.
- **Informational intent**: partially served via FAQ sections.
- **E-E-A-T**: company address (Dubai), 24/7 contact point, and `Organization` schema are present site-wide via `lib/schema.js`. No author bios, no editorial process page, no security/compliance trust marks visible at the page level.
- **Claim sourcing**: Specific claims like "IRCC explicitly advises applicants not to finalize travel arrangements before receiving a visa" — accurate, but uncited. Linking the source URL once would materially lift perceived authority.

### Narrative drift (cross-page wording mismatch)

This is the most consequential cross-page issue:

| Page | Verification narrative |
|---|---|
| Home benefit #2 | "PNR that can be checked directly on airline systems" |
| Home testimonial | "PNR was fully verifiable on the airline website" |
| Onward Ticket subtitle | "issued through official airline systems" |
| Onward Ticket FAQ template (`faqArray`) | "verified on the airline's official website or reservation system" |
| Schengen / Australia / Canada / Japan / UK visa pages | "verifiable PNR through real systems / recognized GDS platforms" |
| Lufthansa / Turkish / Air France pages | "verifiable on GDS systems (Amadeus, Sabre, Travelport)" — explicit GDS-only |
| FAQ page (`faqArray`) | "checked online on the airline's official website" |

Three different stories: "airline website", "airline systems", "GDS systems". A user comparing pages can spot it; a journalist or skeptic definitely will. Pick the strictly accurate framing (GDS-only is the most defensible for non-paying reservations) and unify the wording across the site.

## Top 5 highest-leverage fixes

Ranked by impact × ease.

| # | Fix | Where | Impact | Effort |
|---|---|---|---|---|
| 1 | Resolve the "airline website" vs "GDS systems" narrative drift. Pick GDS-only and rewrite home benefit #2, home testimonial #1, `/onward-ticket` subtitle, and `faqArray` answers. | `/`, `/onward-ticket`, `/faq`, shared `faqArray` | High — credibility + consistency for SEO + GEO + AI overviews | Medium (touches shared data file) |
| 2 | Fix `/onward-ticket` three-way price inconsistency ($13 vs $49 vs schema). Fix "Book a Your" typo in H1. Decide audience (visa vs immigration) — Benefits currently say "Accepted by VFS" which contradicts an immigration-only positioning. | `/onward-ticket/page.js` | High — current page is internally contradictory | Low |
| 3 | Add a "Quick answer" H2 + 50-word paragraph above the fold on every visa and airline page (verdict-first). Promote each page's strongest FAQ to this position. Direct hit on AI Overview / featured-snippet selection. | All visa + airline pages (8) | High — unlocks AI surface | Medium (per-page copy) |
| 4 | Cross-link visa ↔ airline pages and visa ↔ visa pages with a "Related" / "Other visa pages" block at the bottom of each landing page. Same component, dropped in 8 pages. | All visa + airline pages | Medium-High — topical authority, crawl depth, internal PageRank flow | Low-Medium (one new shared component, then drop-in) |
| 5 | Fix `/flight-itinerary` meta description (77 chars, no CTA) + add a 5-6 FAQ block + FAQPage schema. Page is currently the weakest in the set and represents a head-term keyword. | `/flight-itinerary/page.js` | Medium-High — directly improves a weak page | Low |

### Honorable mentions (good cheap wins)

- Trim Lufthansa (162 → ≤160) and Turkish Airlines (168 → ≤160) descriptions; trim Turkish title (65 → ≤60).
- Adopt `buildMetadata` on the home page for consistency.
- Add `BreadcrumbList` schema to `/faq` and `/` (home).
- Add `HowTo` schema to every Process section — same step content already exists.
- Prune `/travel-insurance` and `/insurance-booking/*` from `robots.js` disallow list (no such routes).
- Add `ItemList`/`CollectionPage` schema to `/blog` and `/blog/tags`.
- Add outbound citations to authoritative sources (EU Visa Code, IRCC, Home Affairs, MFA Japan, UKVI) where pages already reference them by name.
- Rename `/blog` H1 from `Blog` to something keyword-bearing ("Dummy Ticket & Visa Travel Blog").
- Confirm `formatFaqArray` substitutes `{keyword}` in every question/answer — a leftover `{keyword}` would render literally on `/faq`.

## Footnotes

- All "render-vs-schema" FAQ mismatches refer to the `<FAQ>` component's hard `slice(0, 6)`. Pages currently passing >6 FAQs to schema: `/onward-ticket` (10+ via `faqArray`). Other pages all pass ≤6. Either lift the slice cap or trim the schema input.
- No `Date.now()` / build-time staleness issues observed; all `lastmod` flow through the sitemap's runtime `now`.
- This audit assumes header/footer navigation (in `Providers.js`) provides global navigation links to all top-level routes. Inline body-content linking is what's analyzed above.
