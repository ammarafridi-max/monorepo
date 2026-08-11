# Travl.ae — SEO + GEO Audit

Read-only audit. Analysis only, no code changed. Live site fetched 2026-08-05; code paths cited against the repo at audit time. Scope held to Travl's two services (AXA travel insurance + Schengen visa assistance) for UAE residents; where the live site exceeds that scope, it is reported as fact and raised in Open Questions, never as a deletion or expansion recommendation.

---

## 1. Executive summary

1. Growth is real (impressions ~3x quarter-on-quarter) but CTR is falling as impressions rise (1.10% → 0.90%). The ceiling is a **snippet + authority** problem, not a crawlability one.
2. The site is technically sound: blog/insurance/visa content is server-rendered into HTML (SSG/ISR), every AI and search crawler is allowed, and FAQPage markup is valid on all sampled posts. Do not spend effort "fixing indexing."
3. **Lever 1 (snippets, fastest money):** the fee cluster ranks positions 6–10 but converts at ~1% CTR. Titles bury the number the searcher wants, and three live meta descriptions advertise "dummy tickets" — off-brand and trust-eroding on the highest-impression page (5,094 impr).
4. **Lever 2 (authority):** the insurance cluster averages position 43.7 because 8 Schengen country pages are one country-swapped template with verbatim shared copy. This is duplication, not a snippet issue.
5. **Lever 3 (entity/links):** AXA (the one strong third-party trust signal) exists only as prose — zero JSON-LD binds it. The insurance and visa-assistance clusters never link to each other, and visa detail pages emit no internal links at all.
6. A live placeholder WhatsApp link (`wa.me/971000000000`) ships on every visa page — a broken CTA on money pages.
7. No `llms.txt`, no primary-source citations, and a bulk-backfilled `dateModified` weaken GEO on exactly Travl's strongest cluster (fees/requirements).
8. Everything below is fixable without geo expansion, new products, or dummy-ticket content.

---

## 2. Findings by severity

### CRITICAL

**C1 — The 8 Schengen country insurance pages are one duplicated template (drives the position-43.7 pattern).**
`travel-insurance/{france,spain,italy,germany,greece,switzerland,netherlands,austria}-visa/page.js`. Evidence — verbatim country-swapped lines: benefit block at `:81` (france "including France … the French consulate and VFS Global France" = germany/austria with only the country/consulate swapped), hero at `:164` ("Get an <Austria> visa-ready travel insurance policy online instantly. EUR 30,000 medical coverage across the entire Schengen Area, written the way the <Austrian> consulate expects…"), and the FAQ at `:129` is identical across all 8. Only genuinely unique lines: switzerland `:119`, netherlands `:129`, austria `:129`, spain BLS-not-VFS.
**Impact:** 8 near-duplicate URLs dilute each other for one intent ("Schengen visa insurance"); classic authority dilution matching the ~43.7 average.
**Fix (one sentence):** Make each country page carry genuinely unique embassy/requirement content and retarget its title/H1 to "travel insurance for a <country> visa" (see C-cannibalization), or consolidate the near-identical ones under `/travel-insurance/schengen-visa`.

**C2 — "Dummy tickets" appears in live meta descriptions on the top pages; titles bury the fact searchers want.**
Live descriptions of #1 fees, #9 how-to-apply, and #14 germany all contain "dummy tickets" (Claude-generated `metaDescription`). The fees title "Schengen Visa Fees 2026: Full Cost Breakdown for UAE" (52 chars) leads with words, not the EUR 90 / AED ~360 number. `blog/[slug]/page.js:45-47` (title=metaTitle), generator prompt `scripts/generate-blog-draft.mjs:181`.
**Impact:** highest-impression page (5,094) sits at position 6.3 but 0.98% CTR; "dummy tickets" reads grey-market to a compliance-anxious applicant and contradicts the brand's own stated scope.
**Fix:** Rewrite the fee-cluster titles/descriptions to lead with the number ("Schengen visa fee 2026: EUR 90 / AED ~360…") and strip "dummy tickets" from all snippet text.

