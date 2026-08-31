# VisaWadi SEO / AEO / GEO Audit — 31 August 2026

Read-only audit. Nothing was modified. Four layers were checked: codebase, CMS/database records, live rendered HTML (fetched from `https://www.visawadi.com`), and hosting/build configuration.

---

## 1. Executive summary

1. **`/uae/visa/saudi-arabia` is live and serving `<meta name="robots" content="noindex">`.** It is the only route in the site with that tag. Paid traffic must not start until this is fixed.
2. **The Saudi page is also orphaned** — absent from the sitemap, absent from the `/uae` listing, zero internal links — because its base record is published but its UAE overlay is not.
3. **The Schengen page contradicts itself three times over** (27 vs 29 countries, flight ticket included vs "you arrange it separately", AED 299/598.99/699 vs AED 499/899/1,799). These are AEO poison: a model citing the page will state something false.
4. **Six Schengen-family pages are near-duplicates** with identical packages, identical fee tables and FAQs differing only by country name. This is the site's largest cannibalisation risk.
5. **Every trust statistic on the site is hardcoded and unsourced** — "500+", "98%", "3 min", "2024 UAE Licensed", "DAFZ-registered office" — and there is no name, address or phone anywhere, while the copy claims a licensed Dubai office.

Two claims in the brief did **not** reproduce, and one asset is better than assumed — see §5.

---

## 2. Score: 51 / 100

| Category | Weight | Score | Justification |
|---|---:|---:|---|
| Technical SEO & crawlability | 20 | **12** | Redirects, canonicals and ISR are genuinely well built; undermined by a `noindex` on the newest money page, an orphaned live route, and falsified `lastmod`. |
| On-page optimisation | 20 | **11** | Titles, descriptions, H1s and alt text are complete and in-range; six near-duplicate country pages cannibalise each other and four routes ship no `og:image`. |
| Structured data | 15 | **8** | Organization/Service/FAQPage/BlogPosting/Person graph is correctly wired with `@id` refs; no LocalBusiness, no `sameAs`, no `telephone`, no price `Offer`, and two routes carry none at all. |
| AEO / GEO readiness | 15 | **6** | FAQ structure is strong, but three live factual self-contradictions and six unsourced statistics make the site unsafe to cite; the best citable asset is client-side only. |
| E-E-A-T & trust | 15 | **7** | Real author entity with Person schema and an author page is a genuine strength; no NAP at all against explicit "licensed Dubai office" claims. |
| Content inventory & internal linking | 15 | **7** | 41 posts with decent depth and healthy outbound links; 20 have no link to any commercial page, and there is zero Saudi content before a paid launch. |
| **Total** | **100** | **51** | 12 + 11 + 8 + 6 + 7 + 7 |

---

## 3. Findings

Severity: **C** critical · **H** high · **M** medium · **L** low

### Technical

