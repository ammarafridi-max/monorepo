# Travl SEO / AEO / GEO Audit

Date: 17 September 2026
Scope: www.travl.ae, all 83 URLs in the live sitemap plus redirect and error paths
Branch: `master` at `64cadad` (working tree has uncommitted edits in `apps/travl-frontend/src/config/partners.js` and `insurance-booking/payment/page.js`; neither changes any page audited here)

## Environment and instruments

| Item | Status |
|---|---|
| Live production domain | Reached. Every finding marked "live" was measured against https://www.travl.ae on 17 Sep 2026 with curl and a Node fetch script (HTML, headers, status codes, JSON-LD, links). |
| Local dev servers | Not started. Permission was not granted this turn, and production was reachable, so live checks ran against the deployed build (Fly, server header dated 2026-09-16), which matches `master`. |
| Real browser | No. The chrome-devtools MCP failed to connect (see Appendix A for why). Core Web Vitals, tap targets, layout shift and visual rendering were NOT measured and are not scored. |
| GSC export | Yes: Chart, Countries, Devices, Pages, Queries, Search appearance, Web search, last 3 months (roughly 15 Jun to 14 Sep 2026). |
| Database | Not touched. No DB checks were needed for this audit. |
| House facts (from you) | Travl sells travel insurance only. Plans from AED 30, price depends on region, dates and travellers. Visa assistance moved to VisaWadi. |
| Known symptom (from you) | Rankings fell after the visa blog was redirected to visawadi.com on 11 Aug 2026. Treated as a hypothesis and tested in Phase 1.5 and Phase 6. |

Not verified: the AED 30 / AED 245 / AED 70 / AED 49 figures shown on pages. Premiums come from the WIS supplier at quote time, not from the codebase, so I could not confirm them from source. They are taken as house facts.

The skill's `references/` folder is empty in this repo, so phases follow SKILL.md alone.

## Executive summary

The symptom is real and fully explained by the data. Of 45,911 impressions in the export, about 24,500 (53 percent) and 193 of 374 clicks (52 percent) sat on the 30 blog posts that now 308 to visawadi.com, plus another 2,873 impressions on the old `/visa/*` pages. Daily impressions went from 1,000 to 1,400 in the first half of August to 230 to 320 by mid September. That traffic was never Travl's insurance traffic; it left with the visa content, and the redirects are correctly built (single hop, all destinations return 200, moved posts removed from the sitemap).

What is left is a young insurance site with sound technical foundations and a real internal-linking problem. The money pages you care about rank badly: `/travel-insurance` sits at position 48 on 5,030 impressions, `/travel-insurance/schengen-visa` at 40, `/international` at 47, `/medical` at 51. Meanwhile the blog cannibalises them (the Bali post outranks the Indonesia product page), 24 of 44 posts still link to URLs that redirect off the domain, and 8 of the 12 country insurance pages get zero to three internal links.

There are also live bugs: `og-image.png` 404s on every page, `/login` and `/signup` are 404 but linked from every page, two renamed post slugs 404 with no redirect, and two contradictions an AI assistant will notice (two different office addresses; FAQ says refunds are possible after a visa refusal, the T&Cs say all payments are non-refundable).

### Scores

| Bucket | Weight | Score | Driven by |
|---|---|---|---|
| Technical SEO | 25% | 68 | Clean indexability, sitemap, canonicals, single-hop 308s, ISR caching. Held back by og:image 404 sitewide, 166 dead header links, two 404 slugs, two empty tag pages, no CWV measured. |
| On-page SEO | 20% | 62 | Money page titles and descriptions are good and price-led. Held back by 12 near-identical templated H1s, visa-era copy on /blog, /about, tag pages, em dashes in titles, the address contradiction. |
| Content and Blog | 20% | 58 | 44 posts, all with FAQ blocks and verdict-first openers of 46 to 87 words. Held back by six posts that duplicate money-page intent, 24 posts leaking links to redirects, 20 of 40 measured posts on 0 clicks, dateModified never updated. |
| AEO / GEO | 15% | 55 | FAQPage, Organization, Product and Service on every product page. Held back by contradictions, Product name polluted with the title string, no author entity (author URL 404s), unverifiable testimonials, `/about` at 167 words. |
| Internal linking | 10% | 45 | Nav pushes 8 plans from every page, but canada-visa and australia-visa have 0 inbound links, us-visa 1. Every blog post links out to Dummy Ticket 365 twice; 24 posts link to redirecting URLs. |
| Migration integrity | 10% | 60 | Redirect mechanics are right. Content and links on the surviving site were not cleaned up: blog title still says "Visa Travel Blog", tag pages still "Visa Tips" and "Dummy Ticket", `/about` still sells visa documentation. |
| **Overall** | | **60** | Weighted. |

Do not read 374 clicks in 3 months as failure. The domain's insurance content is 6 to 12 weeks old; the fundamentals are what is scored here.

### Top 10 highest-leverage fixes

1. Replace every internal link to `/visa`, `/visa/*` and the 30 moved slugs inside the 24 affected blog posts with links to Travl money pages (or, where visa assistance is genuinely the subject, a direct visawadi.com URL). Stops link equity leaving via 308s.
2. Add `public/og-image.png` (1200 x 630) so social previews stop 404ing on all 83 pages.
3. Remove the `/login` and `/signup` links from the shared header, or make the routes exist. 166 dead links sitewide.
4. Redirect the two renamed slugs (`flight-delay-whats-covered-…`, `pre-existing-conditions-and-travel-insurance-…`) to their live counterparts in `LEGACY_REDIRECTS`.
5. Fix the address contradiction: schema says Abraj Al Mamzar, contact page says Regus DAFZ. One address in `src/config/contact.js` feeding both.
6. Fix the refund contradiction: FAQ answer 14 vs T&Cs. Rewrite the FAQ answer to match the T&Cs (copy below).
7. Link the 12 country insurance pages from `/travel-insurance` and from a "Insurance by destination" block on `/travel-insurance/schengen-visa`. canada-visa and australia-visa currently have 0 inbound links.
8. Consolidate the cannibalising pairs: `/travel-insurance/annual` into `/annual-multi-trip`; the six blog posts that duplicate a product page get a canonical or a rewrite toward a distinct angle.
9. Rewrite the visa-era shells: `/blog` title and description, `/blog/tags` description, `/about`, the five visa-era tag pages (delete `dummy-ticket` and `flight-itinerary`, which are empty).
10. Give the Product schema a real name and description instead of the page title, and add `areaServed`, `category`, and `priceSpecification` with the "from" semantics.

## Phase 0: Stack and route inventory

