# Visa Applications — Schengen application system

A customer-facing visa application system for Travl: customers sign in with a magic
link, answer a few profile questions, and upload their own documents; staff produce
the rest, review everything, and drive the application through its lifecycle. Built on
the domain factory pattern (`schema → service → controller → router` via `index.js`).

> **Read this section first — it supersedes the "config-driven checklist" described in
> the older Phase 1/2 notes below.** The hardcoded `docType` enum and
> `checklist.config.js` are gone, replaced by a data-driven document registry.

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

### `ApplicationDocument` (rewritten)
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
only considers `CUSTOMER` rejected rows. Proven by `verify-reminders.mjs` (test 6).

### Adding a new visa type later — no code change
1. Seed any new `DocumentType` rows (admin → Document Registry, or a seed script).
2. Create a `ChecklistTemplate` with the new `visaTypeKey` (e.g. `UK`) and its `rules[]`.
3. Set the application's `visaTypeKey` to that key.
The matcher, reconcile, portal, admin views, reminders and completeness all read the
data — nothing is hardcoded to Schengen.

### Seed script
`node --env-file=.env.<env> scripts/seed-schengen-checklist.mjs` — **idempotent**; upserts
all `DocumentType` rows and the Schengen `ChecklistTemplate`. Run it once before use.

### Admin registry screen
`/admin/document-registry` (admin only): manage `DocumentType` records and edit the
Schengen template rules. New endpoints: `GET/POST/PATCH /api/visa-applications/admin/document-types`,
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

### New/changed API for the registry model
- Customer upload targets a **row id**: `POST /:ref/applicants/:aid/documents` with form
  field `documentId` (only `CUSTOMER`, non-satisfied rows).
- Customer sets accommodation: `PATCH /:ref { accommodationType }`.
- Staff document actions: `POST /admin/documents/:id/upload` (AGENT / on-behalf),
  `POST /admin/documents/:id/mark-in-person`, `POST /admin/documents/:id/satisfied-by`
  (`{ sourceDocumentId }`, or null to unlink), `POST /admin/:id/applicants/:aid/documents`
  (`{ docTypeKey }` — add a manual row), `DELETE /admin/documents/:id` (waive template row
  / delete manual row).

> ⚠️ Removed by this change: `checklist.config.js`, `checklistForApplicant`, the hardcoded
> `docType`/`DOC_TYPES` enum, the single `completenessPercent` field, and the now-obsolete
> `scripts/backfill-checklists.mjs` (its purpose — migrating legacy lowercase employment —
> no longer applies; nothing is live). `verify-reminders.mjs` was updated for the new model
> and gained the CUSTOMER-only assertion.

---

## What was built

### STEP 0 — cleanup
- `packages/shared/config/src/brands/travl.js`: `features.dummyTickets` → **false**; SEO copy no longer claims dummy tickets/hotels.
- `apps/travl-frontend/CLAUDE.md`: "What Travl is" now states insurance + itineraries + visa assistance only.

### New domain — `packages/domains/visa-applications`
Three Mongoose models (registered via the existing `getOrRegisterModel` helper):

| Model | Collection role | Key fields |
|---|---|---|
| `VisaApplication` | the case | `applicationRef` (unique, e.g. `TVL-2601-A7K3`), `user`→User, `visaLead`→VisaLead (optional), `destinationCountry`, `packageName`, `applicantCount`, `intendedTravelDates{from,to}`, `vfsCenter`, `appointmentDate`, `appointmentStatus`, `status` (DRAFT…CANCELLED), `assignedTo`→admin-user, `externalOrders{dummyTicketRef,hotelBookingRef,insuranceSessionId}`, `notes[]`, `activityLog[]`, `lastCustomerActionAt`, timestamps |
| `Applicant` | one traveller | `application`→VisaApplication, `isPrimary`, name/DOB/nationality/passport fields, `relationshipToPrimary`, `employmentStatus` |
| `ApplicationDocument` | one checklist row | `application`, `applicant`, `docType` (PASSPORT…OTHER), `status` (REQUIRED/UPLOADED/APPROVED/REJECTED), `rejectionReason`, `cloudinaryPublicId`, `originalFilename`, `mimeType`, `sizeBytes`, `version`, `uploadedAt`, `reviewedAt`, `reviewedBy` |

