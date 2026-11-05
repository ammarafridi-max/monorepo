# Visa Applications — Schengen application system

A customer-facing visa application system, owned by **VisaWadi**
(`apps/visawadi-backend`, `apps/visawadi-frontend`, `packages/domains/visa-applications`).
Customers sign in with a magic link, answer a few profile questions, and upload their
own documents; staff produce the rest, review everything, and drive the application
through its lifecycle. Built on the domain factory pattern
(`schema → service → controller → router` via `index.js`).

It was first built in travl-backend, before the 2026-08 brand split moved all visa
assistance to VisaWadi. Travl mounts **no** visa routes now, so read any `travl` path
you find in older notes as `visawadi`. The one exception is in the data, not the docs:
generated `applicationRef` values still carry the `TVL-` prefix (see
`packages/domains/visa-applications/src/service.js`), so live refs look like
`TVL-2601-A7K3`.

This document describes the **current** model: a data-driven document registry. The
earlier config-driven checklist (a hardcoded `docType` enum plus
`checklist.config.js` and `checklistForApplicant`) is gone, and the notes that
described it have been removed from this file rather than left to mislead.

---

## Data-driven document registry (current model)

The checklist is no longer code. Which documents an application needs, who is
responsible for each, and the copy shown to customers all live in the database, so
adding UK/US visas — or renaming a label — is a **data change, not a deploy**.

### The two registry models
- **`DocumentType`** — one row per kind of document. Fields: `key` (stable uppercase id,
  e.g. `EMPLOYMENT_NOC`), `label` (editable), `customerHelpText`, `source`, `acceptedMimeTypes`
  (defaults pdf/jpeg/png), `isActive`, `sortOrder`.
  - **`source`** decides who handles it: **`CUSTOMER`** (the applicant uploads it),
    **`AGENT`** (staff produce and upload it — flight reservation, insurance, cover
    letter…), **`IN_PERSON`** (happens offline; staff just mark it done — the studio photo).
- **`ChecklistTemplate`** — one per `visaTypeKey` (`SCHENGEN` today). Holds `rules[]`,
  each `{ documentTypeKey, when, isOptional }`.

### Rule matching (`matcher.js` — pure, no DB, unit-testable)
A rule's `when` block is an object of conditions:
`ageGroup`, `employmentStatus`, `financialSupport`, `accommodationType`,
`minorTravellingWith` (arrays = a list of accepted values, OR), and `isPrimary` (boolean).
- **A rule applies when EVERY present condition matches. An absent condition matches
  anything.** A referenced condition whose value isn't known yet does not match (safe default).
- `evaluateTemplate(rules, ctx)` → the applicant's required document keys (a key required
  by any matching rule wins over an optional one).
- `deriveAgeGroup(dateOfBirth, travelDate)` → `ADULT`/`MINOR` — **derived, never stored**;
  under 18 at the intended travel date is `MINOR`.
- `neededProfileFields(rules, ctx)` → which profile questions must still be answered
  before we can seed, computed from the rules (not hardcoded). This is why a minor is
  never asked their employment status: once age is known, the adult-only rules stop being
  "potentially applicable," so employment drops out of the needed set.

The applicant profile fields that drive rules: `employmentStatus`, `financialSupport`
(`SELF`/`SPONSORED`), `minorTravellingWith`, plus derived `ageGroup`; and application-level
`accommodationType` (`HOTEL`/`HOST`) and `visaTypeKey`. **Seeding is blocked until every
referenced profile question is answered.**

