# DT365 Audit Correction Note

**Run date:** 06-09-2026
**Supersedes:** the affected sections of `DT365-SEO_AUDIT-06-09-2026.md`. That report is not modified.
**Mode:** read-only. No code, content or database writes were made by this run.

## Why this note exists

The same audit prompt was run on the sibling brand MDT and produced two findings that turned out to be errors in the auditor's own extractor: "zero in-article internal links across all blog posts" and "no outbound citations to authoritative external sources anywhere". Both were artefacts of a regex that matched only root-relative `href="/..."` values. Because DT365 was audited with the same prompt, both findings were treated as suspect here and re-verified from scratch.

**Headline: neither error occurred in the DT365 audit.** The DT365 run used a broader extractor and its link and citation numbers reproduce exactly. Two smaller, unrelated inaccuracies were found and are corrected below.

---

## 1. Baseline used

| Item | Value |
|---|---|
| Branch | `seo/audit-fixes-batch-1` |
| HEAD | `0018cb5` |
| Audit's stated baseline | `master` @ `0018cb5` (same commit) |

The working tree is **not** a valid baseline. A concurrent session has been applying DT365 fixes and its work is uncommitted.

### Uncommitted DT365 changes from the other session

**Modified (17 files):** `src/app/admin/login/page.js`, `air-france-dummy-ticket/page.js`, `dummy-ticket-australia-visa/page.js`, `dummy-ticket-canada-visa/page.js`, `dummy-ticket-japan-visa/page.js`, `dummy-ticket-schengen-visa/page.js`, `dummy-ticket-uk-visa/page.js`, `faq/page.js`, `flight-itinerary/page.js`, `lufthansa-dummy-ticket/page.js`, `onward-ticket/page.js`, `page.js`, `privacy-policy/page.js`, `sitemap.js`, `turkish-airlines-dummy-ticket/page.js`, `src/data/faqs.js`, `src/lib/schema.js`.

**Untracked:** `apps/dt365-backend/backups/`, `apps/dt365-backend/scripts/seo-wave2-fixes.mjs`, `apps/dt365-backend/scripts/backfill-delivery-status.mjs`, one delivery-status backup JSON, `apps/dt365-frontend/src/app/authors/`.

Nothing from the DT365 fix effort is committed. Every DT365 change listed above is working-tree only.

### Which state each finding is measured against

| Source | Baseline used | Confidence |
|---|---|---|
| Frontend page files, routes, config | `git show 0018cb5:<path>` | Exact. Git is authoritative. |
| Blog post bodies (21 posts) | `apps/dt365-backend/backups/blog-backup-2026-09-06T07-55-27-826Z.json` | **Good, with a caveat.** See below. |
| Current DB (for reconciliation only) | live `dummyticket365` database, read-only | Current, already modified by the other session. |

**Blog content has no git history.** It lives in MongoDB, so the only recoverable pre-fix state is the backup the other session's own script wrote immediately before its writes. That backup is the baseline used for every link and citation number in this note. It is trustworthy for this purpose because it still contains all 35 broken links the audit reported, which confirms it predates the repair. It cannot be proven to predate *every* earlier wave of the fix effort, so it is reported as "pre-wave2, believed to match the audited state" rather than as a git-verified baseline.

The live database is reported separately and labelled **current, already modified**. It is never presented as the baseline.

---

## 2. Finding 1: in-article internal links

**Original claim in the DT365 audit:** not the MDT claim. The DT365 report states that blog content carries **151 editorial links of which 35 (23%) resolve to 404**, across 8 distinct dead targets, and it names the three worst-hit targets as the #1, #4 and #6 posts by clicks.

**Verified reality: the audit was right.** An independent extractor was written that deliberately matches every anchor form the MDT run missed: root-relative, `./`, `../`, `../../`, `../../../`, absolute same-domain, absolute cross-domain, protocol-relative `//host`, `#` and empty placeholders, markdown `[text](url)`, and anchors inside HTML stored in DB fields. Relative paths were resolved the way a browser resolves them from `/blog/<slug>`, which was checked against `next.config.mjs` at `0018cb5` to confirm `trailingSlash` is not set, so the base directory is `/blog/` and `../x` resolves to `/x`.