- **Checklist is config-driven** (`src/checklist.config.js`, `checklistForApplicant()`), not hardcoded in the controller. When an applicant is added, one `ApplicationDocument` row (status `REQUIRED`) is created per docType. Edit `DOCUMENT_CHECKLIST` to change requirements.
- **Ownership is enforced in the service layer** (`loadOwnedApplication`) — a customer can only touch an application whose `user` equals the authenticated user id. The controller never does the check.
- `notes[]` / `activityLog[]` copy the shape from `visaLead.schema.js`.
- `lastCustomerActionAt` was added (beyond the listed fields) to power the admin "days since last customer action" column.

### STEP 2 — secure storage (`packages/integrations/cloudinary`)
Added `saveAuthenticatedFile(buffer, subPath, {resourceType})`, `signSecureUrl(publicId, expiresInSeconds=300, {resourceType, format})`, `deleteAuthenticatedFile(publicId, {resourceType})`.
- Uploads use `type:'authenticated'` + `access_mode:'authenticated'`, `overwrite:false`; folder `travl/visa-applications/<applicationRef>/<applicantId>/`, and the `public_id` embeds `_v<version>` so resubmissions never overwrite.
- A raw `secure_url` is **never** stored or returned for a document — only the `public_id`. Every read goes through a backend endpoint that checks ownership/admin role, then returns a freshly **signed 5-minute** URL (`private_download_url` with `expires_at`).
- Upload validation (in the multer `fileFilter` + re-checked in the service): only `application/pdf`, `image/jpeg`, `image/png`; max **15 MB**; anything else → clear 400.

### STEP 3 — magic-link auth (extended `packages/domains/users`, not a new system)
- `User` schema: `firstName`/`lastName`/`password` relaxed to optional (passwordless users), added `magicLinkToken`/`magicLinkExpires` (select:false) + `createMagicLinkToken()` (SHA-256, 20-min). `correctPassword` now guards on a missing password.
- `POST /api/users/magic-link { email }` — creates the user if absent, stores a hashed token, emails the link, **always responds 200** (no account enumeration). Rate-limited **5/hour per IP and per email**.
- `GET /api/users/magic-link/:token` — verifies, sets the existing `userJwt` cookie, redirects to `<frontend>/apply` (invalid/expired → `/apply/login?error=expired`).
- **Wiring fix:** the map noted `sendPasswordReset` was a silent no-op in Travl. The shared notifications service (`packages/shared/notifications/src/index.js`) now implements `sendMagicLink` (and the other visa emails), and Travl's `routes/index.js` passes `apiBaseUrl` so the link points at the backend. That is the pattern to reuse for password-reset later.

### STEP 4 — API routes (mounted `/api/visa-applications` in `apps/travl-backend/src/routes/index.js`)
Customer (userJwt `protect`):
- `GET /mine` · `GET /:applicationRef` · `PATCH /:applicationRef/applicants/:applicantId` · `POST /:applicationRef/applicants/:applicantId/documents` (multipart, field `document`, requires `docType`) · `GET /documents/:documentId/view` (signed URL).

Admin (`restrictTo('admin','agent')`):
- `GET /admin/list` (filters: status, assignedTo, search) · `POST /admin` (create, optionally from a `visaLeadId`) · `GET /admin/:id` · `PATCH /admin/:id` (status/assignee/appointment/externalOrders) · `POST /admin/:id/applicants` · `PATCH /admin/documents/:documentId/review` (`{decision, rejectionReason}`) · `POST /admin/:id/notes` · `GET /admin/documents/:documentId/view` (signed URL for the inline viewer).