### `ApplicationDocument`
`documentType` (ref) + `docTypeKey` (denormalised) + `source` (copied at seed time),
plus `satisfiedBy`, `addedManually`, `isOptional`, `note`, and everything kept from
before (`history[]`, `version`, `rejectionReason`, status, Cloudinary fields).
- **`satisfiedBy`** points at another applicant's uploaded document in the SAME
  application (a child's `PARENT_PASSPORT` → the father's `PASSPORT`; a sponsored spouse's
  `SPONSOR_BANK_STATEMENT` → her husband's `BANK_STATEMENT`). A satisfied row stores no
  file of its own, reads its status from the source row, and counts complete when the
  source is `APPROVED`.

### Reconcile (`reconcileChecklistForApplicant`)
Evaluates the template rules for the applicant and syncs rows. **Safety is unchanged:
never delete or alter an UPLOADED / APPROVED / REJECTED row, and never touch a
manually-added row.** Rows that no longer apply become `NOT_APPLICABLE`. Runs whenever a
profile answer changes (applicant-level or the application's accommodation/visa type).

### Two completeness numbers
Both ignore `NOT_APPLICABLE` in the denominator; a satisfied-by row counts complete when
its source is `APPROVED`. Stored on the application, recomputed on every document status change:
- **`customerCompletenessPercent`** — only `CUSTOMER` rows. What the **portal shows** and
  what the **reminder engine (Track A) uses**.
- **`fileCompletenessPercent`** — all rows regardless of source. The full VFS file, shown
  to admins.

### Staff-turn queue state
When `customerCompletenessPercent` reaches 100 but `fileCompletenessPercent` is still
below 100, the application is waiting on **staff**, not the customer. Tracked with three
fields set during `recalcCompleteness`:
- **`customerCompletedAt`** — when the customer's part first hit 100% (cleared if it later
  drops below). The **"Your turn"** admin queue (`?queue=your_turn`) filters on
  `customerCompletenessPercent === 100 && fileCompletenessPercent < 100` and **sorts by
  days since customer completed** (not customer silence, which is misleading here — the
  column is relabelled "Waiting").
- **`readyToSubmit`** — `fileCompletenessPercent === 100` AND every non-optional applicable
  row is effectively `APPROVED` (an IN_PERSON "marked done" and a satisfied-by row with an
  approved source both read as approved). The **"Ready to submit"** chip filters on this
  stored flag.
- **`customerCompleteNotifiedAt`** — a one-shot guard: the first time a file becomes the
  staff's turn, a **"this file is ready to prepare"** email goes to staff
  (`sendFileReadyForStaff`), claimed with the same atomic `findOneAndUpdate` pattern as the
  reminder sends, so it fires **exactly once per application**.

### CRITICAL: reminders only ever chase CUSTOMER rows
Track A candidates are filtered on `customerCompletenessPercent < 100`, and the "what's
missing" list is built from `source: 'CUSTOMER', status: 'REQUIRED', satisfiedBy: null`
only. **A customer is never chased for a flight reservation, insurance policy, cover
letter, or the in-person photo** — those are staff's job. Track B (rejections) likewise
only considers `CUSTOMER` rejected rows.

### Adding a new visa type later — no code change
1. Seed any new `DocumentType` rows (admin → Document Registry, or a seed script).
2. Create a `ChecklistTemplate` with the new `visaTypeKey` (e.g. `UK`) and its `rules[]`.
3. Set the application's `visaTypeKey` to that key.
The matcher, reconcile, portal, admin views, reminders and completeness all read the
data — nothing is hardcoded to Schengen.

### Seeding the registry
There is **no seed script** any more, and visawadi-backend has no `scripts/` directory.
Seed `DocumentType` rows and the Schengen `ChecklistTemplate` through the admin
Document Registry screen below, or write them straight to the database. Nothing works
until a template exists for the application's `visaTypeKey`.

### Admin registry screen
`/admin/document-registry` (admin only): manage `DocumentType` records and edit the
Schengen template rules. Endpoints: `GET/POST/PATCH /api/visa-applications/admin/document-types`,
`GET/POST /api/visa-applications/admin/templates`, `GET/PATCH /admin/templates/:id`,
`POST /admin/templates/preview`.

**Rule validation (a typo silently breaks seeding, so saves are validated).** On save the
registry service rejects the rules with a clear message naming the bad rule and field if:
every `documentTypeKey` doesn't resolve to an **active** `DocumentType`, a condition key
isn't one the matcher recognises, or a condition value isn't a valid enum for that
condition. The editor also shows a **read-only preview** (`POST /admin/templates/preview`,
never saves): the documents a sample **adult employed** applicant and a sample **minor**
would receive under the current (unsaved) rules, plus the same validation problems as
warnings — so a mistake is visible before saving.

### Registry API
- Customer upload targets a **row id**: `POST /:ref/applicants/:aid/documents` with form
  field `documentId` (only `CUSTOMER`, non-satisfied rows).
- Customer sets accommodation: `PATCH /:ref { accommodationType }`.
- Staff document actions: `POST /admin/documents/:id/upload` (AGENT / on-behalf),
  `POST /admin/documents/:id/mark-in-person`, `POST /admin/documents/:id/satisfied-by`
  (`{ sourceDocumentId }`, or null to unlink), `POST /admin/:id/applicants/:aid/documents`
  (`{ docTypeKey }` — add a manual row), `DELETE /admin/documents/:id` (waive template row
  / delete manual row).

> ⚠️ Gone, so don't go looking: `checklist.config.js`, `checklistForApplicant`, the
> hardcoded `docType`/`DOC_TYPES` enum, and the single `completenessPercent` field (now
> two numbers, see above). The one-off `backfill-checklists.mjs` and
> `verify/verify-reminders.mjs` scripts are gone too; visawadi-backend has no `scripts/`
> directory at all.

---

## Status lifecycle & automation
`DRAFT → INFO_PENDING → INFO_COMPLETE → DOCS_READY → APPOINTMENT_BOOKED → SUBMITTED → DELIVERED → APPROVED / REJECTED / CANCELLED`.
- **Create status rule:** `POST /api/visa-applications/admin` sets **`INFO_PENDING`** when a customer is attached (always, in practice — the endpoint resolves/creates a `User` from the email), so the reminder engine engages immediately with no manual step. `DRAFT` is reserved for an application created before any customer is linked (not currently reachable via the admin create flow).
- Customer editing an applicant also moves `DRAFT → INFO_PENDING` (a no-op once already `INFO_PENDING`).
- When the customer's part of the file is complete but staff's is not, the application enters the "Your turn" queue and staff are emailed once (`sendFileReadyForStaff`).
- When every doc is `APPROVED`, the customer is emailed "preparing your appointment".
- All other transitions are set manually by staff on `/admin/applications/[id]`.

## Secure storage

Private customer documents go to a separate **authenticated** Cloudinary space, via `saveAuthenticatedFile` / `signSecureUrl` / `deleteAuthenticatedFile` in `packages/integrations/cloudinary`.
- Uploads use `type:'authenticated'` + `access_mode:'authenticated'`, `overwrite:false`; folder `visawadi/visa-applications/<applicationRef>/<applicantId>/`, and the `public_id` embeds `_v<version>` so resubmissions never overwrite.
- A raw `secure_url` is **never** stored or returned for a document — only the `public_id`. Every read goes through a backend endpoint that checks ownership or admin role first.
- Upload validation (in the multer `fileFilter` and re-checked in the service): only `application/pdf`, `image/jpeg`, `image/png`; max **15 MB**; anything else is a clear 400.

## Magic-link auth

An extension of `packages/domains/users`, not a separate system.
- `User`: `firstName`/`lastName`/`password` are optional (passwordless users), plus `magicLinkToken`/`magicLinkExpires` (`select:false`) and `createMagicLinkToken()` (SHA-256, 20-minute expiry).
- `POST /api/users/magic-link { email }` — creates the user if absent, stores a hashed token, emails the link, and **always responds 200** (no account enumeration). Rate-limited 5/hour per IP and per email.
- `GET /api/users/magic-link/:token` — verifies, sets the `userJwt` cookie, redirects to `<frontend>/apply` (invalid or expired goes to `/apply/login?error=expired`).
- `BACKEND_URL` on visawadi-backend is the public URL used to build those sign-in links (falling back to `http://localhost:<PORT>`). The composition root passes it as `apiBaseUrl`.

## Ownership

Enforced in the service layer (`loadOwnedApplication`): a customer can only touch an application whose `user` matches the authenticated user id. The controller never does the check. Worth testing after any change: sign in as customer A, note their `applicationRef`, then as customer B request `GET /api/visa-applications/<A's ref>` and `GET /api/visa-applications/documents/<A's docId>/view`. Both must 404.

## Emails (Brevo, `packages/shared/notifications/src/templates/visa-applications.js`)

`sendMagicLink`, `sendApplicationAssigned` (the customer gets their link when an application is created), `sendDocumentRejected` (reason plus a link back), `sendAllDocumentsApproved`, `sendFileReadyForStaff`, `sendDocumentsStillNeeded`, `sendRejectionReminder`, `sendApplicationEscalated`.

---

## Reminders and the work queue

### Document history (versioning)
`ApplicationDocument.history[]` keeps every superseded version. On re-upload the
outgoing state (version, status, reason, reviewer, cloudinaryPublicId, mimeType,
timestamps) is pushed to `history`, `version` increments, status → `UPLOADED`,
reason cleared. **The old Cloudinary file is never deleted** (its `public_id`
embeds `_v<n>`). Admins can view any past version: the viewer shows a version
dropdown when history exists, and the signed-URL endpoint accepts `?version=<n>`
— it only signs a version that belongs to that document, so a caller can never
sign an arbitrary `public_id`.

### Activity tracking (on `VisaApplication`)
`lastCustomerActionAt` (any upload or detail save), the two completeness numbers
above (recomputed in the service on every document status change, `NOT_APPLICABLE`
excluded from both denominators), `customerCompletedAt` /
`customerCompleteNotifiedAt` / `readyToSubmit` (the staff-turn fields),
`reminderCount` / `lastReminderSentAt`, `reminderState` (`ACTIVE`/`PAUSED`/`ESCALATED`),
and `rejectionReminderCount` / `lastRejectionReminderAt` (Track B, independent).

### Reminder engine (`reminders.js`, `runReminderSweep`)
Two independent tracks in one sweep:

- **Track A — incomplete application.** Applies when status is `INFO_PENDING`/
  `INFO_COMPLETE`, `customerCompletenessPercent < 100`, `reminderState = ACTIVE`. Fires when
  `now − max(lastCustomerActionAt, lastReminderSentAt, createdAt) > 48h`. Sends **one**
  email per application listing what's still missing, grouped by traveller (never one
  email per document). Increments `reminderCount`, sets `lastReminderSentAt`. After the
  **4th** reminder it sets `reminderState = ESCALATED`, stops emailing the customer, and
  emails staff ("gone quiet, needs a call").
