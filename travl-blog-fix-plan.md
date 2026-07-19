# Travl blog fix — Phase 1 plan v2 (DRY RUN, nothing applied)

Updated 2026-07-19 with your decisions. Source of truth for live URLs:
`https://www.travl.ae/sitemap.xml` (generated dynamically from published blogs — see §0).
No changes have been made. Deliverables: this plan, `travl-blog-fix.mjs` (dry-run), and
`travl-duplicate-merge-why-you-need.md` (manual-merge aid). **Awaiting approval before Phase 2.**

## What changed from v1 (your decisions applied)

1. **Duplicate consolidation reversed to your chosen direction.** Canonical is now
   `why-travel-insurance-is-mandatory-...`; `why-you-need-...` is retired (301 → canonical,
   links repointed, dropped from sitemap). Manual content merge is a separate step you do.
2. **Itinerary policy changed from "add-alongside" to "replace cross-brand only."** The 16
   add-alongside `/travel-itinerary` insertions from v1 are **retracted** — per your rule,
   dummy-ticket paragraphs with existing DT365 links are left as-is. The only cross-brand
   external link found (mydummyticket.ae) is **replaced**, not supplemented.
3. **Citations OFF this run.** Flagged spots kept in §5 for a later pass.

Net effect: v1 would have changed 20 posts; **v2 changes 13** (fewer body edits, no
DT365-adjacent insertions).

---

## 0. Mode and CMS mechanics

**Mode: SCRIPTED — execution needs an admin cookie you supply (none in this env).**

| Concern | Where it lives | Mechanics |
|---|---|---|
| Post body HTML | CMS `content` field (TinyMCE HTML) | `PATCH /api/blogs/:id` `{content}`, cookie auth |
| `dateModified` | CMS `updatedAt` (Mongoose `timestamps`) | auto-bumps on any write (`blog/[slug]/page.js:99`) |
| Internal links | inside `content` | edited via body PATCH |
| **Sitemap** | `apps/travl-frontend/src/app/sitemap.js` | **dynamic**: pulls published blogs from the API, `lastmod = updatedAt`, `revalidate=3600` |
| URL redirects | `apps/travl-frontend/src/proxy.js` (middleware) | added in Phase 2 |

- **Read (public):** `GET /api/blogs?status=published&limit=100`. 28 published posts, 1:1 with sitemap.
- **Write:** `PATCH /api/blogs/:id` `{content}` — `protect` + `restrictTo('admin','blog-manager')`, cookie auth.
- **Freshness is automatic:** any post that gets a real edit is freshened to today; untouched posts are never bumped.
- **Sitemap drop is automatic once unpublished:** because `sitemap.js` lists only *published*
  blogs, setting `why-you-need` to `status:'draft'` (or deleting it) removes it from the sitemap
  **and** the public API within the hourly revalidate. No sitemap code edit needed.

---

## 1. Duplicate consolidation — why-you-need → why-is-mandatory (your decision)

- **Canonical (keep):** `why-travel-insurance-is-mandatory-for-a-schengen-visa-and-what-coverage-you-need` (id `69e06c214aec52ed14266a8c`, 691 words).
- **Retire:** `why-you-need-travel-insurance-for-your-schengen-visa-application` (id `69f455f838ba252e0c9018ad`, 1268 words).
- Both are currently live (200, in sitemap, published). why-you-need is the larger of the two,
  so it has real unique content to fold in first.

**Actions:**
- **Repoint all 7 internal links** to why-you-need → canonical (both `../../../` and absolute
  forms). Posts affected: `schengen-visa-fees`, `how-long`, `schengen-visa-rejection`,
  `schengen-visa-documents-checklist`, `schengen-visa-travel-insurance-requirements-minimum-coverage-explained`,
  `how-to-apply`, `pnr-codes`. (Anchor text is descriptive, e.g. "why travel insurance is needed…",
  and stays accurate against the canonical post, so text is unchanged.)
- **Add repo 301** (permanent): `/blog/why-you-need-...` → `/blog/why-travel-insurance-is-mandatory-...`.
- **Do NOT auto-merge body.** `travl-duplicate-merge-why-you-need.md` gives a section-by-section
  map plus paste-ready, link-fixed HTML for every why-you-need section and its unique FAQs, for you
  to fold in by hand. (The UNIQUE/OVERLAPS labels are title-based heuristics; the canonical's
  actual section list is printed at the top of that file so you can judge overlaps yourself.)
- **Drop from sitemap:** after the redirect is live, set why-you-need to `status:'draft'`
  (reversible; keeps the body as a backup) — it then disappears from sitemap + API automatically.
- **The script SKIPS why-you-need's body entirely** (it's being retired; editing it is pointless
  and would muddy your merge).

**Phase 2 sequence (your order):**
`1) manual content merge (you)` → `2) repoint links (script)` → `3) add 301 (repo)` →
`4) unpublish why-you-need → drops from sitemap`.