### STEP 5 — frontend (`apps/travl-frontend` + `packages/frontend-shared`)
- Data layer in `frontend-shared`: `services/apiVisaApplications.js`, hooks under `hooks/visa-applications/*`, real `contexts/UserAuthProvider.js`.
- **`Providers.js`** now swaps the hardcoded `GuestAuthProvider` for the real `UserAuthProvider` **only on `/apply` routes**; every other public page is unchanged.
- Customer pages (`pages/client/shared/Apply*Page.js`): `/apply/login` (magic-link request), `/apply` (application list + completeness bars), `/apply/[applicationRef]` (per-applicant accordion, document checklist with status pills, upload/replace, rejection reasons in red).
- Admin pages (`pages/admin/AdminApplication*Page.js`): `/admin/applications` (table: ref, customer, destination, status, assignee, completeness %, days-idle) and `/admin/applications/[id]` (applicant panels, document review with inline iframe viewer, approve / reject-with-required-reason, status + appointment controls, external order ref fields, notes/activity timeline). Added to the AdminShell `ROLE_ROUTE_RULES` and the dashboard nav (roles admin + agent).

### STEP 6 — emails (Brevo, `packages/shared/notifications`)
`templates/visa-applications.js` + service methods: `sendMagicLink`, `sendApplicationAssigned` (customer gets their link when an application is created), `sendDocumentRejected` (reason + link back), `sendAllDocumentsApproved` (customer), `sendChecklistCompleteToAdmin` (admin, fired when the customer finishes the whole checklist).

---

## Status lifecycle & automation
`DRAFT → INFO_PENDING → INFO_COMPLETE → DOCS_READY → APPOINTMENT_BOOKED → SUBMITTED → DELIVERED → APPROVED / REJECTED / CANCELLED`.
- **Create status rule:** `POST /api/visa-applications/admin` sets **`INFO_PENDING`** when a customer is attached (always, in practice — the endpoint resolves/creates a `User` from the email), so the reminder engine engages immediately with no manual step. `DRAFT` is reserved for an application created before any customer is linked (not currently reachable via the admin create flow).
- Customer editing an applicant also moves `DRAFT → INFO_PENDING` (a no-op once already `INFO_PENDING`).
- When every checklist doc is submitted (not `REQUIRED`), the app auto-moves to `DOCS_READY` and admin is emailed.
- When every doc is `APPROVED`, the customer is emailed "preparing your appointment".
- All other transitions are set manually by staff on `/admin/applications/[id]`.

## New env var
- `BACKEND_URL` (travl-backend) — this backend's public URL, used to build magic-link sign-in URLs (falls back to `http://localhost:<PORT>`). Set to `https://api.travl.ae` in production.

---

## How to test

Prereqs: Mongo + Cloudinary + Brevo configured in `apps/travl-backend/.env.development`; run backend (`pnpm dev` in `apps/travl-backend`) and frontend (`pnpm turbo dev --filter=travl-frontend`). An admin user must exist (`node --env-file=.env.development scripts/seed-admin.js`).

### End-to-end (UI)
1. **Admin creates an application.** Log into `/admin`, open **Visa Applications → New application**, enter a customer email + destination. This creates the customer `User` (passwordless) + a primary applicant with a `REQUIRED` checklist, and emails the customer a sign-in link.
2. **Customer signs in.** Open the emailed link (or `POST /api/users/magic-link` then use the token) → you land on `/apply`. Open the application, fill passport details, and upload a PDF/JPEG/PNG for each checklist row. Try a `.txt` or a >15 MB file → rejected with a clear message.
3. **Completeness.** As documents upload, the bar fills; when all are submitted the status shows "Under review" and admin gets a "documents complete" email.
4. **Admin review.** On `/admin/applications/[id]`, click **View** (opens a signed 5-min URL in an inline iframe), then **Approve** or **Reject**. Reject requires a reason → the customer gets an email with the reason and a link back; the row shows the reason in red under `/apply/[ref]`.
5. **All approved.** Approve every document → the customer gets the "preparing your appointment" email. Use the right-hand controls to set status, appointment, and paste external order refs (dummy ticket / hotel / insurance — plain strings, no cross-app calls).