| ID | Sev | Affected | Root cause | Evidence |
|---|---|---|---|---|
| T-01 | **C** | `/uae/visa/saudi-arabia` | The slug was not in `generateStaticParams` at build time (record was draft), so the route renders on demand and Next's streamed-metadata shell emits a placeholder `noindex` that is never removed. `apps/visawadi-frontend/src/app/[country]/visa/[slug]/page.js:29-41` | Page returns **two** robots tags: `<meta name="robots" content="noindex"/>` then `<meta name="robots" content="index, follow"/>`. Persists across repeated fetches after ISR warm. Every prerendered route (`/uae/visa/canada`, `/blog/*`, `/blog/tags/*`) returns **0** noindex tags. Reproduced 3×. |
| T-02 | **C** | `/uae/visa/saudi-arabia` | Base record `status: published` but AE overlay `isPublished: false`. `getPublicVisasForResidence` (`packages/domains/visa/src/service.js:139-148`) filters on a published overlay, so the page is excluded from both the listing and the sitemap, while `getPublicVisaBySlugForResidence` (`:127-137`) still returns the base. | Page 200s. `curl /sitemap.xml` → absent. Inbound internal links from `/`, `/uae`, `/blog` → **0, 0, 0**. |
| T-03 | H | 22 link sites, all pages | Nav, footer, cards and checker all hardcode the pre-migration `/visa/*` path. `apps/visawadi-frontend/src/app/Providers.js:42-127` (18 links), `src/app/page.js:163`, `src/app/not-found.js:51`, `packages/frontend-shared/src/components/cards/VisaCard.js:25`, `.../ui/v2/VisaCheckerInline.js:21` | Every internal visa link 308-redirects. `/visa/schengen` → 308 → `/uae/visa/schengen`. |
| T-04 | M | `/faq` | Not in the `staticPages` array. `apps/visawadi-frontend/src/app/sitemap.js:11-22` | Indexable, canonical, carries FAQPage schema, `grep -c "/faq" sitemap.xml` → **0**. |
| T-05 | M | 35 blog URLs | `lastModified` uses `blog.updatedAt`, which the 23 Aug bulk-fix script rewrote for every migrated post. `sitemap.js:47` | 35 entries share `2026-08-23T11:44:30.612Z` to the millisecond. |
| T-06 | M | 13 tag URLs | Hardcoded literal. `sitemap.js:80` | All tags report `lastmod 2026-04-28` regardless of content. |
| T-07 | M | Homepage, `/uae`, `/blog` | `VisaCard` bypasses `next/image` with a raw `<img>` and an eslint-disable — no `width`/`height`, unoptimised Cloudinary original. `packages/frontend-shared/src/components/cards/VisaCard.js:31-36` | 12 of 14 homepage `<img>` lack dimensions → CLS risk; full-size PNGs served. |
| T-08 | L | Visa detail pages | Hero `Image` uses `sizes="100vw"` on a constrained hero. `packages/frontend-shared/src/components/sections/v1/VisaHero.js:36-41` | Preload `imageSrcSet` advertises up to `w=3840`. `priority` **is** correctly set — LCP preload confirmed present. |
| T-09 | L | Site-wide | No `hreflang`, no geo signals; `.com` targeting UAE only. | No `alternate` tags in any fetched page. Blocks clean GCC expansion (`/ksa`, `/qa`) later. |

### Content & duplication

