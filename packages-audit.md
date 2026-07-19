# Packages audit

Read-only code-quality scan of `packages/`. No files changed. Nothing here is verified at runtime (no test suite). Severity reflects impact **if** the code path is hit.

Sections:
- [packages/integrations + packages/shared](#integrations--shared)
- [packages/domains](#domains) _(pending)_

---

## integrations + shared

### Top priority

1. **HTML injection / stored XSS in every notification email** — no template escapes user input. Free-text fields (customer `message`, `specialRequests`, passenger names, `pickup`/`dropoff`, visa `description`) go straight into HTML sent to admin inboxes. Add an `escapeHtml()` in `packages/shared/notifications/src/helpers.js` and route every dynamic value through it (the shared `row()` helper is the natural choke point).
2. **Brand names hardcoded in shared packages** (STRICT rule violation):
   - `packages/integrations/paypal/src/client.js:85` → `brandName || 'Dummy Ticket 365'`, and `:77` → `'Flight Reservation'`.
   - `packages/shared/notifications/src/templates/visa-lead.js:71` → literal `New visa lead from Travl`; `:51-52` → defaults `'Travl Team'` / `'https://travl.ae'`. Any non-travl brand renders "Travl".
3. **`airportrides` brand config is unregistered** — `packages/shared/config/src/index.js:8` imports only 5 brands; `brands/airportrides.js` exists but is never imported, so it's excluded from load-time validation and `getBrand('airportrides')` would throw. *Latent* — no app calls `getBrand` yet (frontends use their local `config.js`), so it doesn't crash today, but the file is silently unvalidated.
4. ✅ **Fixed** — **PayPal capture isn't idempotent** — `packages/integrations/paypal/src/client.js:118-135`: `captureOrder` sends no `PayPal-Request-Id` (createOrder does), and returns `res.json()` on any 2xx without checking `captures[].status === 'COMPLETED'`. A `DECLINED`/`PENDING` capture reads as success → could mis-issue a ticket. Payment-critical. _Fix: added `PayPal-Request-Id: capture-${orderId}` idempotency header and a `status === 'COMPLETED'` check that throws otherwise._

### integrations — bugs & inconsistency

- **Inconsistent fetch error handling.** serpapi is the reference (try/catch on fetch, guarded `res.json()`, all `AppError`). airlabs (`airlabs/src/index.js:20`), wis (`wis/src/index.js:24,:30`), brevo, and paypal don't wrap fetch — network errors bubble as raw `TypeError`/500 instead of a clean 502.
- **No request timeouts anywhere** — every client can hang an Express request indefinitely. Add `AbortController`.
- **wis** (`:30-32`) — no `res.ok` check and unguarded `res.json()`: a 500 or HTML error page slips through as an empty success. Plus unvalidated destructuring of `body.quantity`/`passengers[0]`/`mobile` (`:98,:124,:127`).
- **brevo** — `email.toLowerCase()` with no null guard (`:32,:48`); throws plain `Error` not `AppError`; `@travel-suite/utils` isn't even a declared dep.
- **cloudinary** — `cloudinary.config()` (`:11`) mutates the library's process-global singleton (breaks DI if two instances differ); `deleteFolder` caps at `max_results: 500` with no pagination → orphaned assets.
- **paypal** — `getAccessToken` has no in-flight promise dedup (concurrent cold calls fire multiple token requests); package has **no `node_modules`** and empty `dependencies` — confirm it's actually wired into the workspace.
- **Dead exports:** serpapi exports `TYPE_ROUND_TRIP` (unused); airlabs `suggestAirports`/`suggestCities` make two `/suggest` calls for data one response already contains.
- Secrets check: **clean** — no client logs keys/tokens/connection strings.

### shared — bugs

- **dates.js** is the weak spot: `formatDateShort` (:53), `formatISOTime` (:60), `formatISODuration` (:73) all throw on null and mis-parse non-`YYYY-MM-DD` input; `formatISOTime` uses server-local time not Dubai; `toDubaiDate` (:83) uses the fragile "reparse a localized string" trick while `formatDubaiTime` (:109) already does it correctly with `Intl`. Consolidate onto the Intl approach.
- **currency.js:14** — `toFixed(2)` inherits float rounding error (`(1.005).toFixed(2)==='1.00'`); round on integer cents. `convertAmount` silently substitutes rate `1` for a bad/NaN rate, masking a broken FX feed.
- **utils/errors.js** — `AppError` never sets `this.name` (loggers key off it) and has no default `statusCode`; `catchAsync` assumes `fn` returns a thenable — wrap in `Promise.resolve()`.
- **iata.js / itinerary.js** — both throw on nullish/malformed external input; add guards (the notifications copy of `extractIataCode` is actually the more defensive one).
- **notifications/index.js:233** — `new Date(data.date + 'T00:00:00')` yields `Invalid Date` for anything but a bare date string; also hardcodes product string `Airport Transfer`.
- **Failed-email safety: correct** — every send is try/caught and returns false rather than throwing, so a notification failure can't roll back a payment. Good.

### Duplication — the big wins

- **`@travel-suite/utils/fetchJson` (new).** The same fetch→parse→normalize logic is hand-rolled 5× (airlabs, serpapi, wis, paypal, brevo), which is *why* error handling drifted. One helper (`AbortController` timeout → 504, network → 502, guarded parse → 502, optional `res.ok`/error-field) collapses all of it and fixes the timeout + raw-error gaps in one move.
- **notifications templates:** `row()` duplicated across 7 templates (differ only by cell width); `formatTime()` duplicated verbatim in 2; `ticket-payment.js` and `ticket-scheduled-delivery.js` are ~90% identical — extract a shared `renderTicketBody()`. And `formatDate`/`formatDubaiTime`/`extractIataCode` are reimplemented in `helpers.js` despite living in `utils` — import instead.
- **brand config files:** the 6 near-identical files are **config data, not duplicated logic — keep them.** Only worthwhile change: extract the invariant fields (`timezone: 'Asia/Dubai'`, the `legal` block, `ogImage`) into a `defaults` object spread into each, to prevent drift.

### Also worth noting

- **Dead code:** `ticket-scheduled-delivery.js` is exported but never imported and has no service method / trigger — the "Deliver today" email can't currently be sent. Wire it or delete it.
- Copy-pasted misleading comment `insurance: false, // implemented — pending…` in both `airportrides.js:20` and `dt365.js:20`.
- Customer/lead senders don't return a status while booking senders do — harmless inconsistency.

---

## domains

Audit of all 21 domain packages, grouped as money-critical, content/flights, auth/users, and reference/config. Verified findings are marked ✓.

### Critical — fix first

1. ✅ **Fixed** — **Admin CRUD is completely unauthenticated** (auth-bypass + privilege escalation) ✓ — `admin-users/src/router.js:29` has `// router.use(protect, restrictTo("admin"))` commented out, so `GET/POST /` and `GET/PATCH/DELETE /:username` (lines 31-40) have zero auth. `createAdminUser` accepts `role`, so anyone on the internet can mint an admin account. Live across all six brand backends. _Fix: uncommented `router.use(protect, restrictTo("admin"))` above the CRUD block._
2. ✅ **Fixed** — **Client-supplied pricing — pay any amount you want** ✓ — `bookings/src/service.js:34` charged `vehicle.price` taken straight from `req.body` (`controller.js:44`); a caller could POST `amount: 1`. Same class in `limo-bookings/src/service.js:72` (`orderSummary.total` stored verbatim from the client) — plus it omitted `Math.round`. _Fix: airportrides now resolves price server-side from a new `bookings/src/catalog.js` keyed by vehicle id (client `price` ignored, unknown id rejected), in both `createBooking` and `createCheckout`. Limo now recomputes the authoritative total at checkout via a new `pricing.getAuthoritativeVehiclePrice` (zone-based rule for distance trips, hourly-rate table for hourly), rounds, and **fails closed** — a distance trip with no covering PricingRule (would need the unpersisted per-km distance) is rejected rather than charged the client total._ Note: the fail-closed edge means any zone that relies on the per-km distance fallback (no PricingRule) can no longer check out until a PricingRule covers it — verify emirateslimo's serviceable zones all have pricing rules.
3. ✅ **Fixed** — **Password-reset host-header injection → account takeover** — `users/src/controller.js:48` built `resetUrl` from `req.get('host')` (attacker-controlled). Poisoned link leaks the reset token. _Fix: injected a trusted `appBaseUrl` (= `config.frontendUrl`) through `createUsersRouter` → controller in all 5 backends that mount `users`; the reset URL no longer reads the Host header. (The reset email itself is not yet wired — `sendPasswordReset` is undefined — so this was latent.)_
4. **Hardcoded brand strings in shared domain packages** (STRICT violation): `itineraries/src/itinerary-document.js:84-90` `DEFAULT_BRAND` = "Travl" / "TRAVL Technologies" / "travl.ae" (and the PDF watermark at :136); `visa/src/service.js:63` deletes Cloudinary folder `travl/visa/${visaId}` — wrong folder for any other brand. Fix: derive from injected brand/imageStorage.

### Idempotency & concurrency (payments/webhooks)

- ✅ **Fixed** — **The whole webhook dedupe is check-then-create, not atomic** — `payments/src/webhook.js:49,62-84`: two concurrent Stripe deliveries both pass `findOne`, both run the handler, the loser hits E11000 → 500 → retry. It won't double-charge (handlers flip an idempotent status), but it **double-sends emails** and can double-trigger insurance issuance. The "retry previously-failed" path (`:53-57`) deliberately re-runs the entire non-idempotent handler. _Fix: replaced with an atomic claim — `findOneAndUpdate` upsert on `eventId` using a new `processingAt` field + the unique index as the mutex; the winner runs the handler, concurrent deliveries defer with 409, a stale claim (>5 min) self-heals, and an unhandled `productType` is no longer marked succeeded (it was permanently swallowing such payments)._ Note: per-handler internal idempotency (short-circuit on already-PAID) is still worth adding as defence-in-depth.
- **Unregistered-handler still marks event done** — `payments/src/webhook.js:76-84` sets `handlerSucceeded:true` even when no handler matched `productType`, permanently swallowing a real payment and blocking retries.
- **Non-atomic "already done" guards** repeated everywhere: `tickets/src/service.js:265-311` (`handleStripeSuccess` re-sends admin+customer emails on every retry; the schema even has an unused `adminDeliveryEmailSent` flag at `ticket.schema.js:44` meant for this), `tickets/src/service.js:415-419` (PayPal capture), `limo-bookings/src/webhook.js:29-51`, `insurance/src/service.js:233-306` (can double-issue a WIS policy), `itineraries/src/service.js:594-611`. Fix pattern: `findOneAndUpdate({ _id/sessionId, status:{$ne:'PAID'} }, {...})` and only run side effects if a doc matched.
- **Notifications awaited inside the handler before it returns** — a customer-email failure throws out of the handler → forces a full Stripe re-run → duplicate admin email (`tickets/src/service.js:316-347`, `insurance:308-325`, `limo-bookings/webhook.js:45-50`). Fix: send best-effort (try/catch each), as the Brevo blocks already do.
- **Non-atomic budget counters** — `itineraries/src/service.js:355-366,480-485,662-673` (regen/chat/edit) read-check-increment-save; concurrent requests both pass the cap. Fix: put the count predicate in the `findOneAndUpdate` filter.
- **Stripe idempotency key too coarse** — `tickets/src/service.js:262` keys on `sessionId` alone; if the customer changes currency and re-checks-out, Stripe returns the stale cached session so `totalAmount`/`amountPaid` diverge. Key on `sessionId:currency:amount`.

### Correctness bugs

- ✅ **Fixed** — **flights (uncommitted changes) — the new race-handling is inert** ✓ diff read — `enrichFlightsWithAirlines` (`service.js:174`) relies on a duplicate-key error, but `schemas/airline.schema.js:3-9` declared `iataCode` with **no unique index**, so concurrent searches silently insert duplicate airline docs and the catch is dead code. _Fix: `iataCode` is now `{ unique: true, sparse: true, index: true }`. Heads-up: if the collection already holds duplicate iataCode docs, dedupe them before the unique index will build._ Also: SerpApi return-trip pairing is fabricated (`service.js:228` zips outbound[i] with inbound[i%n]); `serpTimeToISO` (`:49-54`) drops the timezone so times parse as server-local; unguarded `f.itineraries[0]` (`:245`); and the provider loop (`:276-291`) masks a total upstream outage as `404 No flights available` instead of 502.
- ✅ **Fixed** — **currencies — base currency can never be changed** — `service.js:79-90` and `:51-62` persist the new base before unsetting the old one, so the partial unique index (`schema.js:20-23`) throws E11000 and `ensureSingleBase` never runs. _Fix: both create and update now demote the previous base (`demoteOtherBases`) BEFORE writing the new one, so the single-base index is never momentarily violated._
- ✅ **Fixed** — **vehicles — shared Cloudinary folder causes cross-vehicle image loss** — folder key is `vehicles/{brand}_{model}` with no id (`service.js:4-6`); two vehicles with the same brand+model share a folder, so deleting one wipes the other's images. `duplicateVehicle` copies image URLs verbatim (same problem). _Fix: folder is now `vehicles/{_id}` (id pre-generated in `createVehicle`), and `duplicateVehicle` starts the copy with no images so it never references the source's assets._ (Note: the separate `updateVehicle` delete-before-write-with-no-rollback issue at `:78-118` was **not** part of this pass.)
- **admin-users — case-sensitive delete mismatch** — `service.js:134` looks up by normalized username but deletes with the raw route param, so `/JohnDoe` returns 204 while deleting nothing. Delete by `_id`.
- **zones — `getZoneByPoint` rejects legit `0` coords and passes `NaN` to `$geoIntersects`** — `service.js:38-51`; parse first, then `Number.isFinite` + range check.
- **tickets — `refundByTransactionId` always refunds via Stripe** (`service.js:511-528`) even for PayPal tickets whose `transactionId` is a PayPal order id; add a `paymentMethod` branch and an atomic transition to REFUNDED.
- **blog/visa/visa-leads — check-then-act slug generation** under a unique index throws raw E11000 (500) on concurrent creates with the same title (`blog/service.js:19-31`, `visa/service.js:37-48`). Catch-and-retry.
- **ReDoS / unescaped regex** — `tickets/src/service.js:26` builds `new RegExp(search,'i')` from raw user input; insurance does this correctly via `escapeRegex`. Port it.

### Security (beyond the critical items)

- **No `algorithms` pinning on `jwt.verify`** in both auth stacks (`auth/src/jwt.js:11`, `users/src/middleware.js:15`).
- **`users` has no post-reset token invalidation** — no `passwordChangedAt`, unlike `auth`; a stolen token stays valid after a password reset.
- **Email enumeration** — `users/src/service.js:12-13` returns 409 on duplicate register while `forgotPassword` is correctly non-leaking (inconsistent); auth login is timing-distinguishable (`service.js:19-22`).
- **`affiliates` ships a `POST /seed` endpoint** that inserts test data in production (`router.js:22`); any `agent` role can read affiliate revenue.
- **`email-support` double-emails** — `sendReply` (`service.js:105-124`) is a non-atomic read-check-send; and `drafter.js:66-69` swallows all AI errors as "not a support query", silently dropping genuine mail during any outage.
- **visa-leads** — no dedup (double-click creates duplicate leads + admin emails, `service.js:27-93`); in-memory per-IP rate limiter (`router.js:3-35`) is per-process so the real limit is `5 × machines` and resets on deploy.

### Duplication — the recurring ones

- **`getOrRegisterModel` is copy-pasted ~21×** across every `index.js`/`webhook.js` despite CLAUDE.md calling it a house convention — there is no shared implementation. Export it once from `@travel-suite/utils` (or a `@travel-suite/db`).
- **Pagination block duplicated 4×** (`blog`, `visa`, `visa-leads`, `itineraries`) and again in `affiliates`/`email-support` — extract `paginate(Model, filter, opts)`.
- **`validate()` middleware wrapper** reimplemented in auth, admin-users, affiliates, currencies, availability-rules. **`escapeRegex`** redefined in 5+ files. **`duplicateDocument` block** (`toObject` → strip `_id/timestamps` → rename → `create`) copy-pasted across vehicles/zones/pricing-rules/availability-rules.
- **Two different `Affiliate` schemas register the same model name** (`tickets/schemas/affiliate.schema.js` vs `insurance/schemas/AffiliateSchema.js`) — whichever registers first wins on a shared connection; consolidate into one shared affiliates package.
- **Four near-identical Stripe checkout builders** (`payments`, `tickets`, `bookings`, `limo-bookings`) with drifted correctness (only limo omits `Math.round`) — consolidating on `payments.createCheckoutSession` prevents that class of bug.
- **The six reference/config domains are ~60% copy-paste clones** — a shared `createCrudService`/`createCrudRouter` factory is warranted for `vehicles/zones/pricing-rules/availability-rules`, keeping domain-specific logic (image handling, geo queries, base-currency invariant) as overrides. Keep `currencies` and `locations` bespoke.

### Missing validation / indexes / write-on-read

- **`pricing-rules` and `availability-rules` have no precedence resolution** for overlapping rules — undefined behavior when multiple match. `pricing-rules` has no validator at all (`service.js:27-32`); `availability-rules` create bypasses its zod validator (`controller.js:6-9` uses raw body, ignoring `req.validatedBody`), so a rule with zero pickup zones can persist.
- **Write-on-every-read** — `blog` calls `publishDueScheduledBlogs()` (an `updateMany`) on every public/admin/slug read (`controller.js:6,22,38`) and the implementation is duplicated in `index.js:57` and `service.js:171`; `blogTag` backfills slugs on every read. Move to the cron that already exists.
- **`blog/controller.js:305` reads `process.env.RECRAFT_API_KEY` directly**, breaking the package's own DI convention.
- **Missing indexes:** `bookings.stripeSessionId` (unique sparse — also helps webhook idempotency), `tickets.transactionId`, `limo-bookings.payment.transactionId`, `visa-leads.createdAt`, `flights Airline.iataCode` (unique).
- **External `fetch` with no timeout** in blog (Recraft/Anthropic/image download) and flights — a hung upstream holds the request open.

### Notably solid

`auth` (bcrypt cost 12, `select:false` on password, `passwordChangedAt` session invalidation, login rate limiter), `itineraries` (idempotent-ish generate/poll, guaranteed FAIL/GENERATED settling, atomic `$set` for supporting-docs upload), `insurance` premium comes from WIS not the client, and `zones` has a correct `2dsphere` index.