Next.js App Router (`apps/travl-frontend`), Express backend at `api.travl.ae`, Fly.io hosting, ISR with `s-maxage=31536000` and 300 s stale time. Redirects live in `next.config.mjs` (there is no `src/proxy.js` despite the app CLAUDE.md saying so). Blog content comes from the backend at request time; sitemap revalidates hourly.

Live sitemap: 83 URLs. 31 static, 44 blog posts, 8 tag pages, 0 author pages (the authors API returned nothing usable; `/authors/ammar-afridi` 404s).

Routes outside the sitemap: `/insurance-booking/*` (disallowed in robots), `/itinerary-booking/*` (disallowed), `/admin`, `/authors/[slug]`.

## Phase 1: Technical SEO

| Check | Result | Status |
|---|---|---|
| Apex to www | `http://travl.ae` 301 to https, then 308 to www. Two hops for http traffic, one for https. | OK, minor |
| Trailing slash | `/travel-insurance/` 308 to no slash | OK |
| robots.txt | Allows all, disallows admin and booking steps, lists sitemap | OK |
| Sitemap | 83 URLs, no redirecting URLs, no 404s, `lastmod` on static pages is hand-maintained and stale (April dates on pages edited since) | Minor |
| Canonicals | Self-referencing on every page. Home canonical is `https://www.travl.ae` (no slash) while the sitemap lists `https://www.travl.ae/`. Google normalises this, but pick one. | Minor |
| Pagination | `/blog?page=2` self-canonical and indexable. `/blog/tags/x?page=2` canonicalises to page 1. Inconsistent; blog pagination is the better pattern. | Minor |
| noindex | 404 page and `/insurance-booking/quote`: the quote page is robots-disallowed but returns `index, follow` with title "Travl" and no canonical. If it ever gets a link, it can be indexed with no snippet. Add `noindex` to the booking segment layout. | Low |
| og:image | `https://www.travl.ae/og-image.png` returns 404. Every page except home references it (home has no og:image at all). `public/` has no such file. | **Live bug** |
| Dead internal links | `/login` and `/signup` are linked from the header on all 83 pages and both return 404. | **Live bug** |
| Renamed slugs without redirects | `/blog/flight-delay-whats-covered-when-your-flight-is-delayed` and `/blog/pre-existing-conditions-and-travel-insurance-what-uae-travellers-need-to-know` return 404. GSC still shows impressions for both. The live posts are `flight-delay-insurance-whats-covered-…` and `pre-existing-medical-conditions-…`. | **Live bug** |
| Structured data | Valid JSON-LD on every page; no parse errors. Graph pattern: Organization, WebSite, WebPage, Service, Product (offers), FAQPage on product pages; BlogPosting, FAQPage, BreadcrumbList on posts; CollectionPage on tags. `/about` and `/contact` carry no schema at all; legal pages only BreadcrumbList. | Good, gaps noted |
| Product schema quality | `name` and `serviceType` are the literal page title including "| From AED 30 | Travl". `/travel-insurance/annual` declares price 30.00 while `/annual-multi-trip` declares 245.00 for the same product. No `priceSpecification`, no `category`. GSC "Product snippets" appearance: 2,397 impressions, 8 clicks, position 35.6, CTR 0.33 percent. | Needs fixing |
| Performance (server side only) | TTFB 300 to 520 ms on cached pages, 1.0 to 1.6 s on tag pages (not cached, x-nextjs-cache MISS). Schengen page 22 KB gzipped HTML, 15 script tags. Fonts preloaded, Cloudinary preconnected. | Not fully verified (no browser) |
| Images | Every `img` has alt text. Home hero alts still say "Happy couple with their approved visas" and "with their flight reservations". Hero images use `sizes="210px"` but src falls back to w=3840; srcset handles it in modern browsers. | Minor |
| hreflang / lang | `lang="en"`, single language. Arabic queries appear in GSC (`تأمين سفر دبي` etc., 0 clicks) but no Arabic content exists. Out of scope for now. | OK |
| Headers | HSTS not observed in the response headers sampled. Worth confirming at the Fly edge. | Not verified |
| Cache | ISR hit on product pages. Tag pages miss every time; consider `revalidate` on `blog/tags/[slug]`. | Minor |

## Phase 1.5: Migration integrity (visa content to VisaWadi, 11 Aug 2026)

Redirect rules (from `next.config.mjs`) were tested live:

| Source pattern | Destination | Hops | Destination status |
|---|---|---|---|
| `/blog/<30 moved slugs>` | `https://www.visawadi.com/blog/<slug>` | 1 (308) | 200 (sampled 3) |
| `/visa` | `https://www.visawadi.com/uae` | 1 (308) | 200 |
| `/visa/:slug` | `https://www.visawadi.com/uae/visa/:slug` | 1 (308) | 200 (sampled 6 incl. canada, schengen, italy-visa, france-visa, united-kingdom, usa) |
| `/apply/*` | visawadi.com/apply | 1 | 200 |
| `/blog/tag/:slug` | `/blog/tags/:slug` | 1 | 200 |
| 7 legacy paths | live canonical | 1 | not individually re-tested |

Mechanics: correct. Every hop is a single permanent redirect and every sampled destination is live.

What the migration did NOT do, and what is still costing you:

| Gap | Evidence | Effect |
|---|---|---|
| Internal links not rewritten | 24 of 44 surviving posts still link to `/visa`, `/visa/schengen`, `/visa/usa`, `/visa/united-kingdom` or one of the moved slugs. `/visa/schengen` alone has 10 inbound links. | Each is a crawl that ends off-domain; equity flows to VisaWadi instead of a Travl plan page. Also confusing for users who click "Schengen visa" expecting Travl. |
| Blog shell still visa-branded | `/blog` title "Travel Insurance & Visa Travel Blog", description "practical visa travel guides"; `/blog/tags` description "visas, travel insurance, flight reservations". | Tells Google and users the blog is about visas. |
| Tag taxonomy | Tags live: Visa Tips (12 posts), Visa Documents (17), Schengen Visa (17), Dummy Ticket (0), Flight Itinerary (0), Europe Travel, UAE Travel, Travel Insurance. The automation excludes the four visa-era tags for new posts, but old posts and the empty pages are still indexed. | Two thin, empty indexable pages; three tag hubs whose names no longer describe the site. |
| `/about` copy | "helping UAE residents put together the paperwork they need for visa applications since 2018", title "Travel Documentation & Insurance". | Contradicts the split. |
| No replacement for lost demand | 53 percent of impressions were visa queries. No new insurance content was aimed at the queries that remain (see Phase 6). | The chart shows the drop; nothing was built to fill it. |
| Trailing GSC noise | `/visa/canada` 1,514 impressions, `/visa/italy-visa` 474, still reported in the window. | Will fade; nothing to do. |

Migration integrity score: 60. The plumbing is right; the site around it was not updated.