| Metric | Audit | This run | Match |
|---|---|---|---|
| Total in-article anchors | 151 | **151** | exact |
| Resolve to a live 200 | 116 | **116** (100 internal + 16 external) | exact |
| Resolve to 404 | 35 | **35** | exact |
| Distinct dead targets | 8 | **8** | exact |
| `#` or empty placeholders | not reported | **0** | n/a |
| Cross-brand external | not reported | **0** | n/a |
| Third-party external | 14 posts claimed | **16 links / 9 posts** | see section 3 |

### Per-post detail (baseline: pre-wave2 backup)

| Post | Anchors | 200 | 404 | Placeholder | Money-page | Cross-brand | Third-party |
|---|---|---|---|---|---|---|---|
| what-is-a-gds-system-in-the-airline-industry | 7 | 7 | 0 | 0 | 5 | 0 | 0 |
| dummy-ticket-not-verifiable-on-airline-website-heres-why | 6 | 4 | 2 | 0 | 4 | 0 | 0 |
| dummy-ticket-vs-refundable-ticket-which-is-safer | 3 | 3 | 0 | 0 | 2 | 0 | 0 |
| can-a-dummy-ticket-cause-visa-rejection | 4 | 2 | 2 | 0 | 2 | 0 | 0 |
| what-documents-prove-onward-travel-to-immigration | 6 | 4 | 2 | 0 | 3 | 0 | 1 |
| can-border-officers-call-airlines-to-verify-tickets | 7 | 4 | 3 | 0 | 4 | 0 | 0 |
| flight-reservation-expires-before-visa-approval-heres-what-to-do | 7 | 4 | 3 | 0 | 4 | 0 | 0 |
| why-free-dummy-tickets-are-dangerous-for-visa-applications | 5 | 2 | 3 | 0 | 2 | 0 | 0 |
| what-is-a-flight-itinerary-for-a-schengen-visa | 9 | 7 | 2 | 0 | 4 | 0 | 1 |
| do-embassies-verify-flight-reservations-through-gds | 9 | 5 | 4 | 0 | 4 | 0 | 1 |
| schengen-visa-travel-plan-documents-full-checklist | 6 | 4 | 2 | 0 | 4 | 0 | 0 |
| what-happens-if-you-submit-a-fake-flight-ticket | 10 | 6 | 4 | 0 | 5 | 0 | 1 |
| should-you-buy-a-flight-ticket-before-visa-approval | 7 | 5 | 2 | 0 | 4 | 0 | 1 |
| how-much-do-dummy-tickets-usually-cost | 6 | 4 | 2 | 0 | 4 | 0 | 0 |
| how-to-book-a-multi-city-dummy-ticket-for-a-visa | 6 | 4 | 2 | 0 | 4 | 0 | 0 |
| visa-dates-dont-match-your-flight-reservation-read-this | 7 | 7 | 0 | 0 | 2 | 0 | 2 |
| can-you-use-a-dummy-ticket-at-airport-check-in | 7 | 7 | 0 | 0 | 2 | 0 | 0 |
| can-you-use-a-dummy-ticket-for-visa-extensions | 11 | 11 | 0 | 0 | 3 | 0 | 2 |
| can-you-use-a-dummy-ticket-for-work-visa-applications | 11 | 10 | 1 | 0 | 4 | 0 | 4 |
| is-it-safe-to-share-passport-details-for-a-dummy-ticket | 9 | 8 | 1 | 0 | 2 | 0 | 3 |
| what-is-a-pnr-in-flight-reservations-and-how-does-it-work | 8 | 8 | 0 | 0 | 2 | 0 | 0 |
| **Total** | **151** | **116** | **35** | **0** | **70** | **0** | **16** |

### Verdict

**The audit's in-article link finding was right.** The real number is 151 anchors with 35 dead, exactly as reported. The MDT-class extractor error did **not** occur in the DT365 run. DT365 also has none of the two secondary defects that MDT had: zero `#` placeholders and zero cross-brand links in blog content.

### Defect classification, which the audit did not break out

The audit reported the 8 dead targets but not *why* they were dead. There are two distinct causes, and they need different fixes:

**Class A: correct slug, wrong relative depth (24 of 35 links).** The target post exists. The link writes `../<slug>`, which from `/blog/<slug>` resolves to `/<slug>` and drops the required `/blog/` segment.

