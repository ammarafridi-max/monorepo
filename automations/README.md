# Automations

Every scheduled job in the monorepo. One package, one entrypoint, one place to
look when something stops running.

```
pnpm --filter @travel-suite/automations automation list          # what exists
pnpm --filter @travel-suite/automations automation check         # validate targets
cd automations && node src/cli.mjs blog-generate --target travl --dry-run
```

## What runs

| Job | Target | Schedule | Workflow |
|---|---|---|---|
| `blog-generate` | travl | **paused** (hand-written batches scheduled to 2026-10-10) | `blog-travl.yml` |
| `blog-generate` | visawadi | **paused** (hand-written batch scheduled to 2026-10-11) | `blog-visawadi.yml` |
| `blog-generate` | thedt | **disabled** 2026-10-17 (queue written by hand and scheduled to 2026-10-26) | `blog-thedt.yml` |
| `blog-generate` | emirateslimo | **not enabled** (needs the admin secrets; manual draft runs only) | `blog-emirateslimo.yml` |
| `blog-generate` | picturesk | **not enabled** (needs the admin account + secrets; manual draft runs only) | `blog-picturesk.yml` |
| `blog-schedule` | travl | manual | — |
| `blog-schedule` | thedt | manual | — |
| `pricing-sync` | — | Mon + Thu 05:00 UTC | `pricing-sync-emirateslimo.yml` |
| `affiliate-payouts` | dt365 | 5th of the month 05:00 UTC | `affiliate-payouts-dt365.yml` |
| `affiliate-payouts` | mdt | 5th of the month 05:00 UTC | `affiliate-payouts-mdt.yml` |
| `meta-audiences` | dt365 | 1st of the month 06:00 UTC | `meta-audiences-dt365.yml` |
| `ads-profitability` | travl | manual (on demand) | — |

Travl's cron was off between 2026-07-19 and 2026-09-09, covered by a backlog that
ran out on 2026-08-28. It is back on against an insurance-only topic list running
to 2026-09-27: visa topics belong to VisaWadi now, and Travl's config fails a post
that offers visa assistance as a Travl service or links a `travl.ae/visa` URL.

The Dummy Ticket AE was added on 2026-09-23 with a ten-topic queue running to
2026-10-22. It publishes as a **draft** on the schedule rather than going live,
because the site had no blog before this and the first posts are worth reading
before anyone else does. Change the workflow default to `published` once the
voice is right. It sells its own products, so the config guards the opposite way
to VisaWadi's: it fails a post that offers visa assistance, prices a reservation
in USD, or names a sister brand.

`blog-generate` takes the first topic in `topics.json` that the site does not
already have a post for, so the file is a queue and `date` is the plan, not a
selector: a failed day is retried the next morning rather than skipped. Delete a
topic you no longer want, or the queue will write it before anything after it.

`affiliate-payouts` generates the previous calendar month's payouts, computed in
UTC, for the two brands running an affiliate programme. `--period YYYY-MM`
backfills a month that was missed. Generating is idempotent, so a retry or a
double cron fire creates no duplicates and re-claims nothing. The job never marks
a payout paid: recording payment stays a deliberate action in the admin UI.

`ads-profitability` answers whether one Google Ads campaign pays for itself. It
reads the campaign's daily spend, clicks, impressions and conversions straight
from the Ads API, pulls the brand's paid orders out of Mongo, and credits an
order to the campaign when its stored `utm_campaign` matches or when its `gclid`
appears in that campaign's clicks. `click_view` only retains 90 days, so days
older than that fall back to `utm_campaign` alone and the workbook says so. Days
are bucketed in the Ads account's own timezone, not UTC, so the rows line up with
what the Ads UI shows. Output is an `.xlsx`: a Daily tab with running totals and
a totals row, a Weekly tab, and a Notes tab recording every assumption the run
made. Only `PAID` orders count, so refunded and failed ones drop out. Spend is
dated by click and orders by payment, so a single day is not a strict cohort —
read the running totals, not one row.

```bash
node --env-file=.env.local src/cli.mjs ads-profitability --target travl \
  --campaign "Schengen Travel Insurance" [--from 2026-01-01] [--to 2026-11-02] \
  [--commission 0.3] [--utm extra-utm,another] [--no-gclid] [--out report.xlsx]
```

Pass `--campaign` with no value and the run prints every campaign in the account
with its id, which is the quickest way to find the exact name.

`meta-audiences` asks the backend to build the Meta advertising audience CSVs and
email them to the business owner. The job only triggers the endpoint: the backend
does the querying, the CSV writing and the sending, so the run prints the address
it went to and each file with its row count. It needs the same admin login as
`affiliate-payouts`, and it runs on the 1st rather than the 5th so the two never
contend.

Both blog targets carry the same machinery: a format per length tier, an official
citation allowlist, forbidden link patterns, content checks, and a per-topic
`slug` so the published URL is decided here rather than by the CMS.

## Layout

```
src/cli.mjs            the only entrypoint; CI and humans run the same command
src/registry.mjs       job -> module, plus the env each job needs
src/config-schema.mjs  validates every target at load
src/lib/               shared: Anthropic client, admin login, verification, formats
jobs/<job>/index.mjs   exports run({ target, dryRun, argv })
targets/<key>/         config.mjs + topics.json + site-context.md
```

## Adding an automation

1. Add a folder under `jobs/` exporting `run({ target, dryRun })`.
2. Add an entry to `JOBS` in `src/registry.mjs`, listing the env it needs.
3. If it is per-brand, add `targets/<key>/config.mjs` (plus `topics.json` and
   `site-context.md` for blog jobs). List the jobs it is for in `jobs` if it is
   not a target for every per-brand job.
4. Add a caller workflow — copy `blog-visawadi.yml`, change the cron and the
   `job`/`target` inputs. Do not copy the body; it lives in `_automation.yml`.

## Two rules worth keeping

**Every job supports `--dry-run`, and a dry run needs no credentials.** That is
what lets `automations-check.yml` exercise the real code path on every pull
request. `pricing-sync` is the exception: its dry run still reads the sheet and
the database, so it declares those in `dryRunEnv`.

**A failure opens a GitHub issue.** Labelled `automation-failure`, one per job,
reused on repeat so a broken cron comments rather than filing thirty issues. A red
tick in a tab nobody opens is not a notification — that is how Travl went quiet
for six weeks unnoticed.

## Secrets

Set as repository secrets; the reusable workflow passes them all through.

- `ANTHROPIC_API_KEY`, `RECRAFT_API_KEY` — blog generation
- `<TARGET>_ADMIN_EMAIL` / `<TARGET>_ADMIN_PASSWORD` — the target's admin login
- `<TARGET>_COOKIE` — `blog-schedule` only, an admin session cookie (that job also
  needs `blogSchedule` in the target's config: the first slot and any slugs to skip)
- `DT365_ADMIN_EMAIL` / `DT365_ADMIN_PASSWORD`, `MDT_ADMIN_EMAIL` / `MDT_ADMIN_PASSWORD` — affiliate payouts
- `MONGO_URI`, `PRICING_SHEET_ID`, `PRICING_SHEET_TAB`, `GOOGLE_SERVICE_ACCOUNT_JSON` — pricing sync

The model for blog generation defaults to `claude-sonnet-4-6` and can be
overridden per target with `model` in its config.