### Quick API smoke (magic link, no UI)
```bash
# request a link (always 200)
curl -s -X POST "$API/api/users/magic-link" -H 'Content-Type: application/json' -d '{"email":"t@example.com"}'
# admin list (needs an admin jwt cookie)
curl -s "$API/api/visa-applications/admin/list" -H "Cookie: jwt=<admin-jwt>"
# customer's own applications (needs a userJwt cookie from the magic-link redirect)
curl -s "$API/api/visa-applications/mine" -H "Cookie: userJwt=<user-jwt>"
```

### Ownership check
Sign in as customer A, note their `applicationRef`, then as customer B call `GET /api/visa-applications/<A's ref>` → **404** (service-layer ownership). `GET /api/visa-applications/documents/<A's docId>/view` as B → **404**.

---

---

## Phase 2 — the system chases customers on its own

Phase 1 built the container; Phase 2 automates the chasing so staff stop doing it
by hand. All of the below is additive — `/visa`, `/api/visas`, `/api/visa-leads`,
the `Visa`/`VisaLead` models, and the insurance/itinerary flows were not touched.

### Conditional, employment-driven checklist
Nothing is required until an applicant answers **"what is your work situation"**.
`Applicant.employmentStatus` is `null` until then; the checklist is only seeded
once it's set. Config lives in `checklist.config.js` (`BASE_DOCS` + `BY_EMPLOYMENT`,
resolved by `checklistForApplicant`):

| Status | Documents |
|---|---|
| BASE (everyone) | PASSPORT, PHOTO, EMIRATES_ID, BANK_STATEMENT |
| EMPLOYED | + EMPLOYMENT_NOC, SALARY_CERTIFICATE |
| SELF_EMPLOYED / BUSINESS_OWNER | + TRADE_LICENSE |
| STUDENT | + ENROLMENT_LETTER, EMPLOYMENT_NOC (school NOC) |
| RETIRED / UNEMPLOYED | base only |
| MINOR | BIRTH_CERTIFICATE; base **without** EMIRATES_ID and BANK_STATEMENT |

**Changing employment later never destroys work.** `reconcileChecklistForApplicant`
adds missing rows, revives `NOT_APPLICABLE` rows that apply again, and marks
rows that no longer apply as `NOT_APPLICABLE` (a new doc status) **only if they are
still `REQUIRED`**. An `UPLOADED` / `APPROVED` / `REJECTED` row is never deleted or
downgraded. `NOT_APPLICABLE` rows are excluded from the completeness denominator.

On the customer portal, `/apply/[ref]` shows the work-situation question first and
blocks all uploads until it's answered.

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
`lastCustomerActionAt` (any upload/detail save), `completenessPercent` (recomputed
in the service on every document status change, NOT_APPLICABLE excluded),
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

**Scheduling.** `node-cron` inside travl-backend, daily at **09:00 Asia/Dubai**, guarded
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
**Escalated**, **Rejected pending fix**, **Ready to submit** (100% and all approved),
**All**. A per-row bell toggles `reminderState` between `ACTIVE` and `PAUSED` for
customers who've asked to be left alone. The queue is one aggregation with a `$lookup`
on the documents collection (doc-level chips + badges computed server-side).

### New reminder emails (Brevo, `templates/visa-applications.js`)
`sendDocumentsStillNeeded` (missing items per traveller, one CTA), `sendRejectionReminder`
(shows each reason again), `sendApplicationEscalated` (staff alert after 4 reminders).
Same sender identity and shell layout as the existing visa-application emails.

### New env var
- `ENABLE_REMINDER_CRON` (travl-backend) — `1`/`true`/`yes` turns on the daily 09:00
  Asia/Dubai reminder sweep. Leave unset everywhere except the single instance that
  should run it.