| ID | Sev | Affected | Root cause | Evidence |
|---|---|---|---|---|
| C-01 | **C** | `/uae/visa/schengen` | `pricingBreakdown[0]` retains pre-migration Travl tiers, never reconciled with `packages`. Separate CMS fields with no validation between them. | Packages: Basic 299 / Standard 598.99 / Concierge 699. Breakdown: `VisaWadi service fee = AED 499`, note reads *"Standard package shown; Express AED 899, Concierge AED 1,799"*. Tiers "Express"/"1,799" exist nowhere in `packages`. AE overlay `metaDescription` says "From AED 499"; homepage says "From AED 299". **Schengen is the only page with this mismatch** — france/germany/italy/spain/greece all correctly show 299 with matching notes. |
| C-02 | **C** | schengen, france, germany, italy, spain, greece | Package `features` sell four products the brand explicitly does not sell. Contradicts `apps/visawadi-frontend/CLAUDE.md`. | All three tiers list *"Return flight ticket (dummy, not confirmed)"*, *"Hotel reservation"*, *"9 days travel insurance"*, *"Day-by-day travel itinerary"*. |
| C-03 | **C** | `/uae/visa/schengen` | Package feature vs FAQ answer, same page. | Packages include the flight ticket; FAQ *"Is a flight reservation accepted by Schengen embassies and VFS?"* ends *"though you arrange the reservation itself separately."* Other destinations (UK, US, Canada) say only *"Guidance on the flight itinerary"* — **no conflict there**. |
| C-04 | H | 7 visa records + 3 posts say 27; homepage + 9 posts say 29 | Two independent content sources, never reconciled. 29 is correct. | Schengen page holds **both**: excerpt "One application, 29 European countries" and FAQ "all 27 Schengen member states". Wrong (27): schengen, france, germany, greece, italy, spain FAQs; `switzerland-visa-…`, `france-visa-…`, `proof-of-onward-travel-…`. Correct (29): `Providers.js:90` + 9 posts. |
| C-05 | H | france / germany / italy / spain / greece vs schengen | Country pages generated from one template with the name swapped. | Identical packages, identical fee tables (340/95/70), FAQs differing only by country name — e.g. *"A standard Schengen visa lets you move freely across all 27 Schengen states"* appears verbatim on 5 pages. |
| C-06 | H | 20 of 41 posts | No editorial rule enforcing a commercial link. | 20 posts have **zero** internal links to any `/visa` page. 36 posts link out to `travl.ae`. |
| C-07 | M | Blog corpus | — | **Zero** posts mention Saudi Arabia, ahead of a paid launch. |
| C-08 | M | `/uae/visa/saudi-arabia` | Record `metaTitle` includes the brand while the root layout template already appends `%s | VisaWadi`. Introduced by `apps/visawadi-backend/scripts/seed-saudi-visa.mjs`; every other record omits the brand. | Rendered title: `Saudi Tourist Visa for GCC Residents | VisaWadi | VisaWadi`. **This one is mine, from the seed script earlier today.** |
| C-09 | M | All visa detail pages | `VisaProcess` renders `steps.map` twice — desktop grid and mobile stack. `packages/frontend-shared/src/components/sections/v1/VisaProcess.js:25-26` and `:46-47` | Steps 01–05 appear twice in the DOM. **Only this component does it** — the other nine `sections/v1/Visa*` components render once. |

### Structured data

| ID | Sev | Affected | Root cause | Evidence |
|---|---|---|---|---|
| S-01 | H | Site-wide | `buildOrganization` has no `sameAs` or `telephone` support — `sameAs` is implemented only on `buildPerson`. `packages/frontend-shared/src/utils/schema.js:59,65,76` | Organization node has no `sameAs` despite three populated socials in `src/config/contact.js:10-14`, and no `telephone` despite `WHATSAPP_NUMBER` at `contact.js:2`. |
| S-02 | H | Site-wide | Address is an unconfirmed placeholder. `apps/visawadi-frontend/src/lib/schema.js:27-31` carries `// TODO: replace with VisaWadi's registered address once confirmed.` | `PostalAddress` has only `addressLocality`/`addressRegion`/`addressCountry`. No `LocalBusiness` node anywhere. |
| S-03 | H | All visa pages | `buildService` emits no `offers`. | No `Offer`, no `price`, no `priceCurrency` on any page. *Silver lining: because no price schema exists, C-01 has not yet been published as machine-readable misinformation.* |
| S-04 | M | `/about`, `/contact` | Pages don't call the schema builders. | **Zero** JSON-LD blocks on both. `/contact` is the only page naming a location ("Regus, DAFZ, Dubai") and it has no markup. |
| S-05 | M | `/privacy-policy`, `/terms-and-conditions` | — | `BreadcrumbList` only; no Organization/WebPage. |
| S-06 | M | `/blog`, `/faq`, legal pages | `og:image` points at `https://www.visawadi.com/og-image.png`, which **404s**. | Confirmed `404`, `content_type: text/html`. `logo-dark.png` and `favicon.png` return 200. |
| S-07 | M | `/`, `/uae`, `/about`, `/contact` | No `og:image` set, so Twitter falls back. | All four: `og:image` MISSING, `twitter:card = summary`. Visa pages correctly use `summary_large_image`. |
| S-08 | M | 35 posts | `dateModified` from bulk-script `updatedAt`. | All report `2026-08-23T11:44:30.612Z` — schema asserts the whole corpus was edited in the same second. |
| S-09 | L | Visa pages | No `HowTo` despite 5–6 structured process steps per page. | — |

### AEO / GEO & trust