| Broken target | Links | Intended target | Post exists? |
|---|---|---|---|
| `/dummy-ticket-not-verifiable-on-airline-website-heres-why` | 10 | `/blog/dummy-ticket-not-verifiable-on-airline-website-heres-why` | Yes |
| `/can-a-dummy-ticket-cause-visa-rejection` | 9 | `/blog/can-a-dummy-ticket-cause-visa-rejection` | Yes |
| `/why-free-dummy-tickets-are-dangerous-for-visa-applications` | 5 | `/blog/why-free-dummy-tickets-are-dangerous-for-visa-applications` | Yes |

**Class B: slug does not exist in any form (11 of 35 links).** The link invents a slug the corpus never used.

| Broken slug | Links | Actual slug |
|---|---|---|
| `what-is-a-gds-system-and-why-it-matters-for-visa-applications` | 7 | `what-is-a-gds-system-in-the-airline-industry` |
| `dummy-ticket-vs-refundable-ticket-which-is-safer-for-visa-applications` | 2 | `dummy-ticket-vs-refundable-ticket-which-is-safer` |
| `what-happens-if-your-visa-dates-dont-match-your-flight-reservation` | 2 | `visa-dates-dont-match-your-flight-reservation-read-this` |

**Class C: fragile relative paths that currently work (100 links, still present today).** Separate from the 35 dead ones. 84 links use `../../` and 16 use `../../../` from `/blog/<slug>`, where only `../` is needed. They resolve correctly today **only because browsers clamp `..` at the root**. They will break silently if the blog ever moves to a deeper path, if `trailingSlash` is enabled, or if posts are ever served from a nested route. The other session's repair converted the 35 broken ones to root-relative but left these 100 untouched. This is a new finding not in the original audit.

---

## 3. Finding 2: outbound citations

**Original claim in the DT365 audit:** not the MDT claim. The DT365 report states that **fourteen posts carry outbound citations to genuine authorities** and names EUR-Lex, `travel.state.gov`, `uscis.gov`, `gov.uk`, `home-affairs.ec.europa.eu`, `immigration.go.th`, `gdpr-info.eu` and `ico.org.uk`.

**Verified reality: 16 external links across 9 posts.** The domain list the audit gave is correct and complete. The count is not: the audit says fourteen posts, the real figure is nine posts carrying sixteen links. The audit appears to have conflated a link count with a post count.

| Post | Domain | Anchor text | Authoritative |
|---|---|---|---|
| what-documents-prove-onward-travel-to-immigration | travel.state.gov | Visa Waiver Program (ESTA) | Yes, US government |
| what-is-a-flight-itinerary-for-a-schengen-visa | eur-lex.europa.eu | EU Visa Code | Yes, EU primary law |
| do-embassies-verify-flight-reservations-through-gds | travel.state.gov | US embassies | Yes, US government |
| what-happens-if-you-submit-a-fake-flight-ticket | home-affairs.ec.europa.eu | Visa Information System (VIS) | Yes, European Commission |
| should-you-buy-a-flight-ticket-before-visa-approval | eur-lex.europa.eu | EU Visa Code | Yes, EU primary law |
| visa-dates-dont-match-your-flight-reservation-read-this | eur-lex.europa.eu | Article 15 of the EU Visa Code | Yes, EU primary law |
| visa-dates-dont-match-your-flight-reservation-read-this | gov.uk | UK's immigration rules | Yes, UK government |
| can-you-use-a-dummy-ticket-for-visa-extensions | immigration.go.th | Immigration Bureau | Yes, Thai government |
| can-you-use-a-dummy-ticket-for-visa-extensions | uscis.gov | Form I-539 | Yes, US government |
| can-you-use-a-dummy-ticket-for-work-visa-applications | uscis.gov | US H-1B | Yes, US government |
| can-you-use-a-dummy-ticket-for-work-visa-applications | eur-lex.europa.eu | Article 14(1) of Regulation EC No 810/2009 | Yes, EU primary law |
| can-you-use-a-dummy-ticket-for-work-visa-applications | travel.state.gov | US Department of State | Yes, US government |
| can-you-use-a-dummy-ticket-for-work-visa-applications | gov.uk | UKVI | Yes, UK government |
| is-it-safe-to-share-passport-details-for-a-dummy-ticket | gdpr-info.eu | General Data Protection Regulation (GDPR) | Yes, GDPR reference text |
| is-it-safe-to-share-passport-details-for-a-dummy-ticket | ico.org.uk | UK's Information Commissioner's Office | Yes, UK regulator |
| is-it-safe-to-share-passport-details-for-a-dummy-ticket | f5.com | SSL/TLS encryption | No, commercial vendor explainer |