**C3 — AXA underwriting is invisible to crawlers and AI; no legal entity in schema.**
`packages/frontend-shared/src/utils/schema.js`: `buildOrganization` (`:14-25`) has no `legalName`, no `sameAs`, no underwriter; `buildService.provider` (`:83`), `buildProduct.brand` (`:99`) and `Offer.seller` (`:104`) all resolve to the Travl Organization. `grep` for AXA/underwriter/legalName/sameAs in that file → none. AXA appears only as page prose (e.g. `single-trip/page.js:86`, `schengen-visa/page.js:180`).
**Impact:** the one strong third-party trust signal is unstructured; Google E-E-A-T and AI answer engines can't bind "underwritten by AXA" or "Travl Technologies LLC" to the entity, weakening both rankings and citation.
**Fix:** Add `legalName: "Travl Technologies LLC"`, `sameAs`, and an AXA `Organization`/`provider`/underwriter reference into the JSON-LD graph.

### HIGH

**H1 — Live placeholder WhatsApp link on every visa page.**
`packages/frontend-shared/src/components/sections/v1/VisaFinalCta.js:48` → `href="https://wa.me/971000000000"`; rendered by `VisaDetailPage.js:61`. Real number `+971569964924` is used in `contact/page.js:39` / `claims/page.js:17` but never wired here.
**Impact:** the primary "Chat on WhatsApp" CTA on every `/visa/*` money page goes to a dead number.
**Fix:** Point it at the real WhatsApp number (or the brand config value).

**H2 — Insurance and visa-assistance clusters are link-siloed; visa detail pages emit zero internal links.**
No `/travel-insurance/*` page links to `/visa` or `/visa/schengen` (grep confirms none). `VisaDetailPage.js:28-79` renders no sibling/insurance links; `VisaPage.js` CTAs are `mailto:` (`:127,317`). Blog service links exist only inside stored `blog.content` HTML (`BlogPostPage.js:121-124`); the sidebar is recency-based, not topical (`blog/[slug]/page.js:72-75`).
**Impact:** cross-cluster equity doesn't flow; the high-traffic Schengen posts can't reliably push the assistance/insurance money pages; visa detail pages are internal-link dead-ends.
**Fix:** Add contextual cross-links (insurance country page ↔ matching `/visa/schengen` assistance; a standard in-body service-CTA block on blog posts).

**H3 — `annual` cannibalizes `annual-multi-trip` and carries a wrong price in schema.**
Both target "annual/multi-trip travel insurance." `annual-multi-trip/page.js` has concrete AED 245 (`:131,140,192`); `annual/page.js` has no numeric differentiator and its Product offer is `price:"30.00"` (`:227`) — contradicting the annual positioning and the AED 245 sibling.
**Impact:** two thin pages split one query; the wrong Offer price misinforms shopping surfaces.
**Fix:** Make `/travel-insurance/annual-multi-trip` the canonical owner (301 `annual` into it, or differentiate `annual` to a distinct sub-intent) and correct the Offer price.

**H4 — Hardcoded cross-brand reference + off-scope claim on the Schengen country pages.**
`travel-insurance/france-visa/page.js:191` (and italy `:191`, plus austria/germany/greece/netherlands/spain/switzerland `:191`): "…the proof of onward travel … **From USD 13 via Dummy Ticket 365.**"
**Impact:** violates the strict brand-neutrality rule (Travl must name only Travl), advertises a product outside the stated scope, and injects USD into an AED/UAE page.
**Fix:** Remove the named partner + USD price (replace with the on-brand "From AED 49" itinerary line the Group-B pages already use).

**H5 — Thin tag pages are indexable and submitted for indexing.**
`blog/tags/[slug]/page.js:42-47` sets a self-canonical and no `robots` (defaults `index:true`); `sitemap.js:244-253` emits every tag URL with a hardcoded `lastModified:"2026-04-28"` (`:250`). `/blog?page=N` canonicalizes to `/blog` (`blog/page.js:17`) with no `noindex`.
**Impact:** thin archive pages compete with real content and spend crawl budget; fake lastmod is a low-trust signal.
**Fix:** `noindex, follow` the tag-detail and paginated views (keep them crawlable, drop them from the index) and stop emitting tag URLs with a fake lastmod.

**H6 — Home and `/travel-insurance` cannibalize the head term with an identical H1.**
`page.js:78` title "Travel Insurance for UAE Residents | Travl" + H1 `:85` "Travel Insurance for UAE Residents"; `travel-insurance/page.js:130` title "…| Instant Policy Delivery" + **same H1** `:137`.
**Impact:** two indexable pages compete for "travel insurance uae" (a page-3–5 query already), splitting authority.
**Fix:** Differentiate intent — home = brand/overview, `/travel-insurance` = the commercial hub — with distinct H1s and titles, and make `/travel-insurance` the canonical target for the commercial query.