| ID | Sev | Affected | Root cause | Evidence |
|---|---|---|---|---|
| A-01 | **C** | Site-wide | Every hard statistic is hardcoded in a shared, brand-neutral component — not CMS-editable, not sourced. `packages/frontend-shared/src/components/sections/v1/VisaTrust.js:12-25` | `"500+" Visas Processed`, `"98%" Approval Rate`, `"3 min" Avg. Response Time`, `"2024" UAE Licensed / DAFZ-registered office`; subtitle at `:33` claims *"A licensed Dubai team"*. **No source, licence number or evidence exists anywhere in the repo or CMS.** |
| A-02 | H | 7 visa records | Approval-rate claim stored per-record in FAQ answers. | *"Applicants typically see an 85–90% approval rate…"* on schengen, france, germany, greece, italy, spain. Unsourced. |
| A-03 | H | All visa pages | Fee amounts have no verification date field in the schema. | AED 340 embassy / 95 VFS / 70 biometric carry notes but **no last-verified date**. Contrast the checker, which does have `lastVerifiedAt`. |
| A-04 | H | Whole checker | `VisaCheckerInline` is `'use client'` and fetches only on interaction; no server-rendered route exposes rule data. `packages/frontend-shared/src/components/ui/v2/VisaCheckerInline.js:1` | **35** `visa-rules` records, **35/35** with `officialSourceUrl`, **35/35** with `lastVerifiedAt`. Entirely invisible to crawlers. Covers AT, SA, TR, US, GB, CA + all Schengen. |
| E-01 | H | Site-wide | `ADDRESS = null`, `GMB_URL = null`. `apps/visawadi-frontend/src/config/contact.js:7-8` | No name, address or phone rendered anywhere, while A-01 claims a licensed DAFZ office. Trust gap and schema gap. |
| E-02 | M | `/uae/visa/schengen` | Four testimonials stored with full names, nationality and `rating: 5`; rendered as initials only. | **Not** marked up as `Review`/`AggregateRating` — so no current policy violation. Flagged because the ratings sit in the DB ready to be exposed. |

---

## 4. Prioritised remediation plan

### High — blocks indexation, splits authority, contradicts itself, or blocks the Saudi launch

| # | Change | Files | Effort | Impact | Risk of the fix |
|---|---|---|---|---|---|
| H1 | Clear the `noindex` on Saudi: publish the AE overlay, then **redeploy** so the slug enters `generateStaticParams`. Verify `curl … \| grep -c noindex` → 0 before spending a dirham. | overlay record; deploy | S | Unblocks the launch | None. Verify after deploy, not before. |
| H2 | Make the noindex structurally impossible: set `htmlLimitedBots` or force non-streamed metadata for `[country]/visa/[slug]`, so a page published between deploys is never emitted with `noindex`. | `next.config.mjs`, `[slug]/page.js` | M | Prevents silent recurrence on every future page | Streaming metadata off = marginally slower TTFB. |
| H3 | Reconcile Schengen pricing. Decide the real tiers, rewrite `pricingBreakdown`, drop the "Express/1,799" note, fix the overlay `metaDescription` ("From AED 499"). | CMS record + AE overlay | S | Removes the worst public contradiction | Commercial decision — needs your real prices. |
| H4 | Resolve the flight-ticket contradiction on all 6 Schengen-family pages: either stop listing dummy tickets/hotels/insurance/itineraries as included, or change the FAQ. Per `CLAUDE.md` these are not VisaWadi products, so removing them is the consistent call. | CMS `packages[].features` | M | Removes contradiction + brand/product integrity | Changes the advertised offer; confirm before editing. |
| H5 | Fix 27 → 29 across 6 visa FAQs and 3 posts. | CMS | S | Removes the citation-level factual error | Low. Recheck the Schengen roster at edit time. |
| H6 | Repoint all 22 internal links from `/visa/*` to `/uae/visa/*`. Keep the 308s for external links. | `Providers.js:42-127`, `page.js:163`, `not-found.js:51`, `VisaCard.js:25`, `VisaCheckerInline.js:21` | S | Ends redirect hops on every internal visa link | `VisaCard`/`VisaChecker` are shared — parameterise rather than hardcode `/uae`. |
| H7 | Either substantiate or remove every hardcoded statistic and the licensing claims. | `VisaTrust.js:12-25,33`; 6 CMS FAQ answers | S | Legal/advertising exposure, and AEO trust | Removing them weakens the page; substantiating is better if evidence exists. |
| H8 | Add the Saudi page to the sitemap and link it from `/uae` and the homepage. Follows automatically from H1. | overlay record | S | Ends the orphan | None. |

