# Audit archive

Point-in-time audits and discovery notes. Kept as a record, not as a to-do list.
Each one describes the repo or the site as it was on the date in its filename, and
none of them is maintained afterwards. Read the date first, and check any claim
against the current tree before acting on it.

Naming convention: `BRAND-TYPE_AUDIT-DD-MM-YYYY.md`. The brand casing is
inconsistent across older files and the dates are day-first, not ISO. Follow the
convention for new files; don't rename the old ones, since they are referenced by
name from the reports that supersede them.

| File | Scope |
|---|---|
| `TRAVL-SYSTEM_MAP-31-08-2026.md` | Whole-monorepo discovery audit, run to plan the visa-assistance product. **Superseded and badly stale**: it predates the brand split finishing and the late-2026 refactors, and it still describes `travelshield` as live. It carries a banner listing what is now wrong. Kept because it is the only snapshot of the pre-split architecture. |
| `DT365-SEO_AUDIT-06-09-2026.md` | DT365 technical SEO / AEO / GEO, from the code. |
| `DT365-AUDIT_CORRECTION-06-09-2026.md` | Corrections to the above, same day. Read both together; the original was deliberately left unmodified. |
| `MDT-SEO_AUDIT-06-09-2026.md` | MyDummyTicket technical SEO / AEO / GEO at `master` `0018cb5`. |
| `MDT-UX_AUDIT-13-09-2026.md` | MyDummyTicket UX and conversion walkthrough at `master` `a41ea75`. |
| `VisaWadi-SEO_AUDIT-08-09-2026.md` | VisaWadi SEO / AEO / GEO across frontend, backend and shared packages. |
| `VISAWADI-UX_AUDIT-12-09-2026.md` | VisaWadi UX and conversion walkthrough at `master` `a41ea75`. |
| `EMIRATESLIMO-SEO_AUDIT-15-09-2026.md` | Emirates Limo SEO / AEO / GEO against the live site. |
| `EMIRATESLIMO-UX_AUDIT-15-09-2026.md` | Emirates Limo UX and conversion walkthrough at `master` `ebeb506`. |
| `TRAVL-SEO_AUDIT-17-09-2026.md` | Travl SEO / AEO / GEO across all 83 live sitemap URLs plus redirect and error paths. |
| `TheDT-SEO_AUDIT-19-10-2026.md` | The Dummy Ticket AE SEO / AEO / GEO, from the code. |
| `Picturesk-SEO_AUDIT-10-09-2026.md` | Picturesk SEO / AEO / GEO, audited against local dev. |
| `PICTURESK-SEO_AUDIT-22-10-2026.md` | Picturesk SEO / AEO / GEO re-run on the `picturesk-design-pass` branch. Supersedes the 10-09 one. |
| `PICTURESK-UX_AUDIT-13-09-2026.md` | Picturesk UX and conversion walkthrough. |

Gaps, so you don't go looking: `airportrides` has no audit of any kind, and
`dt365`, `thedt` and `travl` have SEO audits but no UX one.

The Travl audits are worth keeping despite being stale: with the system map they
are the only before-and-after baseline for judging what the August 2026 brand
split did to Travl's traffic. The `travelshield` mentions in
`DT365-AUDIT_CORRECTION-06-09-2026.md` and the system map are the last ones left
in the repo, and they are historical, not live references.