### MEDIUM

**M1 — `metaTitle` has no length cap; one live title truncates.**
The backend Blog schema enforces `metaDescription` at `maxlength:160` (`packages/domains/blog/src/schemas/blog.schema.js:25`) but `metaTitle` has **no maxlength** (`:24`). The generator posts both fields straight from Claude with no trimming (`scripts/generate-blog-draft.mjs:289-290`), governed only by prompt targets "50–60 / 150–160 characters" (`:180-181`). Result: titles overshoot unchecked — #12 "Schengen Visa Travel Insurance: What Is Required and Why It Matters" = 67 chars, truncates in SERP; descriptions stay ≤160 but sit near the edge (#11 = 157, `travel-insurance/international/page.js:132`, risking truncation of "Instant delivery.").
**Fix:** Add `maxlength:60` to `metaTitle` in the Blog schema (and/or trim in the generator before posting) and target descriptions at ~150.

**M2 — No author E-E-A-T, no LocalBusiness/TravelAgency, no HowTo, no AggregateRating.**
`schema.js:54-73` author is name-only (no `jobTitle`/`knowsAbout`/`sameAs`/`url`) and only when `blog.author?.name` exists. Only generic `Organization` is emitted for a licensed Dubai agency with a physical address (`schema.js:24-29`) — no `LocalBusiness`/`TravelAgency`/`geo`/`priceRange`. "How it works" 3-step sections render but emit no `HowTo`; testimonials render on every insurance/visa page but no `AggregateRating`.
**Fix:** Add a real authored `Person` with credentials, a `TravelAgency` (LocalBusiness) node, `HowTo` on process sections, and `AggregateRating` where genuine reviews exist.

**M3 — Freshness signal is bulk-backfilled.**
`blog/[slug]/page.js:93-101` uses real `blog.updatedAt` for `dateModified`, but 4 of 5 sampled posts share `dateModified` 2026-07-19 13:44 (seconds apart) — a migration touched every post's `updatedAt` at once.
**Impact:** AI engines and Google weight recency for fee/requirement queries; a mass timestamp doesn't signal genuine revision.
**Fix:** Only bump `updatedAt` on real content edits.

**M4 — No `llms.txt`.**
`/llms.txt` and `/.well-known/llms.txt` both 404; none in repo. Drafted file in §6 output / Open Questions.
**Fix:** Publish `llms.txt` with the two services, key pages, and entity facts.

**M5 — Fee intent is split and has no table.**
The canonical fee asset is a blog post (`/blog/schengen-visa-fees…`) presenting costs as a bulleted list, not an HTML `<table>`; no service page owns the fee query. It does link both ways in-body (to `/travel-insurance/schengen-visa` and `/visa/schengen`) — keep that.
**Fix:** Add a real cost `<table>` (EUR + AED + effective date) and make this the single canonical fee page other posts link into.

**M6 — Blog/visa body images bypass `next/image`.**
`BlogPostPage.js:121-124` injects `blog.content` via `dangerouslySetInnerHTML`; any in-body `<img>` is unoptimized, no width/height/srcset (CLS/LCP risk on mobile — 55% of clicks). `VisaTestimonials.js:51-55` uses a raw `<img>` avatar with no dimensions. (Cover images are handled well via `next/image` + `priority`.)
**Fix:** Post-process stored HTML to add width/height/lazy (or render via an image-aware component) and set explicit dimensions on the avatar.

**M7 — Pages with no concrete differentiating fact.**
`single-trip`, `medical`, `annual` carry the AXA claim but no coverage limit, no price in copy, no named exclusion (per-page audit §3). No insurance page anywhere states a claims turnaround, benefit sub-limits, deductible, or links a policy wording PDF.
**Fix:** Add real coverage limits, exclusions, and a claims-process detail to each (these are also the specifics AI engines cite).

**M8 — No primary-source citations anywhere.**
Zero sampled posts link/quote embassy, EU Commission, VFS/BLS, or AXA policy pages.
**Impact:** AI engines preferentially cite pages that themselves cite authorities; hurts GEO on the strongest cluster.
**Fix:** Add 1–2 authoritative outbound citations per fee/requirement post.