### Medium — schema, cannibalisation, on-page

| # | Change | Files | Effort | Impact | Risk |
|---|---|---|---|---|---|
| M1 | Add `LocalBusiness` with full NAP, plus `sameAs` and `telephone` on `Organization`. Requires the real address (see §6). | `utils/schema.js:59-76`, `lib/schema.js:27-31`, `config/contact.js:7-8` | M | Biggest single trust/entity win | Do not publish an address you cannot stand behind. |
| M2 | Decide the country-page strategy: differentiate france/germany/italy/spain/greece with genuinely local content (consulate, BLS vs VFS, appointment reality), or consolidate into Schengen with 301s. | CMS | L | Resolves the main cannibalisation | Consolidating sheds URLs — measure impressions first. |
| M3 | Ship a real `og-image.png` and set `og:image` on `/`, `/uae`, `/about`, `/contact`. | `public/`, page metadata | S | Fixes 4 missing + 2 broken | None. |
| M4 | Server-render the checker data as indexable pages (e.g. `/uae/visa-requirements/<destination>`) with source link and verified date. | new route + service | L | Turns 35 verified records into the site's most citable asset | New URLs — plan templates to avoid thin pages. |
| M5 | Add `/faq` to the sitemap; derive tag `lastmod` from real post dates; stop using bulk-script `updatedAt` as `dateModified`. | `sitemap.js:11-22,47,80` | S | Restores freshness signals | None. |
| M6 | Add JSON-LD to `/about` and `/contact`; complete the legal pages. | those routes | S | Entity clarity | None. |
| M7 | Fix the doubled Saudi title (drop `\| VisaWadi` from the record's `metaTitle`). | CMS record | S | — | None. This is my error from the seed script. |
| M8 | Add a last-verified date to fee data, mirroring `visa-rules.lastVerifiedAt`. | `packages/domains/visa/src/schemas/visa.schema.js` | M | Citation trust | Schema change + backfill. |

### Low — polish and long-term

| # | Change | Files | Effort | Impact |
|---|---|---|---|---|
| L1 | Render `VisaProcess` steps once and restyle responsively instead of two DOM copies. | `VisaProcess.js:25-47` | S | Halves duplicated step text |
| L2 | Move `VisaCard` to `next/image` with dimensions. | `VisaCard.js:31-36` | S | CLS + payload |
| L3 | Tighten hero `sizes` from `100vw`. | `VisaHero.js:41` | S | Stops 3840w fetches |
| L4 | Internal-link pass: give the 20 orphaned posts a commercial link. | CMS | M | Distributes authority |
| L5 | Build Saudi content cluster before scaling paid spend. | CMS | L | Organic support for the launch |
| L6 | Add `HowTo` to process steps. | schema builders | S | Rich-result eligibility |
| L7 | Plan `hreflang`/country strategy before `/ksa` launches. | routing | M | Avoids retrofitting |

---

## 5. Claims in the brief that did not reproduce

Stated explicitly, as instructed.

1. **"Both `/visa/schengen` and `/uae/visa/schengen` render successfully" — did not reproduce.** `/visa` and `/visa/:slug` are 308 permanent redirects configured at `next.config.mjs:19-20`. Live: `/visa/schengen` → 308 → `/uae/visa/schengen`; `/visa` → 308 → `/uae`. There is **no duplicate rendering and no duplicate indexation risk**. The real issue is narrower: 22 *internal links* still point at the legacy path (T-03). You may have observed this before the redirects deployed.
2. **Middleware silently ignored under `output: 'standalone'` — not applicable.** VisaWadi has **no** middleware or `proxy.js` file; `apps/visawadi-frontend/CLAUDE.md` claims one exists and is out of date. Apex→www is a `next.config.mjs` redirect and works (`visawadi.com` → 308 → `www`). Trailing slashes normalise correctly. No chains, no loops.
3. **"Roughly 200 destination records" in the checker — actually 35.** Quality is higher than assumed: 35/35 have `officialSourceUrl` and `lastVerifiedAt`. The conclusion stands, and gets cheaper: exposing 35 pages is far more tractable than 200.
4. **"No Saudi Arabia landing page" — no longer true, and that is now the problem.** A `saudi-arabia` record was created earlier today and its base has since been published; the page is live, orphaned and `noindex`ed (T-01, T-02). **Austria is confirmed absent** from both routes and CMS, though `visa-rules` does hold an `AT` record.
5. **Duplicated DOM — confirmed but narrower than feared.** Only `VisaProcess` does it. The other nine `sections/v1/Visa*` components render once.
6. **`og:image` — confirmed and wider.** Missing on 4 routes, and *broken* (404) on 3 more that reference a non-existent `og-image.png`.

**Better than expected:** alt-text coverage is 100% across every page sampled; all 14 outbound `travl.ae` links return 200; BlogPosting/Person/ProfilePage schema is correctly wired with `@id` references; canonicals are correct and self-referencing on all 12 routes checked; the LCP hero image *is* preloaded with `priority`.

### Not verified

- **Whether Google has actually indexed both URL variants** — needs Search Console; I have no access.
- **Core Web Vitals field data** (LCP/CLS/INP) — I inspected markup and payload only. No CrUX or Lighthouse run.
- **Whether the 301s from `travl.ae` are still single-hop** — I confirmed `travl.ae` targets return 200, but did not test old Travl *visa* URLs, which I don't have a list of. Worth a pass.
- **Rendered `/blog` pagination and tag-page depth** beyond one sample of each.

---

## 6. Open questions

1. **Licensing.** What is the registered entity name and trade-licence number behind "2024 UAE Licensed" and "DAFZ-registered office"? Until answered, A-01 and E-01 cannot be fixed correctly — only removed.
2. **The statistics.** Are "500+ visas processed", "98% approval rate" and "3-minute response time" measured, and from what? If they're aspirational they should come down now, before more pages inherit them.
3. **85–90% approval rate.** Same question, and it appears on 6 pages. Is there a source, or is it an industry estimate? If estimated, it needs hedging language that the house style otherwise discourages.
4. **Schengen pricing.** Which set is real — 299/598.99/699 or 499/899/1,799? I can reconcile the data once you tell me; I will not guess at your prices.
5. **Do the packages actually include flight reservations, hotel bookings, insurance and itineraries?** `CLAUDE.md` says VisaWadi doesn't sell these; six live pages advertise them as included. Which is right?
6. **Address.** Is the "Regus, DAFZ, Dubai" on `/contact` the address you want published as NAP and in `LocalBusiness`? Nothing else in the codebase corroborates it.
7. **Testimonials.** Are the four Schengen testimonials real and consented? They must be before any `Review` markup is considered.
8. **Country pages.** Do you want to invest in differentiating the five Schengen country pages, or consolidate? This decides M2 and is the biggest content-strategy call on the list.
9. **Fees.** When were AED 340 / 95 / 70 last verified? They are the most-cited numbers on the site.

---

*Audit performed 31 Aug 2026 against production (`www.visawadi.com`), commit `222d6b5` plus an uncommitted working tree, and the live `visawadi` MongoDB. Read-only: no code, content or configuration was changed.*