- **Track B — rejected documents.** Applies when any document is `REJECTED`. Faster
  cycle: 1st at 24h after the rejection, 2nd at 72h after the 1st. **Max 2 per cycle.**
  Resets (`rejectionReminderCount = 0`) when the customer re-uploads. Uses its own
  counters, independent of Track A.

**Idempotency (required).** Every send is gated by an atomic `findOneAndUpdate` that
*claims* the send by advancing the very timestamp/counter its filter tests — the same
mutex pattern as the `stripe-webhook-event` lock in `packages/domains/payments`. Track A
claims on `lastReminderSentAt` (must be older than 20h) + `reminderCount` bump; Track B
claims on the exact current `rejectionReminderCount`; escalation is the atomic
`ACTIVE → ESCALATED` flip. Only the winner sends; a concurrent or immediately-repeated
sweep fails the filter and skips. **The sweep is safe to run twice back to back with no
duplicate email** (proven by the scenarios in "How to test" below).

**Scheduling.** `node-cron` inside `apps/visawadi-backend/src/server.js`, daily at **09:00 Asia/Dubai**, guarded
by `ENABLE_REMINDER_CRON` (off unless set to `1/true/yes`; run it on exactly one
instance). Manual endpoint: `POST /api/visa-applications/admin/reminders/run` (`restrictTo('admin')`),
with `?dryRun=1` to report what *would* be sent without sending or mutating. Both return a
structured summary (`trackA.sent/escalated/wouldSend`, `trackB.sent/wouldSend`).