By domain: `eur-lex.europa.eu` 4, `travel.state.gov` 3, `gov.uk` 2, `uscis.gov` 2, `home-affairs.ec.europa.eu` 1, `immigration.go.th` 1, `gdpr-info.eu` 1, `ico.org.uk` 1, `f5.com` 1.

The only outbound link in DT365 frontend source at `0018cb5` is `hotjar.com` in the privacy policy, which is a required processor disclosure, not a citation.

### Verdict

**The audit's "zero outbound citations" error did not occur here.** The DT365 audit correctly identified that citations exist and named the right sources. **Corrected number: 16 links across 9 posts, 15 of which are genuine primary authorities.** The claim of "fourteen posts" is a modest overstatement of breadth and should read "nine posts".

---

## 4. Cross-brand links

Swept for `mydummyticket.ae`, `travl.ae`, `visawadi.com`, `airportrides.com`, `emirateslimo.com` and `travelshield.ae` across blog content (all fields plus FAQ arrays), DT365 frontend and backend source at `0018cb5`, `packages/frontend-shared`, and the DT365 brand config.

| Location | Result |
|---|---|
| Blog post bodies, excerpts, quick answers, meta fields, FAQ arrays (21 posts) | **0 matches** |
| `apps/dt365-frontend` and `apps/dt365-backend` at `0018cb5` | **0 matches** |
| DT365 `Organization` schema `sameAs` | Clean. Points only to `facebook.com/dummyticket365` and `instagram.com/dummyticket365`. Added by the other session; contains no sibling brand. |
| Footer and nav | No sibling-brand references |
| `packages/frontend-shared/src/components/admin/SendReservationModal.js` | **1 instance, low severity.** See below. |

**The one hit is not a public-facing link.** `SendReservationModal.js` holds a brand lookup table keyed on `NEXT_PUBLIC_BRAND`, with a correct `dt365` entry pointing at `www.DummyTicket365.com`. The MDT strings appear only as the fallback default (`BRANDS[BRAND] || BRANDS.mdt`). DT365 resolves to its own domain at runtime, so no MDT URL reaches a DT365 customer. It is still a brand-neutrality smell in a shared package: a brand with no entry in the table would silently send email signed as MyDummyTicket. Reported, not changed.

**DT365 does not have MDT's problem.** The MDT corpus was linking out to `dummyticket365.com` twice from a blog post. There is no reciprocal link from DT365 back to MDT anywhere. The footprint risk is one-directional and lives on the MDT side, which has already been repaired.

---

## 5. Other pattern-matched findings re-verified

| Finding | Audit claim | Verified | Verdict |
|---|---|---|---|
| Orphan pages | "None. Every one of the 42 sitemap URLs has at least one inbound link." | Holds | **Stands** |
| Orphan posts | "None in the strict sense", two posts at exactly one working inbound | Holds, but the column label is misleading | **Stands, with a clarification** |
| Word counts | Per-post table | 5 posts spot-checked, **all exact to the word** | **Stands** |
| Em dashes | "at least 7 pages" | **38 occurrences across 17 files** | **Understated** |
| Pricing post omits its own tiers | "$13 / $20 / $23 appear nowhere" | $13 appears 9 times; $20 and $23 absent | **Partly wrong** |

### Orphan posts: clarification, not a contradiction

The audit's `In(ok)` column is labelled "working editorial inbound links" but counts template-driven inbound as well. `BlogPostPage` renders `BlogRelatedPosts`, plus tag chips and the `/blog` listing, so every post receives inbound links from the template regardless of editorial linking. That is why the audit reports 2 to 7 inbound per post.

Counting **in-body editorial links only**, the picture is much starker: **11 of 21 posts have zero editorial inbound links**, including `what-is-a-pnr-in-flight-reservations-and-how-does-it-work`, which the audit itself identifies as the top post at 93,026 impressions.