### Backfill (run once, manually)
`apps/travl-backend/scripts/backfill-checklists.mjs` migrates applications created
before Phase 2: maps legacy lowercase `employmentStatus` to the new enum, reconciles
each checklist to the new rules (add/revive/N-A, never touching uploaded/approved/
rejected rows), and recomputes `completenessPercent`. **Not run automatically.**
```bash
# from apps/travl-backend
node --env-file=.env.development scripts/backfill-checklists.mjs --dry   # preview
node --env-file=.env.development scripts/backfill-checklists.mjs         # apply
```

---

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
- ~~Changing `employmentStatus` later does not retroactively add rows~~ — **resolved in Phase 2**: `reconcileChecklistForApplicant` now adds/revives/marks-N-A on every change.
- The reminder cron uses `ENABLE_REMINDER_CRON` as a single-instance guard rather than a distributed lock; the sweep itself is idempotent, but enable it on **one** instance only to avoid wasted work.
- **Verified this phase:** `pnpm --filter travl-frontend build` compiles every route (incl. `/apply/*`, `/admin/applications*`); the backend domain factory composes (3 models + **14** routes); `checklistForApplicant` output matches the spec table for all 7 statuses; and the reminder engine's idempotency (Track A/B single-send, escalate-once, dry-run) is proven against the real `reminders.js`. Not exercised against a live Mongo/Cloudinary/Brevo.

---

## Verification: the reminder concurrency test

Most of the system is verified by clicking through the app. The one thing that can't
be tested by hand is the reminder engine's **atomic claim under real concurrency**, so
that is the only verification script kept: `apps/travl-backend/scripts/verify/verify-reminders.mjs`
(plus `_shared.mjs`, which composes the real domain the way the production root does).

It runs against **real** MongoDB, Cloudinary, and Brevo — no mocks. It prints the
resolved Mongo db/host before any write, prints `PASS`/`FAIL` lines, cleans up what it
created (even on failure), and exits non-zero on any failure.

**What it proves**
- A sequential double sweep sends exactly one email (`reminderCount` +1).
- **Two sweeps running concurrently on two separate mongoose connections still send exactly one** — the `findOneAndUpdate` claim holds under a real MongoDB race, which a single-threaded mock can't demonstrate.
- Escalation flips `ACTIVE → ESCALATED` once, emails staff only, then stops.
- Track B: the 24h rejection nudge fires once, and re-uploading (real Cloudinary) resets the counter so the follow-up doesn't fire.
- `dryRun` mutates nothing.

> ⚠️ **Writes real records and sends real email.** Point `MONGO_URI` at a **dev or
> staging** database and use a sandbox/staging Brevo. The script prints the target
> db/host up front so you can confirm before it writes.

**Environment** (loaded via `--env-file`; the script exits 2 naming anything missing):
- `MONGO_URI` — dev/staging database
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — the Track B re-upload
- `BREVO_API_KEY`, `ADMIN_EMAIL` — real sends (staff alerts go to `ADMIN_EMAIL`)
- `JWT_SECRET`, `USER_JWT_SECRET` (falls back to `JWT_SECRET`), `BACKEND_URL`, `FRONTEND_URL` — domain composition
- `VERIFY_EMAIL_TO` (optional) — recipient for customer reminders; if unset they go to a synthetic `@verify.travl.ae` address

**Run**
```bash
cd apps/travl-backend
node --env-file=.env.staging scripts/verify/verify-reminders.mjs
```

## Out of scope (unchanged, per the brief)
No Stripe checkout for visa · no AI cover-letter/NOC generation · no cross-app calls to dt365/mdt · no hotel booking creation · no document bundle export · no SMS/WhatsApp. `/visa`, `/api/visas`, `/api/visa-leads`, the `Visa` and `VisaLead` models, and the insurance/itinerary flows were **not** modified beyond the optional `visaLead` reference on `VisaApplication`.