### Needs-attention work queue (`/admin/applications`)
Default order is **oldest silence first** (ascending by `lastCustomerActionAt`, falling
back to `createdAt` — MongoDB sorts nulls first, so never-touched applications float to
the top). Each row shows ref, customer, destination, status, assignee, a completeness
bar, days quiet, reminder count, and a red **Rejected** badge when any document is
rejected. Filter chips map to a `queue` param: **Needs review** (has UPLOADED docs
awaiting a decision), **Gone quiet** (>5 days no customer action, active statuses only),
**Escalated**, **Rejected pending fix**, **Your turn** (the customer is done, staff are not),
**Ready to submit** (the stored `readyToSubmit` flag), **All**. A per-row bell toggles `reminderState` between `ACTIVE` and `PAUSED` for
customers who've asked to be left alone. The queue is one aggregation with a `$lookup`
on the documents collection (doc-level chips + badges computed server-side).

### Env var
- `ENABLE_REMINDER_CRON` (visawadi-backend) — `1`/`true`/`yes` turns on the daily 09:00
  Asia/Dubai reminder sweep. Leave unset everywhere except the single instance that
  should run it.

## How to test the reminders

**Trigger a Track A reminder without waiting 48h.** The engine keys off timestamps
in the document, so just age them. Pick an application in `INFO_PENDING`/`INFO_COMPLETE`
with `customerCompletenessPercent < 100` and at least one `REQUIRED` CUSTOMER document, then in `mongosh`:
```js
db.visaapplications.updateOne(
  { applicationRef: 'TVL-XXXX-XXXX' },
  { $set: { lastCustomerActionAt: new Date(Date.now() - 3*24*3600*1000),
            lastReminderSentAt: null, reminderState: 'ACTIVE', reminderCount: 0 } }
)
```
Then fire the sweep (dry run first): 
```bash
curl -s -X POST "$API/api/visa-applications/admin/reminders/run?dryRun=1" -H "Cookie: jwt=<admin-jwt>"
curl -s -X POST "$API/api/visa-applications/admin/reminders/run"          -H "Cookie: jwt=<admin-jwt>"
```
The dry run reports the app under `trackA.wouldSend` (with the missing items grouped by
traveller) and sends nothing; the real run emails the customer and returns it under
`trackA.sent`.