## Phase 2: On-page SEO (one row per non-blog page)

Legend: T = title length, D = description length, W = visible words, GSC = clicks / impressions / position for the 3-month window, "-" = not in export.

| Page | T | D | W | H1 | GSC | Issues |
|---|---|---|---|---|---|---|
| `/` | 46 | 162 | 1180 | Travel Insurance, Issued by AXA and Delivered in Minutes | 31 / 1275 / 11.0 | No og:image. Title leads with "AXA": ranks 6 to 8 for "axa travel insurance uae/dubai" (514 impressions) with 1 click, because searchers want AXA's own site. Consider "Travel Insurance for UAE Residents from AED 30, Issued by AXA". Hero image alts are visa-era. |
| `/travel-insurance` | 60 | 112 | 958 | Travel Insurance for UAE Residents | 23 / 5030 / 48.0 | The most-seen money page and the worst-ranked. Description is short and has no price. Links only 7 of the 20 child plans. Needs a destination block linking all 12 country pages and Indonesia. |
| `/travel-itinerary` | 56 | 172 | 1008 | Embassy-Ready Travel Itineraries for Your Visa | 9 / 686 / 10.7 | Fine. Second product; keep. |
| `/travel-insurance/schengen-visa` | 56 | 157 | 1041 | Schengen Travel Insurance for UAE Residents from AED 30 | 3 / 593 / 40.0 | Product name = title. "Hotel Reservations" and "Flight Itinerary" listed under "Our Services" but both are Dummy Ticket 365 products; move to a clearly labelled partner block. Em dashes in benefits copy. |
| `/travel-insurance/france-visa` | 54 | 189 | 1245 | France Visa Travel Insurance for UAE Residents from AED 30 | 1 / 74 / 15.2 | Template H1. Description is identical to the other Schengen countries with the country swapped. |
| `/travel-insurance/spain-visa` | 53 | 194 | 1189 | Spain Visa … from AED 30 | 2 / 102 / 13.4 | Same |
| `/travel-insurance/italy-visa` | 53 | 187 | 1149 | Italy Visa … from AED 30 | 4 / 151 / 11.0 | Same. "italy visa for uae residents" 27 imp at 48; the page is insurance, searcher wants a visa. |
| `/travel-insurance/germany-visa` | 55 | 191 | 1161 | Germany Visa … | 0 / 75 / 9.0 | Same |
| `/travel-insurance/greece-visa` | 54 | 189 | 1126 | Greece Visa … | 1 / 192 / 17.5 | Same |
| `/travel-insurance/switzerland-visa` | 59 | 199 | 1159 | Switzerland Visa … | 2 / 77 / 21.8 | Same |
| `/travel-insurance/netherlands-visa` | 59 | 199 | 1175 | Netherlands Visa … | 2 / 72 / 12.2 | Same |
| `/travel-insurance/austria-visa` | 55 | 191 | 1180 | Austria Visa … | 1 / 38 / 32.7 | Same |
| `/travel-insurance/uk-visa` | 50 | 171 | 1193 | UK Visa Travel Insurance … | 1 / 133 / 35.5 | Two blog posts compete with it (see Phase 3). |
| `/travel-insurance/us-visa` | 50 | 149 | 1218 | US Visa Travel Insurance … | 0 / 18 / 11.9 | 1 inbound link |
| `/travel-insurance/canada-visa` | 54 | 176 | 1168 | Canada Visa Travel Insurance … | 2 / 53 / 17.3 | **0 inbound links.** "canada visit visa from abu dhabi" family: 187 + 127 + 95 + 87 + 84 + 83 impressions, all position 47 to 60, 0 clicks. Searchers want the visa; VisaWadi should own this, the insurance page can only pick up "canada visa travel insurance" (13 imp). |
| `/travel-insurance/australia-visa` | 57 | 174 | 1155 | Australia Visa … | 0 / 53 / 13.3 | **0 inbound links.** |
| `/travel-insurance/medical` | 50 | 152 | 1008 | Travel Medical Insurance for UAE Residents | 1 / 762 / 51.3 | 762 impressions at 51. No Product schema, no price in title or description. |
| `/travel-insurance/annual-multi-trip` | 59 | 152 | 1047 | Annual Multi-Trip Travel Insurance for UAE Residents | 15 / 2023 / 25.5 | Second-best money page. Cannibalised by `/travel-insurance/annual`. |
| `/travel-insurance/international` | 56 | 157 | 991 | International Travel Insurance for UAE Residents | 3 / 1186 / 46.9 | Cannibalised by the 12 Sep post. |
| `/travel-insurance/single-trip` | 54 | 154 | 1023 | Single Trip Travel Insurance for UAE Residents | 4 / 764 / 23.0 | No Product schema, no price anywhere in title/description. "single trip travel insurance" 297 imp at 23.6, 0 clicks. |
| `/travel-insurance/indonesia` | 63 | 174 | 1247 | Travel Insurance for Bali and Indonesia … | 3 / 102 / 22.2 | Outranked by its own blog post (14 clicks, pos 18.9). |
| `/travel-insurance/family` | 57 | 194 | 1289 | Family Travel Insurance for UAE Residents from AED 30 | 0 / 281 / 22.3 | "family travel insurance" 168 imp at 41.8. |
| `/travel-insurance/annual` | 49 | 184 | 1275 | Annual Travel Insurance for UAE Residents | 0 / 105 / 41.4 | Duplicate of annual-multi-trip. Product price 30.00 contradicts AED 245. Consolidate. |
| `/blog` | 68 | 139 | 1219 | Blog | 0 / 48 / 20.8 | Visa-era title and description. H1 "Blog" says nothing. |
| `/blog/tags` | 17 | 118 | 291 | Blog Tags | - | Description mentions flight reservations. Consider noindex. |
| `/faq` | 56 | 139 | 462 | Frequently Asked Questions | 0 / 1 / 8 | 14 FAQs, FAQPage schema. Answer 14 contradicts T&Cs. |
| `/about` | 68 | 143 | 167 | About Travl | - | Em dash in title. Visa-era copy. 167 words. No Organization schema. The page an AI model reads to decide who you are. |
| `/contact` | 57 | 156 | 140 | Contact Us | 8 / 171 / 13.2 | Em dash in title. Address "Regus, DAFZ" vs schema "Abraj Al Mamzar, Al Mamzar". No schema. |
| `/claims` | 37 | 141 | 662 | Make a Claim | 1 / 36 / 14.6 | Em dash in title. Good page otherwise. |
| `/terms-and-conditions` | 30 | 123 | 512 | Terms & Conditions | 0 / 32 / 4.8 | Fine |
| `/privacy-policy` | 22 | 108 | 525 | Privacy Policy | 0 / 23 / 16.6 | Fine |
| `/blog/tags/visa-tips` | 39 | 125 | 906 | Visa Tips | - | Visa-era hub, 12 posts. |
| `/blog/tags/europe-travel` | 38 | 117 | 1133 | Europe Travel | 0 / 5 / 18 | Description has an em dash. |
| `/blog/tags/flight-itinerary` | 38 | 125 | 118 | Flight Itinerary | - | **Empty, indexable, in sitemap.** Description promises "get one instantly from Travl", which Travl does not sell. |
| `/blog/tags/visa-documents` | 39 | 125 | 1221 | Visa Documents | - | Visa-era hub, 17 posts. |
| `/blog/tags/uae-travel` | 31 | 111 | 1209 | UAE Travel | 0 / 11 / 7.6 | OK |
| `/blog/tags/dummy-ticket` | 28 | 126 | 120 | Dummy Ticket | 0 / 6 / 4 | **Empty, indexable, in sitemap.** |
| `/blog/tags/travel-insurance` | 41 | 139 | 1215 | Travel Insurance | 0 / 7 / 8.1 | The one hub that matches the site. Description has an em dash. |
| `/blog/tags/schengen-visa` | 29 | 129 | 1225 | Schengen Visa | 0 / 15 / 12.1 | Description promises "dummy tickets, and embassy tips". |