Zero-editorial-inbound posts: `dummy-ticket-vs-refundable-ticket-which-is-safer`, `schengen-visa-travel-plan-documents-full-checklist`, `should-you-buy-a-flight-ticket-before-visa-approval`, `how-much-do-dummy-tickets-usually-cost`, `how-to-book-a-multi-city-dummy-ticket-for-a-visa`, `visa-dates-dont-match-your-flight-reservation-read-this`, `can-you-use-a-dummy-ticket-at-airport-check-in`, `can-you-use-a-dummy-ticket-for-visa-extensions`, `can-you-use-a-dummy-ticket-for-work-visa-applications`, `is-it-safe-to-share-passport-details-for-a-dummy-ticket`, `what-is-a-pnr-in-flight-reservations-and-how-does-it-work`.

The audit's conclusion that there are no true orphans is correct. Its framing hides a real editorial-linking gap that is worth acting on.

### Em dashes: corrected figure

The audit said "at least 7 pages", which is hedged rather than false, but it materially understates the work. Scanning the literal character plus `&mdash;`, `&#8212;` and `&#x2014;` across all DT365 frontend source at `0018cb5` gives **38 occurrences across 17 files**: `onward-ticket` 8, `air-france-dummy-ticket` 4, `lufthansa-dummy-ticket` 4, `page.js` 3, `dummy-ticket-schengen-visa` 3, `turkish-airlines-dummy-ticket` 3, `dummy-ticket-uk-visa` 2, `privacy-policy` 2, and 1 each in `admin/login`, `blog/[slug]`, `blog/page`, `blog/tags/[slug]`, `dummy-ticket-australia-visa`, `dummy-ticket-canada-visa`, `dummy-ticket-japan-visa`, `components/RelatedPages.js`, `data/faqs.js`. Blog DB content holds **1** more.

No encoded entities were found, so the audit's narrower scan was not the cause; it simply reported a floor rather than a count.

### Pricing post: partly wrong, and this is the MDT-shaped error

The audit states the actual tiers "appear nowhere" in `how-much-do-dummy-tickets-usually-cost`. **`$13` appears 9 times**, including in a comparison table row that names Dummy Ticket 365 explicitly ("Budget dummy ticket (Dummy Ticket 365) | From $13"). A broad currency scan of the post finds `$0`, `$5`, `$13`, `$15 to $30`, `$30 to $50`, `$30 to $80`, `$50`, `$90`, `$100`, `$300 to $1,200+`. **`$20` and `$23` are genuinely absent in every currency form.**

This is the same class of error as the two MDT findings: an absolute "appears nowhere" claim that a narrower check would have caught. The corrected finding is that the post states its entry tier but omits the 7-day and 14-day tiers, which is a smaller and cheaper fix than the audit implies.

---

## 6. Impact on the original fix list

### Invalid, drop

None. No DT365 fix-list item rests on a phantom finding. This is the substantive difference from the MDT run.

### Changes priority or scope

| # | Item | Change |
|---|---|---|
| 1 | Repair the 35 broken internal links | **Already done** by the other session, verified below. Scope should extend to the 100 fragile `../../` links it left behind. |
| 10 | Trim over-length titles and metas | Unchanged, but the em dash element of item 23 is larger than stated |
| 23 | Em dashes in shipped copy | **Scope up: 38 occurrences across 17 files, not "7+ pages".** Effort still Low. Already applied by the other session. |
| n/a | Pricing post omits its tiers | **Scope down.** Only `$20` and `$23` are missing; `$13` is already stated in prose and in a comparison table. Reframe as "complete the tier table", not "add pricing". |

### Stands unchanged

Items 2 through 9 are unaffected. Specifically confirmed by this run: **8 of 11 money pages receive zero blog links**, and the list matches the audit exactly (`/dummy-ticket-canada-visa`, `/dummy-ticket-australia-visa`, `/dummy-ticket-japan-visa`, `/onward-ticket`, `/flight-itinerary`, `/air-france-dummy-ticket`, `/lufthansa-dummy-ticket`, `/turkish-airlines-dummy-ticket`). Blog-to-money distribution is `/` 43, `/dummy-ticket-schengen-visa` 15, `/dummy-ticket-uk-visa` 12, everything else 0.

### New, not in the original audit