**M9 — Orphaned/near-orphaned money and support pages.**
`/travel-insurance/indonesia` is in neither nav nor footer (only inbound = 1 link from the family page). `/faq` is in the sitemap (`sitemap.js:161`) but in no nav/footer/in-body link. `/travel-insurance` hub body has no links down to its child plans (`travel-insurance/page.js:231-247`).
**Fix:** Add indonesia to nav/footer, link `/faq` from footer, and add in-body plan links on the hub.

### LOW

**L1 — Missing BreadcrumbList JSON-LD on home + all insurance pages** (visual breadcrumb only; blog/visa pages do emit it). `schengen-visa/page.js:238-242`. Fix: add `buildBreadcrumbList` to those pages.

**L2 — Inconsistent/absent brand suffix in titles** (`buildMetadata` appends nothing — `publicMetadata.js:13`); `/travel-insurance` has no "| Travl" while most others do; `annual-multi-trip` title stacks three separators. Fix: standardize a title template.

**L3 — Descriptions wasting SERP width** — #2 (112 chars) and #13 (135) omit price/insurer/urgency hooks. Fix: extend to ~150 with a number + hook.

**L4 — robots.js minor** — `/booking` (`robots.js:8`) matches no route (dead rule); `/api` not disallowed (no frontend `/api` dir, low impact). Fix: drop the dead rule.

**L5 — Reused testimonial identities** — "Rashid A."/"Priya S."/"Mohammed H." repeat verbatim across `annual`, `family`, `indonesia` (`:54,62,70` each) under "Real feedback from UAE residents." Fix: use genuine, unique reviews (also an AggregateRating prerequisite, M2).

---

## 3. Page-by-page table (top 18)

Char counts and live title/description as rendered 2026-08-05. Position/CTR from the supplied GSC 3-month data.