---

## 2. Internal link integrity

3 broken targets (all verified) + the consolidation repoint:

| Broken / retired target | HTTP | In sitemap | Repoint to | Instances |
|---|---|---|---|---|
| `/blog/...complete-2026-guide-2` | 200 **soft-404** (API 404) | no | `/blog/...complete-2026-guide` | 8* |
| `/blog/...minimum-coverage-explained-2` | 200 **soft-404** (API 404) | no | `/blog/...minimum-coverage-explained` | 5* |
| `/flight-itinerary` | **404 hard** | no | `/travel-itinerary` | 5 |
| `/blog/why-you-need-...` (consolidation) | 200 (retiring) | yes→removed | `/blog/why-travel-insurance-is-mandatory-...` | 7 |

*Counts exclude the instances inside why-you-need's own body (that post is retired, not edited).
All other internal targets across the corpus were HTTP-checked: 200 + in sitemap.

### Per-post repoint / consolidation map (what the script does — 13 posts)

| Post | Action(s) |
|---|---|
| proof-of-accommodation-... | flight-itinerary→travel-itinerary ×2 |
| bls-international-... | guide-2→guide; explained-2→explained; flight-itinerary→travel-itinerary |
| vfs-global-... | flight-itinerary→travel-itinerary ×2 |
| schengen-visa-interview-questions-... | guide-2→guide |
| schengen-visa-fees-... | **consolidate** why-you-need→canonical |
| how-long-... | guide-2→guide; explained-2→explained; **consolidate** why-you-need→canonical |
| schengen-visa-rejection-... | guide-2→guide; explained-2→explained; **consolidate** why-you-need→canonical |
| schengen-visa-documents-checklist-... | guide-2→guide; explained-2→explained; **consolidate** why-you-need→canonical |
| schengen-visa-travel-insurance-requirements-... | **consolidate** why-you-need→canonical |
| how-to-apply-...-complete-2026-guide | **consolidate** why-you-need→canonical; **cross-brand replace** (§3) |
| why-travel-insurance-is-mandatory-... (canonical) | count 26→29 (§4) |
| why-buying-a-real-ticket-... | guide-2→guide |
| pnr-codes-explained-... | guide-2→guide; **consolidate** why-you-need→canonical |

### 301 redirects to add in the repo (Phase 2) — `apps/travl-frontend/src/proxy.js`

Matches the existing redirect style in that file; matcher already covers `/blog/*` and `/flight-itinerary`. Permanent (301):

