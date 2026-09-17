---
name: seo-aeo-geo-audit
description: Run a complete read-only technical SEO, AEO and GEO audit of a web project from both the codebase and live rendered pages, producing a scored report with a ranked fix list. Use this whenever the user asks about search rankings, organic traffic, indexing problems, sitemaps, canonicals, structured data or schema, page titles and meta descriptions, internal linking, content or blog audits, keyword cannibalisation, Google Search Console data, or whether a site is set up to be cited by AI assistants and LLMs. Also use it when the user describes a symptom like "we rank but nobody clicks", "impressions are up but traffic is flat", "our pages aren't getting indexed", "ChatGPT never cites us", or "traffic dropped after we moved the site", even if they never say the words SEO or audit.
---

# SEO / AEO / GEO Audit

A read-only audit run from the codebase AND from live rendered pages you serve yourself, producing a scored report and a ranked fix list.

Two things separate this from a generic SEO checklist. It measures the live rendered output rather than the source, which catches metadata and schema that never reach the page. And it audits for AI citation (AEO/GEO) as a first-class concern, not an afterthought.

## Step 1: Fill the INPUTS block with the user

Read `references/inputs-template.md` and work through it. Most fields can be inferred from the codebase, but three must come from the user:

- **HOUSE FACTS** — the claims that must be true everywhere, so contradictions can be flagged
- **GSC EXPORT PATH** — if they have one; the audit is substantially weaker without it
- **KNOWN SYMPTOM** — what made them order this audit

Ask for these in one batch. Infer the rest and show your inferences for correction.

HOUSE FACTS is the field that turns a checklist into an audit. Pricing, what is and is not sold, what the product does and does not do, guarantee terms, which services are live versus roadmap. Without it you cannot catch the contradictions, and contradictions are what damage both conversion and AI trust.

Treat KNOWN SYMPTOM as a hypothesis to test, not as fact.

## Step 2: Declare your instruments before any finding

State plainly, at the top of the report:

- **Do you have a real browser** (headless, MCP, or otherwise)? If NO, you cannot measure Core Web Vitals, check tap targets, or verify visual rendering. Say so, and score only what was verified.
- **Can you reach the GSC export** and any other data named in INPUTS?
- **Can you reach the live production domain**, or only local?

Never present an inferred finding as a measured one. If you did not render it, do not write "the user sees".

## Step 3: Bring up the environment yourself

Start the frontend and backend dev servers. Note local URLs. Record branch and commit so the report states exactly what was measured. Live checks then run against the working tree and match the audited code.

If a server fails to start, say so and mark dependent checks "not verified". Shut everything down cleanly when finished. Do not disturb servers you did not start.

**Check whether dev and production share a database before touching anything.** If they do, say so in the report. It changes what any follow-up fix script can safely do, and it means there is no safe rehearsal.

## Step 4: Run the phases

Read `references/phases.md` and work through them in order:

0. Discover the stack and enumerate every route
1. Technical SEO (indexability, sitemap, canonicals, performance, rendering, crawl hygiene, structured data)
2. On-page SEO, one row per page
3. Content and blog audit, one row per post, then collection-level
4. AEO / GEO: AI answer and citation readiness
5. Internal linking and equity flow
6. GSC-informed opportunities (only if an export was provided)

If the site was recently migrated, split, rebranded, or moved domains, ALSO read `references/migration-audit.md` and run it as Phase 1.5. Signals that you need it: 301 rules in config, a sister brand in the monorepo, redirect maps, or the user mentioning a move, split or rebrand.

Skip a phase entirely if its inputs are missing. Deleting a phase beats letting it produce filler.

## Step 5: Score and rank

Score five buckets, each out of 100, then a weighted overall. State the weights. Add a sixth, Migration Integrity, if Phase 1.5 ran.

- Technical SEO
- On-page SEO
- Content and Blog
- AEO / GEO
- Internal Linking

Justify each in two or three lines with the specific findings that drove it. If a bucket could not be fully assessed, say so and score only what was verified.

**Do not penalise a young domain for low absolute traffic.** Score the fundamentals. A four-week-old site with 25 clicks is not failing; it is new. Say so explicitly so the number is not misread.

**Never present a projected score as a measured one.** If fixes have been shipped but their effect has not been observed, the new score is projected and the report must label it projected. Scoring "the fix list is closed" is not the same measurement as scoring observed live behaviour, and putting both in one before-and-after table implies they are.

## Step 6: Write the fix list

One master table: Issue | Affected pages/scope | Category | Impact | Effort | Fix summary.

Rank high to low by impact. Tie-breakers in order: live bugs and factual or credibility errors outrank pure optimisations; at equal impact lower effort ranks higher; fixes that unblock others rank higher.

Judge impact across rankings, AI presence and conversion together, and note which of the three each fix serves.

Where a fix is a copy change, write the actual replacement copy. Where it is a schema change, write the actual fields.

End with a "Top 10 highest-leverage fixes" shortlist.

## The no-invention rule

Every number, price, quote and claim must come from the codebase, a live check you performed, or a source given in INPUTS.

If you cannot verify a figure, write that you cannot. Do not estimate search volume, invent a benchmark, cite an industry average, or build a comparison table from numbers you could not source. If aggregators disagree and no primary source is reachable, report the disagreement and flag it for manual checking. A confident fabricated table is worse than an acknowledged gap, because it will get published.

If a source URL you want to cite returns an error or blocks automated requests, say so and tell the user to open it by hand before shipping. A dead citation on a page whose purpose is provenance is worse than no citation.

## Verify what other scripts claim

If the repo contains existing fix or migration scripts, do not trust their success reports. Check what fields they actually read and write. A script that greps only one content field while the stale values live in three others will report success having changed nothing, and everything it ever "verified" is unverified.

## Output

Write ONE report to `docs/audits/<BRAND>-SEO_AUDIT-<DD-MM-YYYY>.md` and create the directory if needed.

Start with: environment audited (local URLs, branch, commit), what instruments you had, what was and wasn't checked, and the date. Then an executive summary: the sub-scores, the overall, and the top 10 fixes. Then the detailed phases.

Use tables for per-page, per-post, redirect mapping and the fix list. Tight prose, no filler, no em dashes.

Modify no other file. This is read-only.

At the end of the run, print to the console: the report path, the sub-scores plus overall, and the top 3 fixes, so the user has them without opening the file.