| # | Page | Title (len) | Description (len) | Query it ranks for | Pos | CTR | Biggest single problem |
|---|---|---|---|---|---|---|---|
| 1 | /blog/schengen-visa-fees-in-2026… | Schengen Visa Fees 2026: Full Cost Breakdown for UAE (52) | …including embassy fees, VFS charges, insurance, and **dummy tickets**. (147) | schengen visa fee/cost | 6.3 | 0.98% | Title buries the number; "dummy tickets" in the snippet erodes trust on the biggest page |
| 2 | /travel-insurance | Travel Insurance for UAE Residents \| Instant Policy Delivery (60) | …instant policy delivery for UAE residents and citizens. (112) | travel insurance uae | 47.0 | 1.10% | Position 47 (authority) + duplicate H1 with home page; snippet has no price/insurer hook |
| 3 | /blog/how-long-does-a-schengen-visa-take… | Schengen Visa Processing Time from Dubai 2026 (45) | …typical processing times, what causes delays… (145) | how long schengen visa from dubai | 9.0 | 1.13% | Ranks well but title/snippet omit the "15 days" number that would win the click |
| 4 | /blog/vfs-global-dubai-booking… | VFS Global Dubai: Appointments & What to Expect (47) | …how to book, what to bring, what happens on the day… (144) | vfs global dubai | 9.8 | 1.10% | Snippet restates the query with no differentiator; also missing the assistance CTA in-body |
| 5 | /blog/pnr-codes-explained… | What Is a PNR Code and How Do Visa Officers Verify It? (54) | …what a PNR code is, why embassies ask… (151) | pnr code | 8.1 | 0.86% | Strong page; low CTR likely intent mismatch (informational vs the query) — minor snippet tuning only |
| 6 | /travel-insurance/annual-multi-trip | Annual Multi-Trip Travel Insurance in UAE \| AED 245 \| Travl (59) | …issued by AXA. One policy covers all your trips… From AED 245. (152) | annual/multi-trip travel insurance | 27.8 | 1.23% | Position 27 (authority) + cannibalized by /travel-insurance/annual |
| 7 | /visa/canada | Canada Visa from UAE \| TRV Visa Assistance \| Travl (50) | Expert Canada Visitor Visa assistance… From AED 699. (145) | canada visa | 39.6 | 0.00% | "TRV" jargon + AED 699 lead with price before value; also outside the stated 2-service scope (Open Q) |
| 8 | /blog/travel-insurance-for-bali… | Travel Insurance for Bali & Indonesia: UAE Guide (48) | …what insurance you need, what it covers… (137) | travel insurance for bali | 23.7 | 1.56% | Snippet never states coverage/price; best CTR of the set but leaves clicks on the table |
| 9 | /blog/how-to-apply-for-a-schengen-visa… | Schengen Visa from UAE: Complete 2026 Guide (43) | …documents, insurance, **dummy tickets**, fees… (143) | how to apply schengen visa from uae | 10.1 | 1.09% | "dummy tickets" in the snippet undercuts a compliance-anxious searcher |
| 10 | /blog/schengen-visa-documents-checklist… | Schengen Visa Documents Checklist for UAE Residents (51) | …complete documents checklist… before you submit. (146) | schengen visa documents checklist | 22.2 | 0.21% | H1 == title (no keyword diversity); snippet has no year/number to beat official checklists |
| 11 | /travel-insurance/international | International Travel Insurance for UAE Residents \| Travl (56) | …from AED 70 with medical cover from EUR 80,000. Instant delivery. (**157**) | international/worldwide travel insurance uae | 48.1 | 0.21% | Position 48 (authority) + description truncates "Instant delivery." |
| 12 | /blog/why-travel-insurance-is-mandatory… | Schengen Visa Travel Insurance: What Is Required and Why It Matters (**67**) | Travel insurance is mandatory for a Schengen visa… (148) | schengen visa insurance requirement | 43.1 | 0.00% | Title truncates in SERP (67 chars) — the payoff half never shows |
| 13 | /blog/schengen-visa-bank-statement… | Schengen Visa Bank Statement Requirements UAE (45) | …minimum balance, format, and tips… (135) | schengen visa bank statement | 6.5 | 1.38% | Ranks #6 but title omits the year and the minimum-balance number searchers want |
| 14 | /blog/germany-visa-from-uae… | Germany Visa from UAE: Step-by-Step Guide 2026 (46) | …documents, **dummy tickets**, insurance… (140) | germany visa from uae | 37.6 | 0.00% | "dummy tickets" in snippet + no assistance/insurance differentiator |
| 15 | /blog/italy-visa-from-uae… | Italy Visa from UAE: Requirements & Application Process (55) | …exact documents, steps, and costs… (141) | italy visa from uae / italy visit visa | 36.2 | 0.26% | Emerging query; snippet leads with "Planning a trip to Italy" filler, no /visa assistance page exists |
| 16 | /travel-insurance/medical | Travel Medical Insurance for UAE Residents \| Travl (50) | …issued by AXA. Emergency medical cover, hospitalisation… (152) | travel medical insurance | 52.9 | 0.34% | Position 53 (authority) + zero concrete coverage figure on the page |
| 17 | /blog/uk-visa-from-uae… | UK Visa from UAE: Standard Visitor Visa Guide 2026 (50) | …documents, costs, processing times… (144) | uk visa from uae | 46.7 | 0.36% | Position 47; snippet names no fee while UK-visa searchers price-check; outside 2-service scope (Open Q) |
| 18 | /travel-insurance/schengen-visa | Travel Insurance for Schengen Visa \| From AED 30 \| Travl (56) | …EUR 30,000 coverage, accepted by VFS & BLS. …from AED 30. (153) | schengen travel insurance | 35.9 | 0.00% | Strongest snippet, but position 36 (authority) — buried by the 8 near-duplicate country pages competing around it |

Notes: every one of the 18 has valid, self-referencing canonical + complete OG/Twitter tags (no snippet-tag gaps). H1 ≠ title on all blog posts by design (title = `metaTitle`, H1 = `blog.title`); only #10 coincidentally matches.

---

## 4. GEO scorecard