```js
const GONE = {
  '/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide-2':
    '/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide',
  '/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained-2':
    '/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained',
  '/flight-itinerary': '/travel-itinerary',
  '/blog/why-you-need-travel-insurance-for-your-schengen-visa-application':
    '/blog/why-travel-insurance-is-mandatory-for-a-schengen-visa-and-what-coverage-you-need',
};
if (GONE[pathname]) {
  return NextResponse.redirect(`https://www.travl.ae${GONE[pathname]}${search}`, 301);
}
```

**4 redirects.** The why-you-need → canonical 301 goes live only after your manual content merge.

---

## 3. Itinerary links — replace cross-brand only (your revised rule)

**Rule applied:** itinerary / flight-reservation intent → Travl `/travel-itinerary`;
dummy-ticket intent + existing `dummyticket365.com` links → **left as-is** (untouched).

- **v1's 16 "add-alongside `/travel-itinerary`" insertions are RETRACTED.** No new links are
  injected into DT365 paragraphs. All DT365 links stay exactly as they are.
- **Cross-brand sweep of all 28 posts** (every external host counted): only three hosts exist —
  `travl.ae` (90), `dummyticket365.com` (52), and **`mydummyticket.ae` (1)**. The single
  non-DT365 cross-brand link is replaced:

| Post | Current (cross-brand) | Replace with | Note |
|---|---|---|---|
| how-to-apply-...-complete-2026-guide | `<a href="https://www.mydummyticket.ae">order a flight itinerary from mydummyticket.ae</a>` | `<a href="../../../travel-itinerary">order a flight itinerary from Travl</a>` | href **and** visible brand name changed |

- Verified: the itinerary money-page slug is **`/travel-itinerary`** (sitemap + HTTP 200).
- The 5 `/flight-itinerary` (Travl's own, hard-404) links are itinerary intent → repointed to
  `/travel-itinerary` in §2. The 6 posts already linking `/travel-itinerary` are untouched.

**Tradeoff noted:** posts that carry DT365 links but no Travl money-page link now keep zero Travl
link (per your rule). If you later want Travl visibility there, that's the "add-alongside" pass we
can revisit — it is intentionally not in this run.

---

## 4. Schengen member-state count (→ 29)

Only the canonical post says 26; every other post already says 29.

| Post | Current | Fix |
|---|---|---|
| why-travel-insurance-is-mandatory-... | "travel zone across **26** European countries" | across **29** European countries |
| why-travel-insurance-is-mandatory-... | "Valid across all **26** Schengen member states" | all **29** Schengen member states |

Exact-phrase replacements only. No post says 27 or 28. (This edit also justifies the canonical
post's freshness bump on its own merits.)

---

## 5. Citations (E-E-A-T) — OFF this run, kept for a later pass

Per your decision `--include-citations` stays **OFF**; nothing is inserted. Flagged spots retained:

| Claim | Where | Proposed authoritative source | URL status |
|---|---|---|---|
| "EUR 30,000 minimum medical coverage" (~20 posts) | most Schengen posts | EU Visa Code **Article 15** | `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R0810` — **verified 200** |
| "15 calendar days / up to 45 days" processing | how-long, rejection, first-time, summer, vfs | EU Visa Code **Article 23** | same EUR-Lex doc — verified 200 |
| "EUR 90 adult visa fee" | schengen-visa-fees, bls | EU Visa Code **Article 16** (amended by Reg (EU) 2019/1155); EU Commission visa page | `https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en` — verified 200 |
| VFS/BLS service fees | vfs-global, fees, bls | `vfsglobal.com` / `blsinternational.com` | homepages verified 200; exact fee pages country-specific — confirm live URL before linking |
| "EUR 50–100/day" bank-balance ref; approval-rate stats | first-time | none reliable | **flag only, never link** |

No URL is fabricated. When you want this pass, the script inserts only the verified EUR-Lex
citation (marker-guarded, idempotent) behind `--include-citations`.

---

## 6. Freshness (dateModified)

**13 posts** get a real edit → `updatedAt` auto-bumps to today (2026-07-19) on PATCH. All others
are untouched (no fake-freshening). why-you-need is retired (unpublished), not freshened.

Freshened (13): proof-of-accommodation, bls-international, vfs-global, schengen-visa-interview-questions,
schengen-visa-fees, how-long, schengen-visa-rejection, schengen-visa-documents-checklist,
schengen-visa-travel-insurance-requirements-minimum-coverage-explained, how-to-apply,
why-travel-insurance-is-mandatory (canonical), why-buying-a-real-ticket, pnr-codes.

**Note:** the canonical post's `updatedAt` will bump again when you fold in the merged content —
that's a real edit, so it's legitimate.

---

## 7. Change-type summary (v2)

| Change type | Count | Posts |
|---|---|---|
| `-2` soft-404 + `/flight-itinerary` repoints | 14 groups | 10 |
| Duplicate consolidation repoints (why-you-need→canonical) | 7 | 7 |
| Cross-brand replace (mydummyticket.ae→/travel-itinerary) | 1 | 1 |
| Schengen count 26→29 | 2 phrases | 1 (canonical) |
| **Posts changed by script (→ freshened)** | — | **13** |
| Repo 301 redirects | 4 | (repo) |
| Manual content merge (you) | — | 1 (canonical ← why-you-need) |
| Unpublish (drop from sitemap) | — | 1 (why-you-need) |
| Itinerary add-alongside (retracted) | 0 | — |
| Citations | 0 (off) | later pass |

---

## 8. The migration script — `travl-blog-fix.mjs`

Dry-run by default. Verified output: **13 posts change**, why-you-need skipped.

```bash
node travl-blog-fix.mjs        # dry run (14 repoint-groups, 7 consolidations, 1 cross-brand, 2 count)
```

**Idempotent:** repoints/consolidations are exact-string replacements that no longer match after
the first pass; the cross-brand replace matches a full anchor string; count fixes target removed
phrases. A second `--apply` run is a no-op.

**Phase 2 (only after approval), in your sequence:**
1. **You** merge why-you-need's unique content into the canonical post using
   `travl-duplicate-merge-why-you-need.md`.
2. `export TRAVL_COOKIE="<admin session cookie>"` (no creds in this env).
3. Canary: `node travl-blog-fix.mjs --apply --only=how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide`
   → backs up original body to `travl-blog-backups/<id>.json`, patches, then I fetch it live to
   confirm links resolve + date updated, and show you the diff.
4. Full rate-limited batch (1.2s/PATCH), each backed up before writing.
5. Add the 4 repo 301s to `proxy.js` (uncommitted diff for your review — no push, no deploy).
6. Unpublish why-you-need (`PATCH /api/blogs/69f455f838ba252e0c9018ad {status:'draft'}`) →
   drops from sitemap + API on next revalidate.

Every post is backed up before it's patched, so every change is reversible. **No git push, no deploy.**

---

## Files in this deliverable

- `travl-blog-fix-plan.md` — this plan
- `travl-blog-fix.mjs` — dry-run migration script
- `travl-duplicate-merge-why-you-need.md` — paste-ready manual-merge aid for the consolidation