| Item | Detail | Impact | Effort |
|---|---|---|---|
| 100 fragile over-deep relative links | 84 `../../` and 16 `../../../` from `/blog/<slug>` where `../` suffices. Work only because browsers clamp at root. Silent breakage if the URL structure ever changes. | Med | Low |
| 11 posts with zero editorial inbound | Masked by the audit's `In(ok)` column counting template links. Includes the top post by impressions. | Med | Med |
| `SendReservationModal` brand fallback | Shared admin component defaults to MyDummyTicket branding for any brand missing from its table. | Low | Low |

---

## 7. Reconciliation with the other session's work

Every DT365 change applied so far was verified against a real defect. **Nothing was built against a phantom finding.**

| Fix applied | Addressed a real defect? | Verification |
|---|---|---|
| `seo-wave2-fixes.mjs` href repair (8-entry `HREF_MAP`) | **Yes.** Targets exactly the 8 dead targets confirmed here, mapping each to a slug verified present. | Re-ran the link scan against the live DB: **151 anchors, 0 dead** (was 35). 116 to 135 working internal links. |
| Em dash removal from frontend copy | **Yes**, and the defect was larger than the audit stated | Baseline 38 across 17 files, now **0** |
| `Organization` schema `sameAs`, `telephone`, address | Yes, audit item 9 | Present in `src/lib/schema.js`, no cross-brand entries |
| Author entity and `/authors/` route | Yes, audit item 9 | New `src/app/authors/` route; `authorProfile` written to `admin-users` |
| `sitemap.js` changes | Yes, audit low-priority sitemap item | +18 lines |
| Blog and admin-user backups written before DB writes | Good practice | `apps/dt365-backend/backups/`, two files |

**Still outstanding, highest value:** the `QuickAnswer` component remains commented out on the landing pages. `dummy-ticket-schengen-visa/page.js` still has `// import QuickAnswer` at line 32 and `{/* <QuickAnswer` at line 222. That was fix #3 on the audit's top-10 and the largest single AEO item. It has not been applied.

**One thing to review rather than trust:** the wave2 script preserves `updatedAt` deliberately, with a comment explaining that bumping `dateModified` on 15 posts would be a false freshness signal. That is a sound call and worth keeping, but it means the corrected links ship without any freshness signal to Google. Given the audit separately flags an 80-day dormant blog, the two decisions interact and a deliberate re-publish may still be wanted.

---

## 8. Corrected sub-scores

The original DT365 sub-scores were **not** measured on bad data. The link scan reproduced exactly, and the word counts are exact to the word. Only two small corrections apply, both downward and both minor.

**Content & Blog: 68 to 66.** The audit credited "fourteen posts carry outbound citations". The real figure is nine posts. Citation breadth is a stated component of that score, and the corpus is 21 posts, so coverage is 43% rather than the 67% implied. The pricing-post finding moves slightly the other way (the post does state `$13`), which offsets part of the deduction. Net minus 2.

**Internal Linking: 52 to 50.** The 35 broken links, the 8 money pages at zero and the anchor-text findings are all confirmed, so the bulk of the score stands. Minus 2 for two things the original framing missed: 11 posts with zero editorial inbound (obscured by an `In(ok)` column that counted template links), and 100 structurally fragile relative paths that were not counted as a defect at all.

Technical SEO, On-page SEO and AEO/GEO are unchanged. The em dash undercount sits in AEO/GEO house style, but the audit already deducted for it and the correction is one of magnitude, not of kind.

| Bucket | Weight | Original | Corrected |
|---|---|---|---|
| Technical SEO | 25% | 72 | 72 |
| On-page SEO | 20% | 74 | 74 |
| Content & Blog | 20% | 68 | **66** |
| AEO / GEO | 20% | 66 | 66 |
| Internal Linking | 15% | 52 | **50** |

**Arithmetic.**

Original: (72 x 0.25) + (74 x 0.20) + (68 x 0.20) + (66 x 0.20) + (52 x 0.15)
= 18.00 + 14.80 + 13.60 + 13.20 + 7.80 = **67.40**, reported as 67.

Corrected: (72 x 0.25) + (74 x 0.20) + (66 x 0.20) + (66 x 0.20) + (50 x 0.15)
= 18.00 + 14.80 + 13.20 + 13.20 + 7.50 = **66.70**, reported as **67**.

**The overall score is unchanged at 67 / 100.** The DT365 audit's headline numbers stand.