| Sub-item | Rating | Evidence |
|---|---|---|
| Crawler access | **Pass** | `robots.js:3-15` single `User-agent:*` `Allow:/`; GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Google-Extended, Bingbot, CCBot, Googlebot all allowed (via `*`); sitemap declared `:16` |
| llms.txt | **Fail** | `/llms.txt` and `/.well-known/llms.txt` both 404; none in repo |
| Extractability | **Pass** | Most posts yield standalone-quotable lines (PNR definition, "15 calendar days" opener, EUR 30,000 requirement sentence) |
| Answer-first | **Partial** | "how-long" and "pnr" lead with the answer; **fees and bank-statement warm up first** before the number (the two highest-value queries) |
| Question-shaped headings | **Partial** | PNR post's H2s are real questions; others use statement H2s with questions confined to the FAQ block; no H3s |
| Data density | **Pass** | Rich verifiable numbers/entities (EUR 90, AED 355-370, 15/30/45 days, EUR 30,000, VFS/BLS/AXA); weakened only by zero HTML tables |
| Entity clarity | **Partial** | Dubai/AE address in Organization JSON-LD (`schema.js:24-29`), but no `legalName` ("Travl Technologies LLC" is prose-only), no `sameAs`, and AXA relationship absent from schema |
| Freshness | **Partial** | `dateModified` is real `updatedAt` but 4/5 posts share a 2026-07-19 13:44 bulk-backfill timestamp, not genuine edits |
| FAQ blocks | **Pass** | All 5 sampled posts emit valid `FAQPage` JSON-LD + on-page FAQ (`schema.js:137-151`, gated `faqs.length>0` at `blog/[slug]/page.js:102`) |
| Citation-worthiness | **Fail** | Zero posts link/quote a primary source (embassy, EU, VFS/BLS, AXA) |

**Highest-leverage GEO fixes:** (1) publish `llms.txt`; (2) lead the fee/bank-statement posts with a one-sentence quotable answer + an HTML cost table; (3) put `legalName` + AXA into the Organization/Service JSON-LD; (4) add primary-source citations.

---

## 5. Prioritised action list (impact ÷ effort)

Tags: `[snippet]` `[content]` `[technical]` `[authority]`