Pattern findings:

- 12 country pages share one H1 template and one description template. Google treats them as near-duplicates and they rank as a cluster in the teens to 30s. Each needs one country-specific fact block (consulate/VFS name, typical processing note, which region tier applies, EUR 30,000 requirement in that consulate's words) and a country-specific H1 variant.
- Titles use "|" and prices consistently on the Schengen set but `/medical`, `/single-trip`, `/international`, `/annual` have no price in the title. The price is your strongest differentiator in a SERP full of AXA, RSA and comparison sites.
- Em dashes appear in titles (`/about`, `/contact`, `/claims`), tag descriptions and benefits copy on product pages, against house style.

## Phase 3: Content and blog audit

44 posts live. All have a BlogPosting and a 5-question FAQPage (one has 7, one has 4), an opening paragraph of 46 to 87 words, 8 to 14 H2s and 1,500 to 3,000 words. Structure is consistent and GEO-shaped. The problems are topical, not structural.

Columns: Words, H2s, FAQ count, Q = title is a question, Echo = an H2 restates the title question, Open = words in the first paragraph, In = inbound links from sitemap pages, Leak = links to a redirecting URL, GSC = clicks / impressions / position.

| Slug | Published | Words | H2 | FAQ | Q | Echo | Open | In | Leak | GSC |
|---|---|---|---|---|---|---|---|---|---|---|
| travel-insurance-uae-expats-cover | 2026-09-17 | 2967 | 13 | 5 | n | n | 76 | 47 | | new |
| travel-insurance-europe-schengen-and-beyond | 2026-09-16 | 2871 | 13 | 5 | n | n | 79 | 47 | | new |
| travel-insurance-covid-cover-2026 | 2026-09-15 | 1508 | 8 | 4 | y | n | 74 | 47 | | new |
| annual-multi-trip-insurance-worth-it-uae | 2026-09-14 | 2836 | 14 | 5 | y | y | 78 | 8 | | new |
| buy-travel-insurance-online-uae | 2026-09-13 | 2447 | 14 | 5 | n | n | 79 | 4 | | 0 / 1 / 3 |
| international-travel-insurance-worldwide-coverage | 2026-09-12 | 2637 | 13 | 5 | n | y | 78 | 4 | | 0 / 2 / 11 |
| gcc-residents-travelling-abroad-insurance-considerations | 2026-08-28 | 2022 | 11 | 5 | n | n | 70 | 5 | LEAK | 4 / 172 / 14.2 |
| travel-insurance-for-british-expats-in-the-uae | 2026-08-27 | 2050 | 10 | 5 | n | n | 72 | 6 | LEAK | 0 / 59 / 14.8 |
| travel-insurance-for-filipino-residents-of-the-uae | 2026-08-26 | 1935 | 11 | 5 | n | n | 69 | 6 | LEAK | 0 / 27 / 11.9 |
| travel-insurance-for-pakistani-passport-holders-in-the-uae | 2026-08-25 | 2044 | 9 | 5 | n | n | 72 | 6 | LEAK | 0 / 11 / 12.2 |
| travel-insurance-for-indian-passport-holders-living-in-the-uae | 2026-08-24 | 2000 | 10 | 5 | n | n | 73 | 6 | LEAK | 0 / 19 / 29.1 |
| back-to-school-season-student-travel-insurance-for-uae-families | 2026-08-23 | 2186 | 10 | 5 | n | n | 76 | 5 | LEAK | 0 / 51 / 10.5 |
| travel-insurance-for-uae-residents-over-70-coverage-limits-and-exclusions | 2026-08-22 | 2266 | 10 | 5 | n | n | 64 | 4 | LEAK | 0 / 18 / 8.9 |
| business-travel-insurance-what-uae-professionals-should-know | 2026-08-18 | 2180 | 11 | 5 | n | y | 70 | 5 | LEAK | 0 / 113 / 20.7 |
| adventure-sports-travel-insurance-skiing-diving-and-hiking-cover | 2026-08-17 | 2275 | 12 | 5 | n | y | 67 | 7 | | 1 / 255 / 28.5 |
| medical-evacuation-and-repatriation-cover-what-it-means-in-practice | 2026-08-16 | 1648 | 10 | 5 | n | n | 83 | 2 | LEAK | 0 / 137 / 31.6 |
| travel-insurance-for-students-studying-abroad-from-the-uae | 2026-08-15 | 2162 | 11 | 5 | n | y | 66 | 5 | LEAK | 3 / 68 / 5.9 |
| family-travel-insurance-covering-kids-on-your-trip | 2026-08-14 | 2015 | 9 | 5 | n | y | 74 | 1 | LEAK | 0 / 72 / 27.5 |
| travel-insurance-for-seniors-from-the-uae-coverage-over-60-65-and-70 | 2026-08-13 | 2124 | 10 | 5 | n | y | 64 | 1 | LEAK | 1 / 206 / 11.0 |
| pre-existing-medical-conditions-and-travel-insurance-what-uae-travellers-need-to-know | 2026-08-12 | 2193 | 12 | 5 | n | y | 71 | 3 | LEAK | 1 / 131 / 8.5 |
| travel-insurance-claims-how-to-file-and-what-to-expect | 2026-08-11 | 2249 | 11 | 5 | n | y | 72 | 7 | | 0 / 356 / 21.9 |
| travel-medical-insurance-explained-whats-covered-and-whats-not | 2026-08-10 | 2117 | 11 | 5 | n | y | 72 | 0 | LEAK | 0 / 125 / 26.5 |
| single-trip-vs-annual-travel-insurance-which-one-should-you-buy | 2026-08-09 | 1988 | 11 | 5 | y | y | 75 | 4 | LEAK | 0 / 90 / 36.6 |
| how-much-does-travel-insurance-cost-in-the-uae | 2026-08-08 | 1693 | 9 | 5 | y | y | 62 | 5 | LEAK | 6 / 672 / 10.4 |
| what-does-travel-insurance-cover-a-clear-guide-for-uae-residents | 2026-08-07 | 2016 | 11 | 5 | y | y | 72 | 1 | LEAK | 0 / 46 / 57.0 |
| travel-insurance-exclusions-the-fine-print-that-matters | 2026-08-05 | 2072 | 11 | 5 | n | y | 78 | 6 | LEAK | 0 / 52 / 12.1 |
| travel-insurance-for-medical-tourism-from-the-uae | 2026-08-03 | 2060 | 11 | 5 | n | y | 73 | 1 | LEAK | 0 / 128 / 62.3 |
| travel-insurance-for-digital-nomads-based-in-the-uae | 2026-08-01 | 2076 | 11 | 5 | n | n | 71 | 1 | LEAK | 1 / 70 / 8.7 |
| travel-insurance-for-working-holidays-from-the-uae | 2026-07-31 | 2090 | 10 | 5 | n | n | 81 | 2 | LEAK | 1 / 22 / 4.6 |
| uk-visa-travel-insurance-is-it-required-and-what-to-buy | 2026-07-29 | 2274 | 10 | 5 | n | n | 49 | 2 | | 3 / 498 / 20.6 |
| winter-travel-insurance-what-to-look-for-before-a-ski-trip | 2026-07-14 | 2006 | 10 | 5 | n | n | 66 | 1 | | 1 / 149 / 15.7 |
| summer-travel-from-the-uae-insurance-and-visa-checklist-for-2026 | 2026-07-09 | 2209 | 11 | 5 | n | y | 77 | 2 | | 0 / 65 / 7.1 |
| travel-insurance-for-turkey-from-the-uae | 2026-07-07 | 1961 | 10 | 5 | n | y | 66 | 1 | | 5 / 303 / 8.5 |
| travel-insurance-for-bali-and-indonesia-a-uae-travellers-guide | 2026-07-06 | 2026 | 12 | 5 | n | y | 72 | 0 | | 14 / 799 / 18.9 |
| travel-insurance-for-maldives-honeymoons-and-family-trips | 2026-07-05 | 2008 | 10 | 5 | n | y | 75 | 0 | | 3 / 145 / 7.7 |
| travel-insurance-for-thailand-from-the-uae | 2026-07-04 | 1949 | 10 | 5 | n | y | 69 | 0 | | 3 / 295 / 5.5 |
| travel-insurance-for-the-usa-why-coverage-limits-matter | 2026-07-02 | 2084 | 10 | 5 | n | n | 87 | 2 | | 2 / 97 / 9.6 |
| travel-insurance-for-the-uk-what-uae-residents-need | 2026-07-01 | 2297 | 11 | 5 | n | y | 79 | 4 | | 6 / 367 / 21.0 |
| flight-delay-insurance-whats-covered-when-your-flight-is-delayed | 2026-06-29 | 1687 | 9 | 5 | n | n | 76 | 2 | | 3 / 397 / 8.4 |
| lost-baggage-insurance-how-claims-work-for-uae-travellers | 2026-06-28 | 1632 | 9 | 5 | n | y | 77 | 2 | | 3 / 176 / 7.7 |
| trip-cancellation-insurance-when-and-why-you-need-it | 2026-06-27 | 1679 | 9 | 5 | n | y | 65 | 2 | | 1 / 81 / 6.5 |
| travel-insurance-for-pregnant-travellers-what-to-look-for | 2026-06-26 | 2265 | 11 | 5 | n | n | 80 | 0 | | 2 / 200 / 10.2 |
| schengen-visa-travel-insurance-requirements-minimum-coverage-explained | 2026-04-29 | 1839 | 11 | 5 | n | n | 48 | 6 | LEAK | 0 / 279 / 57.5 |
| why-travel-insurance-is-mandatory-for-a-schengen-visa-and-what-coverage-you-need | 2026-04-16 | 1828 | 9 | 7 | n | n | 46 | 2 | | 0 / 564 / 37.3 |

### Collection-level findings

**Cannibalisation with money pages.** These post/page pairs target the same query and the post usually wins the crawl budget because it is longer and newer:

| Blog post | Competes with | Evidence |
|---|---|---|
| travel-insurance-for-bali-and-indonesia… | `/travel-insurance/indonesia` | Post 14 clicks at 18.9; product page 3 clicks at 22.2 |
| international-travel-insurance-worldwide-coverage (12 Sep) | `/travel-insurance/international` | Product page at 46.9 on 1,186 impressions; the post is 5 days old and aimed at the exact head term |
| annual-multi-trip-insurance-worth-it-uae (14 Sep) | `/annual-multi-trip` and `/annual` | Three URLs for one product |
| buy-travel-insurance-online-uae (13 Sep) | `/travel-insurance` | "buy travel insurance online" 260 imp at 21.4, the product page should own this |
| travel-medical-insurance-explained… | `/travel-insurance/medical` | Product page at 51 |
| family-travel-insurance-covering-kids… | `/travel-insurance/family` | |
| travel-insurance-for-the-uk… and uk-visa-travel-insurance-is-it-required… | `/travel-insurance/uk-visa` | Two posts, one product, three URLs for "uk visa travel insurance" (product page at 35.5) |
| schengen-visa-travel-insurance-requirements…, why-travel-insurance-is-mandatory-for-a-schengen-visa…, travel-insurance-europe-schengen-and-beyond | `/travel-insurance/schengen-visa` | Four URLs for "schengen travel insurance"; product at 40, posts at 37 and 57 |

Fix pattern: keep the post if it has a distinct angle (Bali post is a destination guide, fine), but make every post link the product page in the first 150 words with the exact head term as anchor, and remove head-term repetition from the post title. For the 12 Sep and 13 Sep posts, which are pure head-term duplicates, either fold the unique content into the product page and 308 the post, or retitle toward a long-tail angle ("Which region tier do you need for a worldwide trip?").

**Link leakage.** 24 of 44 posts link to `/visa`, `/visa/schengen`, `/visa/usa`, `/visa/united-kingdom` or a moved slug. Every one is a 308 to VisaWadi. The automation config now blocks `travl.ae/visa` in new posts, so this is a backlog problem in the Aug 1 to Aug 28 posts and the two April posts. The two April posts also carry the highest visa-term impressions.

**Partner links on every post.** The sticky rail and the inline offer both link to dummyticket365.com on all 44 posts (88 outbound links), and some posts link visawadi.com in the body. That is a deliberate choice, but it means the strongest CTA slot on an insurance post sends the reader to a different brand. On insurance-only posts the inline offer should be the insurance CTA and Dummy Ticket 365 should appear only on visa-adjacent posts.

**Freshness.** `dateModified` equals `datePublished` on every post. Nothing has been updated since publication. The two April posts and the "2026" posts will look stale to both Google and LLMs by Q1 2027.

**Cadence.** One post per day since 10 Sep, with 34 more scheduled through 20 Oct. Several upcoming slugs repeat money-page intent again (`travel-insurance-regions-explained`, `how-much-medical-cover-usa-uk-schengen`, `schengen-multiple-entry-visa-insurance`). Check the queue against the product pages before it runs.

**Zero-click posts.** 20 of the 40 posts with GSC data have 0 clicks. Eight of them are the persona posts (British, Filipino, Pakistani, Indian, over 70, students, business, digital nomads) with 11 to 113 impressions each. They are not wrong; they are long-tail and young. Leave them, fix their links, and judge them in December.

## Phase 4: AEO / GEO readiness

What is in place: FAQPage on every product page and post (269 questions sitewide), Organization with address and contact, WebSite, Service, Product with Offer, BlogPosting with author Person and dates, BreadcrumbList. Answers are concrete (EUR 30,000, AED 30, AXA, VFS/BLS). An assistant can extract "who, what, how much, how fast" from any product page.

What blocks citation or trust:

| Issue | Where | Why it matters |
|---|---|---|
| Address contradiction | Organization schema (all pages): Abraj Al Mamzar, Al Mamzar. `/contact` and footer: Regus, DAFZ. | Two addresses for one company is the kind of inconsistency LLMs weight against a source. Google Business Profile should match whichever is right. |
| Refund contradiction | `/faq` Q14 "Some plans offer refunds after visa rejection". `/terms-and-conditions`: "All payments are non-refundable except in cases of system failure". | An assistant asked "does Travl refund if my visa is refused?" can quote either. |
| "Since 2018" and "visa documentation" | `/about`, meta description | Contradicts the site's own product line and the redirect to VisaWadi. |
| Product schema name pollution | 17 product pages: `name: "Travel Insurance for Schengen Visa | From AED 30 | Travl"` | Machines read "| Travl" as part of the product name. Use a clean product name and put price in `offers`. |
| Product price conflicts | `/travel-insurance/annual` says 30.00, `/annual-multi-trip` says 245.00, home page says "from AED 30" for everything. | Pick the "from" price per product and mark it with `priceSpecification.minPrice`. |
| Author entity missing | BlogPosting author is `Person: Ammar Afridi` with no `url`, no `sameAs`; `/authors/ammar-afridi` is 404. | No E-E-A-T anchor. A short author page with role, licence context and sameAs links is the cheapest trust signal available. |
| Testimonials without provenance | Named 5-star quotes on home and every product page ("Ahmed K., Dubai") with no source, date or review platform. `trustpilot.webp` exists in `public/` but no Trustpilot profile is linked. | If these are real, link the platform and add AggregateRating from it. If they are not, remove them; a model that notices fabricated reviews discounts everything else. Do not add Review schema unless the reviews are real and verifiable. |
| `/about` depth | 167 words, no schema, no team, no licence or regulator mention, no insurer relationship explained. | This is the page assistants use to decide whether Travl is a broker, an agent, or an aggregator. Say exactly what Travl is: a Dubai-registered travel agency distributing AXA-underwritten policies, with the licence number if you can publish it. |
| Money pages cite nothing | 0 outbound links to EU, VFS, gov.uk or AXA policy wording on product pages. Blog posts do cite home-affairs.ec.europa.eu, gov.uk, who.int. | One link to the EU Visa Code insurance article and one to the AXA policy wording PDF on each product page raises citation confidence. |
| Arabic demand, no Arabic | Roughly 15 Arabic queries in the export (تأمين سفر, شنغن تأمين السفر الإمارات) at positions 34 to 61. | Not a priority now; note for later. |

## Phase 5: Internal linking and equity flow

Measured from the 83 sitemap pages only (nav and footer included).

| Target | Inbound | Note |
|---|---|---|
| `/`, `/travel-insurance`, `/travel-itinerary`, 6 plan pages, `/contact`, `/about`, `/blog`, `/claims`, legal | 83 | Global nav and footer. Good. |
| `/login`, `/signup` | 83 | **Both 404.** |
| `/travel-insurance/france-visa` | 18 | Country cluster links itself in a ring |
| germany 17, spain 16, italy 15, greece 14 | | Same ring plus blog CTAs |
| switzerland, netherlands, austria | 7 | Ring only |
| `/travel-insurance/uk-visa` | 3 | |
| `/travel-insurance/indonesia` | 2 | |
| `/travel-insurance/us-visa` | 1 | |
| `/travel-insurance/canada-visa` | 0 | Orphan except sitemap |
| `/travel-insurance/australia-visa` | 0 | Orphan except sitemap |
| `/faq` | 17 | |
| `/visa/schengen` (308 out) | 10 | Leak |
| `/visa` (308 out) | 6 | Leak |
| 30 moved slugs (308 out) | 1 to 9 each | Leak; `why-buying-a-real-ticket…` has 9 |
| Tag pages | 11 to 46 | Tag chips on every post; the visa-era tags collect more equity than any country product page |

Findings:

- The nav gives the 8 core plans 83 links each, then the 12 country pages fight over scraps. `/travel-insurance` itself links only 7 children. Add a "Insurance by destination" grid on `/travel-insurance` and on the Schengen page listing all 12 country pages plus Indonesia; add a "Related plans" block on each country page that links the non-Schengen destinations too, not just the Schengen ring.
- 166 dead links to `/login` and `/signup` from the header (frontend-shared header rendering auth links the app does not implement).
- Blog to product: the sticky rail resolves the product page from slug tokens (good), but 24 posts also carry body links to redirecting URLs. Rewrite those to the product page or to a Travl post.
- Blog to blog: newest posts get 47 inbound (home and blog index feature them), older ones 0 to 7. Fine for a chronological blog, but the two April Schengen posts, which carry the most impressions, get 2 and 6.
- Tag pages absorb more inbound equity than any product page beyond the core 8. Two are empty. Reduce tag chips to two per post, noindex tag pages with fewer than 5 posts, and delete the two empty ones.

## Phase 6: GSC-informed opportunities

Window: 15 Jun to 14 Sep 2026. Totals: 374 clicks, 45,911 impressions, CTR 0.81 percent, average position 20.9. UAE is 75 percent of clicks. Mobile 52 percent of clicks with CTR 1.13 percent vs desktop 0.62 percent; desktop average position is 26 vs mobile 12.8, which usually means desktop impressions are dominated by deep-page-2 results for generic terms.

**What the redirect removed.** Moved posts and `/visa/*`: about 27,400 impressions and 193 clicks. The remaining insurance surface: about 18,500 impressions and 181 clicks. Before/after in the daily chart: 4 to 13 clicks per day in late July and early August, 1 to 5 per day in September. This matches your symptom exactly and it is not a penalty; it is the content leaving.

**Money-page queries with impressions but no clicks** (the list to build the next 90 days around):

| Query group | Impressions | Position | Page currently shown | Action |
|---|---|---|---|---|
| travel insurance uae / uae travel insurance / travel insurance in uae / travel insurance dubai / travel insurance abu dhabi | 425 + 125 + 46 + 19 + 202 | 38 to 71 | `/travel-insurance` | Head term. Needs the destination grid, price in title, Product schema, and 5 to 8 more inbound links from posts with the exact anchor. |
| axa travel insurance uae / dubai / axa uae travel insurance | 273 + 133 + 108 | 5.8 to 8.4 | `/` | Ranks well, 1 click. These searchers want AXA. Keep the AXA mention but lead the title with the offer, not the insurer. |
| single trip travel insurance / single trip insurance | 297 + 91 | 23 to 25 | `/single-trip` | Add "From AED 30" to title and description, Product schema, price on page. |
| buy travel insurance online / online travel insurance uae / travel insurance online uae | 260 + 91 + 82 | 21 to 48 | `/travel-insurance` and the 13 Sep post | Let the product page own it; retitle the post. |
| multi trip / annual travel insurance (7 variants) | 191 + 146 + 139 + 88 + 66 + 55 + 51 | 15 to 30 | `/annual-multi-trip` | Consolidate `/annual` into it; the split is holding it at 25. |
| travel medical insurance / travel medical insurance for uae | 190 + 85 | 47 to 54 | `/medical` | Product schema, price in title, link from claims and FAQ. |
| family travel insurance (+ dubai, cheap) | 168 + 25 + 19 | 27 to 52 | `/family` | Same. |
| worldwide / international travel insurance uae | 121 + 65 + 146 | 36 to 55 | `/international` | Same, and fix the 12 Sep post overlap. |
| travel insurance for schengen visa (+ dubai, uae, qatar) | 47 + 42 + 32 + 47 | 45 to 59 | `/schengen-visa` | Four Travl URLs compete. Consolidate the two April posts into one and canonicalise/redirect. |
| is travel insurance mandatory for uae residents | 80 | 21.3 | FAQ / post | A quick-answer post or an FAQ entry with a verdict in the first sentence. |
| travel insurance for uae visitors / visit visa insurance uae / inbound travel insurance uae (8 variants) | ~400 combined | 48 to 72 | various | Inbound cover for visitors to the UAE. Travl's plans cover UAE residents travelling out. If the supplier can quote inbound, this is a new product page; if not, write one post that says plainly Travl does not sell it and what does, so the impressions stop wasting crawl. |
| travel insurance for azerbaijan from uae / georgia | 103 | 47.8 | | Already in the automation queue for 4 and 5 Oct. |

**Queries Travl should stop chasing.** "canada visit visa from abu dhabi" (6 variants, 660 impressions, 0 clicks, positions 47 to 62), "italy visit visa from dubai/abu dhabi" (10 variants), "uk visit visa from dubai", "australia visit visa". These are visa-application queries hitting insurance pages because the URL says `-visa`. They will not convert on Travl. Add one sentence and a link to VisaWadi on each country page for the searcher who wants the visa, and let the `/travel-insurance/<country>-visa` URLs settle on "travel insurance for <country> visa".

**Brand.** "travl" 270 impressions, 10 clicks, position 10.9. A site should hold position 1 for its own name; "travl" is also a generic misspelling, so some of that is not you. Sitelinks would help; the dead `/login` and `/signup` links and the missing og:image do not.

## Master fix list

Impact and effort: H / M / L. Serves: R = rankings, A = AI presence, C = conversion.

| # | Issue | Scope | Category | Impact | Effort | Serves | Fix |
|---|---|---|---|---|---|---|---|
| 1 | Internal links to redirecting `/visa*` and moved slugs | 24 blog posts | Internal linking / migration | H | M | R, C | Rewrite each link in the backend blog content to the matching Travl product page. Where the sentence is about applying for the visa, link `https://www.visawadi.com/uae/visa/<slug>` directly instead of the redirect. Verify with a grep of rendered HTML for `href="/visa` and the 30 slugs. |
| 2 | og:image 404 | all 83 pages | Technical | H | L | C, A | Add `apps/travl-frontend/public/og-image.png` (1200 x 630, logo, "Travel insurance for UAE residents from AED 30, issued by AXA"). Add `images` to the home page metadata, which currently omits openGraph images entirely. |
| 3 | `/login` and `/signup` 404 but linked in header | all pages | Technical | H | L | R, C | Remove the auth links from the header Travl renders (frontend-shared header prop or brand flag), or implement the routes. |
| 4 | Renamed slugs 404 | 2 URLs | Technical | M | L | R | Add to `LEGACY_REDIRECTS`: `['/blog/flight-delay-whats-covered-when-your-flight-is-delayed', '/blog/flight-delay-insurance-whats-covered-when-your-flight-is-delayed']` and `['/blog/pre-existing-conditions-and-travel-insurance-what-uae-travellers-need-to-know', '/blog/pre-existing-medical-conditions-and-travel-insurance-what-uae-travellers-need-to-know']`. |
| 5 | Address contradiction | schema on all pages vs contact/footer | AEO / credibility | H | L | A, C | Decide the real address. Make `src/lib/schema.js` import `ADDRESS` from `src/config/contact.js` (split into street/locality fields) so they cannot drift. Match Google Business Profile. |
| 6 | Refund FAQ contradicts T&Cs | `/faq`, `src/data/faqs.js` Q14 | AEO / credibility | H | L | A, C | Replace the answer with: "No. Policies are issued instantly and payments are non-refundable, except where the policy was not delivered or a system error occurred. If your visa is refused, keep the policy for the rebooked trip if the dates still apply, or contact us within 24 hours of purchase and we will look at it case by case." Adjust to match what you actually do. |
| 7 | Orphaned country pages | `/canada-visa`, `/australia-visa`, `/us-visa`, `/uk-visa`, `/indonesia` | Internal linking | H | M | R | Add an "Insurance by destination" grid to `/travel-insurance` and `/travel-insurance/schengen-visa` linking all 13 destination pages. Add a "Related plans" block on each country page that includes non-Schengen destinations. |
| 8 | `/travel-insurance/annual` duplicates `/annual-multi-trip` | 2 pages | On-page / cannibalisation | H | L | R | 308 `/travel-insurance/annual` to `/travel-insurance/annual-multi-trip`, remove from sitemap and nav, fold its unique FAQ into the survivor. Fix Product price to 245.00 with `minPrice`. |
| 9 | Blog posts duplicating money-page intent | 6 posts | Content | H | M | R | 12 Sep and 13 Sep posts: retitle to a long-tail angle and link the product page in paragraph one with the head term as anchor. April Schengen pair: merge into one post, 308 the other. UK pair: keep the "is it required" post, retitle the other toward "what UAE residents need on the day". |
| 10 | Visa-era shells | `/blog`, `/blog/tags`, `/about`, tag pages | On-page / migration | M | L | R, A | `/blog` title: "Travel Insurance Guides for UAE Residents | Travl". Description: "Plain-English guides on travel insurance for UAE residents: what Schengen and UK visas require, what AXA policies cover, how claims work, and what you will pay." `/about` title: "About Travl | Travel Insurance for UAE Residents". Body: 300 to 400 words on what Travl is, the AXA relationship, the licence, who runs it, what it does not sell (link VisaWadi and Dummy Ticket 365 once each). Delete `dummy-ticket` and `flight-itinerary` tags. Rename `visa-tips` and `visa-documents` descriptions to insurance-for-visa framing or noindex them. |
| 11 | Product schema name and price | 17 product pages | Structured data | M | L | A, R | In each page's `buildProduct` call pass a clean `name` ("Schengen Visa Travel Insurance"), a one-sentence `description`, and extend the builder to emit `offers.priceSpecification: { "@type": "PriceSpecification", "minPrice": 30, "priceCurrency": "AED" }` plus `category: "Travel Insurance"`. Drop the title string from `Service.serviceType` too. |
| 12 | Templated country pages | 12 pages | On-page | M | M | R | Per page: one H1 variant, one 120 to 180 word fact block naming the consulate, its VFS/BLS provider, the region tier that applies, and one country-specific FAQ. One link to VisaWadi's matching country page for the applicant who wants the visa. |
| 13 | No price in title/description on 4 plans | `/medical`, `/single-trip`, `/international`, `/annual` | On-page | M | L | R, C | Titles: "Single Trip Travel Insurance UAE | From AED 30 | Travl", "Travel Medical Insurance UAE | From AED 30 | Travl", "International Travel Insurance UAE | From AED 70 | Travl". Add Product schema to `/medical` and `/single-trip` (currently absent). |
| 14 | Author entity missing | BlogPosting on 44 posts, `/authors/*` 404 | AEO | M | M | A | Create the author profile in the backend so `/authors/ammar-afridi` resolves, and set `author.url` and `sameAs` (LinkedIn) in `buildBlogPosting`. |
| 15 | Testimonials without provenance | home + 17 product pages | Credibility | M | L | A, C | If real: name the platform, link it, date them. If not: remove. Never add Review/AggregateRating schema without a verifiable source. |
| 16 | Empty tag pages indexed | `/blog/tags/dummy-ticket`, `/blog/tags/flight-itinerary` | Technical | M | L | R | Delete the tags, or return 404/noindex when a tag has 0 posts, and exclude 0-post tags from the sitemap. |
| 17 | Partner CTA on every post | 44 posts, 88 links | Conversion | M | L | C | In `getBlogInlineOffer` and `getBlogOffers`, show Dummy Ticket 365 only when the post is visa-adjacent (tag or slug contains visa/schengen/vfs/embassy). Insurance-only posts get the insurance CTA in both slots. |
| 18 | Home title leads with AXA | `/` | On-page | M | L | R, C | "Travel Insurance for UAE Residents from AED 30, Issued by AXA | Travl". Keeps the AXA term, leads with the offer. |
| 19 | Em dashes in titles and copy | `/about`, `/contact`, `/claims` titles; tag descriptions; product benefits | House style | L | L | A | Replace with a pipe in titles and a comma or full stop in prose. |
| 20 | Booking pages indexable | `/insurance-booking/*` | Technical | L | L | R | Add `robots: { index: false }` to the booking segment layout metadata. |
| 21 | Sitemap lastmod stale | 31 static entries | Technical | L | L | R | Either maintain the dates when pages change or drop `lastmod` on static entries. |
| 22 | Tag pages uncached | 8 pages, 1.0 to 1.6 s TTFB | Performance | L | L | R | Add `export const revalidate = 3600` to `blog/tags/[slug]/page.js`. |
| 23 | Home hero alt text | `/` | On-page | L | L | R | "UAE residents travelling with AXA travel insurance from Travl" or similar. |
| 24 | `dateModified` never updated | 44 posts | Content | L | M | A | When a post is edited (fixes 1 and 9 will edit 26 of them), make sure the backend bumps `updatedAt` and the sitemap reflects it. |
| 25 | Inbound/visitor insurance demand | ~400 impressions | Content | L | M | R | If WIS can quote inbound cover, a product page. If not, one post stating Travl does not sell it. |
| 26 | Arabic demand | ~15 queries | Content | L | H | R | Defer. |
| 27 | Upcoming automation topics that duplicate money pages | `automations/targets/travl/topics.json` | Content | M | L | R | Before 1 Oct, reframe `travel-insurance-regions-explained`, `how-much-medical-cover-usa-uk-schengen`, `schengen-multiple-entry-visa-insurance` toward long-tail angles, and add a rule to the config that a post title may not contain the exact H1 of any product page. |

## Appendix A: Why the chrome-devtools MCP keeps failing

`~/.claude.json` registers the server as `npx @anthropic-ai/chrome-devtools-mcp@latest`. That package does not exist on npm (`npm view` returns 404), so `npx` exits and Claude Code reports CONNECTION_CLOSED. The real package is `chrome-devtools-mcp` (currently 1.9.0). Change the args to `["chrome-devtools-mcp@latest"]` (or `["-y", "chrome-devtools-mcp@latest"]`) and restart the session. Chrome is installed, Node 23 is fine.

## Appendix B: What was and was not verified

Verified live: status codes and redirect chains for 83 sitemap URLs, 17 redirect/error paths and 11 VisaWadi destinations; titles, descriptions, canonicals, robots meta, og tags, JSON-LD validity and contents, H1/H2 counts, word counts, image alts, internal and external link graphs, response headers and TTFB for every sitemap URL.

Not verified: Core Web Vitals, tap targets, layout, client-side rendering, anything a browser would show. Prices beyond the house facts. Whether testimonials are real. Whether the WIS supplier can quote inbound cover. GSC figures are as exported; no search volume was estimated anywhere in this report.

No file other than this report was modified.