**Prove no duplicate email — run the sweep twice.** Immediately run the real sweep a
second time:
```bash
curl -s -X POST "$API/api/visa-applications/admin/reminders/run" -H "Cookie: jwt=<admin-jwt>"
```
The second response's `trackA.sent` (and `trackB.sent`) is **empty** — the claim guard
sees `lastReminderSentAt` is now < 20h old and skips. `reminderCount` advanced by exactly
1 across both runs. **Track B:** age a rejection with
`db.applicationdocuments.updateOne({_id: ...}, {$set:{status:'REJECTED', reviewedAt:new Date(Date.now()-2*24*3600*1000)}})`
and reset the app's `rejectionReminderCount` to 0; the first sweep sends one rejection
reminder, the second sends none. **Escalation:** set `reminderCount: 4` and an aged
`lastReminderSentAt`; the sweep flips the app to `ESCALATED`, emails staff (not the
customer), and a second sweep does nothing. (These four scenarios — Track A/B single-send,
escalate-once, dry-run — were verified against the real `reminders.js` with an in-memory
model mock during development.)

---

## Document viewing — inline stream vs signed URL
There are now two ways to read a document, both enforcing the same ownership/admin
checks and the same optional `?version=` validation (a version must belong to the
document; you can never reach an arbitrary `public_id`):

- **Inline stream (preferred for review).** `GET /api/visa-applications/documents/:documentId/stream`
  (customer, `userJwt`) and `GET /api/visa-applications/admin/documents/:documentId/stream`
  (admin). The backend fetches the authenticated file from Cloudinary **server-side**
  and pipes it straight to the response with `Content-Type` from the stored mimeType and
  `Content-Disposition: inline` — **nothing is written to local disk** on the server, and
  the admin viewer renders it in place (via an authenticated blob) instead of downloading
  it to the reviewer's machine. This is what the admin document viewer uses.
- **Signed URL (kept in place).** `.../view` still returns a short-lived
  `private_download_url` — retained for the customer "open in new tab" flow and any
  external use.

## Notes / limitations
- **Signed `.../view` URLs are download URLs** (`private_download_url` with `expires_at`) — the only expiry-enforcing primitive without Cloudinary's paid auth-token add-on; browsers may download rather than render them. The `.../stream` endpoints above avoid this for in-app viewing.
- Changing a profile answer never destroys work: `reconcileChecklistForApplicant` adds, revives or marks-N/A on every change, and never touches an UPLOADED / APPROVED / REJECTED or manually-added row.
- The reminder cron uses `ENABLE_REMINDER_CRON` as a single-instance guard rather than a distributed lock; the sweep itself is idempotent, but enable it on **one** instance only to avoid wasted work.
- **There are no automated tests for this domain.** It was verified by building the frontend, composing the domain factory, and exercising the reminder engine's idempotency by hand against the real `reminders.js`. None of that is re-run by `pnpm test`, so don't claim it passes.

---

## Out of scope
No Stripe checkout for visa · no AI cover-letter/NOC generation · no cross-app calls to another brand's backend · no hotel booking creation · no document bundle export · no SMS/WhatsApp. The `visas` and `visa-leads` domains stay separate from this one: `Visa` is marketing page content and `VisaLead` is a prospect CRM, and the only link between them is the optional `visaLead` reference on `VisaApplication`.