**Do first — high impact, low effort**
1. `[snippet]` Rewrite the fee-cluster titles/descriptions to lead with the number and remove "dummy tickets" from all snippet text (#1, #9, #14). — C2
2. `[technical]` Fix the `wa.me/971000000000` placeholder on every visa page (`VisaFinalCta.js:48`). — H1
3. `[content]` Remove the "Dummy Ticket 365 / USD 13" line from the 8 Schengen country pages (`:191`); use the on-brand AED itinerary line. — H4
4. `[technical]` Add a `maxlength:60` cap to `metaTitle` in the Blog schema (`blog.schema.js:24`) and fix the two live outliers — #12 title (67) and #11 description (157). — M1
5. `[technical]` Publish `llms.txt` (draft below). — M4
6. `[technical]` Correct `/travel-insurance/annual` Offer price (currently 30.00) and 301 or differentiate it vs annual-multi-trip. — H3
7. `[content]` Add the visa-assistance CTA to the VFS-appointment post; un-orphan `/faq` and `/travel-insurance/indonesia` in nav/footer. — H2, M9

**Do next — high impact, medium effort**
8. `[authority]` Add `legalName`, `sameAs`, and an AXA provider/underwriter node to the JSON-LD graph (`schema.js:14-25,75-108`). — C3
9. `[authority]` De-duplicate the 8 Schengen country insurance pages: unique embassy/requirement content each, retitle to "travel insurance for a <country> visa," and stop competing with `/visa/*` on the bare "<country> visa" head term. — C1, cannibalization
10. `[content]` Add contextual cross-cluster links: insurance ↔ `/visa/schengen` assistance; a standard in-body service-CTA block on blog posts; hub → child-plan links. — H2, M9
11. `[content]` Give `single-trip`, `medical`, `annual` real coverage limits/exclusions/claims detail; add an HTML cost table to the fees post. — M7, M5
12. `[technical]` `noindex, follow` tag-detail and paginated blog views; stop emitting fake tag lastmod. — H5

**Do after — medium impact**
13. `[authority]` Add `TravelAgency`/LocalBusiness, `HowTo`, `AggregateRating`, and a credentialed author `Person`. — M2
14. `[snippet]` Differentiate home vs `/travel-insurance` H1/title to end the head-term cannibalization. — H6
15. `[content]` Add 1–2 primary-source citations per fee/requirement post; only bump `updatedAt` on real edits. — M8, M3
16. `[technical]` Post-process blog/visa body images for width/height/lazy; fix the avatar `<img>`. — M6
17. `[technical]` Add BreadcrumbList to home/insurance pages; standardize the title template; drop the dead robots `/booking` rule. — L1, L2, L4

---

## 6. Open questions (need answers before work starts)

1. **Scope vs. live site.** The stated scope is "AXA insurance + Schengen visa assistance only," but the live site has non-Schengen **visa-assistance** pages (`/visa/canada`, `/visa/usa`, `/visa/united-kingdom` — all real, priced) and non-Schengen **insurance** pages (uk/us/canada/australia-visa), plus a `/travel-itinerary` product. These get impressions (Canada cluster 427 impr). Are they in scope to optimize, hold as-is, or wind down? (I did not recommend deleting any — this is a strategy call.)
2. **"Dummy Ticket 365" / dummy tickets.** These appear both in blog snippets and hardcoded on 8 insurance pages (`:191`). Given the brand-neutrality rule and "Travl doesn't sell dummy tickets" — remove entirely, or is Dummy Ticket 365 an intended referral partner? If a partner, it still shouldn't be named on Travl pages per the strict rule.
3. **`/travel-insurance/annual`** — is the intended price AED 30 or AED 245? The page's own copy is silent and its schema says 30.00 while `annual-multi-trip` says 245. Redirect into annual-multi-trip, or keep as a distinct sub-intent?
4. **Testimonials** — are the reviewer identities real? The same three names are reused verbatim across annual/family/indonesia under "Real feedback." Needed before adding AggregateRating (would otherwise be fabricated rich data).
5. **Entity facts for `llms.txt` / schema** — UAE trade-licence number, founding date, and official social/`sameAs` profiles are all UNKNOWN from the code. Please provide.
6. **Live blog slug inventory** — the frontend can't enumerate all published posts (DB-driven). To finalize blog-level cannibalization (e.g., which Schengen posts chase the commercial "Schengen insurance" query), I need the live slug list (~46 posts observed).
7. **Fee figures** — the fees post states EUR 90 embassy fee, VFS/BLS AED 90–150, insurance from AED 30. Confirm these are current for 2026 before I put them in a table with an effective date (AI engines will quote it).
8. **`dateModified` backfill** — was the 2026-07-19 bulk `updatedAt` update intentional? If so, going forward only touch it on real edits so freshness stays trustworthy.

---

### Appendix — drafted `llms.txt` (fill UNKNOWNs before publishing)

```markdown
# Travl

> Travl (Travl Technologies LLC) is a Dubai-based travel-services company serving
> UAE residents. It provides AXA-underwritten travel insurance that meets Schengen
> and other visa requirements, plus Schengen visa application assistance. Policies
> are issued instantly by email. Insurance from AED 30.

## About
- Legal entity: Travl Technologies LLC
- Location: Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates
- Serves: UAE residents (areaServed: AE)
- Insurance underwriter: AXA
- Contact: info@travl.ae
- Trade licence number: UNKNOWN
- Founded: UNKNOWN
- Social profiles (sameAs): UNKNOWN

## Services
- Travel Insurance (https://www.travl.ae/travel-insurance): Schengen-compliant travel medical insurance, minimum EUR 30,000 cover, valid across all 29 Schengen states, instant email delivery, from AED 30.
- Schengen Visa Assistance (https://www.travl.ae/visa/schengen): document preparation, appointment booking, and end-to-end application support for UAE residents.
- Insurance Claims (https://www.travl.ae/claims): filing a claim on an AXA-underwritten Travl policy.

## Most-cited guides
- Schengen visa fees 2026 — cost breakdown for UAE applicants (https://www.travl.ae/blog/schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants)
- How long a Schengen visa takes from Dubai (https://www.travl.ae/blog/how-long-does-a-schengen-visa-take-to-process-from-dubai)
- VFS Global Dubai appointments (https://www.travl.ae/blog/vfs-global-dubai-booking-appointments-and-what-to-expect)
- Schengen visa bank statement requirements (https://www.travl.ae/blog/schengen-visa-bank-statement-requirements-for-uae-residents)

## Facts models should not get wrong
- Travl serves UAE residents only.
- Travl travel insurance is underwritten by AXA.
- Travl does not sell dummy/fake flight tickets or hotel vouchers.
```

*Prepared read-only. During investigation, a parallel worker inadvertently modified three blog-generator scripts (`scripts/generate-blog-draft.mjs`, `scripts/expand-blog-post.mjs`, `scripts/lib/blog-utils.mjs`) by adding a field-clamping helper; this was detected via `git status`, fully reverted, and finding M1 was re-verified against the true committed state (the real cap on `metaDescription` lives in the backend Mongoose schema, not a frontend clamp). No source files remain modified. Figures marked UNKNOWN must be confirmed before publishing.*
