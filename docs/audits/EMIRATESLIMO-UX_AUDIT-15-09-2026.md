# Emirates Limo UX and Conversion Audit

Date: 15 September 2026
Branch: `master` at `ebeb506` (working tree clean under `apps/emirateslimo-*`; other apps had unrelated uncommitted changes from other sessions)
Environment: `emirateslimo-frontend` on `http://localhost:3100` (Next 16 dev), `emirateslimo-backend` on `http://localhost:3101`, both started for this audit and shut down after. Ports 3000/3001 belong to other sessions and were not touched. Production (`www.emirateslimo.com`) was used only to confirm the homepage image weight after today's deploy.

## Instruments

- Real browser: YES. Headless Google Chrome (installed binary, driven over CDP with puppeteer-core). Every funnel step was rendered at 390x844 (touch emulation, iPhone UA) and 1440x900, screenshotted full-page and inspected via DOM queries. The form was driven end to end: location search, suggestion pick, calendar, time picker, submit, vehicle selection, details form.
- NOT exercised: `POST /api/bookings` and Stripe. Dev and prod share one MongoDB (see below), so no booking was written and no checkout session created. The details form was filled but never submitted. Stripe redirect, webhook and the success page are assessed from code only.
- Analytics: no GA4 access (GA4 was only wired today, so there is no history anyway). The GSC export from the SEO audit covers search, not on-site behaviour. Phase 8 is limited to what the code sends.
- Competitors: none named. Phase 9 skipped.
- Core Web Vitals: NOT measured here. A PageSpeed Insights mobile lab run for the homepage was supplied earlier today (Performance 74, LCP 5.1 s, 3.1 MB of images); the image fix has since shipped and is not yet re-measured.
- Database: **dev and prod point at the same MongoDB** (verified by hashing the `MONGO_URI` line of both env files, not printed). Any follow-up fix script runs against production.

Evidence tags: **OBSERVED** (rendered or executed), **CODE** (read in the repo), **INFERRED** (reasoned from either).

## INPUTS

| Field | Value | Source |
|---|---|---|
| Primary conversion event | Paid booking: Stripe Checkout completes, webhook sets `payment.status = 'paid'`, GA4 `purchase` fires on `/payment` | User |
| Secondary conversions | WhatsApp chat (floating button, `wa.me/971569964924`), phone, email on `/contact-us` | CODE |
| Known symptom | None stated; baseline audit | User |
| Risk reversal | Full refund if cancelled 24 hours or more before pickup; the user also says "plus a guarantee" but did not describe it, and no guarantee appears anywhere on the site | User, CODE |
| House facts | 24 h full refund, nothing after; 60 min free waiting at airports, 15 min elsewhere; all-inclusive fixed fares (tolls, VAT); hourly from AED 150; six chauffeur-driven vehicles; 24/7; Dubai, Abu Dhabi, Sharjah | User (established earlier today) |
| Traffic | From GSC (3 months): 74 of 79 clicks land on the homepage; mobile position 14 vs desktop 31; a third of impressions are people looking for the airline's Chauffeur-drive product | GSC export |
| Funnel | Homepage hero form (also on every service page) → `/book/select-limo` → `/book/booking-details` → Stripe Checkout (hosted) → `/payment?id=` | CODE, OBSERVED |

The "guarantee" you mentioned is not on the site. If one exists (on-time, satisfaction, price match), it is the strongest trust asset the funnel could show and it is currently invisible. If it does not exist beyond the refund, say so and the fix list drops F5.

## Executive summary

| Bucket | Score | Weight |
|---|---|---|
| Clarity and message match | 70 | 20% |
| Funnel friction | 58 | 25% |
| Trust and risk reversal | 55 | 20% |
| Forms and checkout | 50 | 15% |
| States, feedback and failure handling | 45 | 10% |
| Mobile and performance experience | 62 (partial, no CWV) | 10% |
| **Overall (weighted)** | **58** | |

Scores are based on what was rendered or read. The paid half of the funnel (Stripe, webhook, success page) is code-based.

**Highest drop-risk step:** `/book/booking-details`. It asks for six required fields including a free-text "Estimated Arrival Time" with no format hint, accepts any string as an email, sends the buyer to Stripe with whatever they typed, and keeps the "Proceed to Payment" button greyed out without ever saying which field is missing. On mobile the price the customer is about to pay is not visible on the first screen.

**Top 10 fixes** (detail in the fix list):

1. Show the missing-field reason next to the disabled "Proceed to Payment" button, or enable it and show inline errors (F1).
2. Use real input types: `type="email"` with format validation, `type="tel"` with `inputmode="tel"`, `autocomplete` on name, email and phone, and a time picker (not free text) for arrival time (F2).
3. Reject pickup times inside a minimum lead window on both client and server; today a customer can pay for a pickup that has already passed or is 20 minutes away (F3).
4. On `/payment`, poll the booking while the status is `pending` instead of showing "Payment Not Found" to someone who just paid and beat the webhook (F4).
5. Put the refund line and the guarantee (if there is one) on the vehicle and details steps; the summary card's benefits block exists in code and is commented out (F5).
6. Move the WhatsApp button off the hero form on mobile; it covers the pick-up time field at 390 px (F6).
7. Add a price anchor above the fold: "Airport transfers from AED 170, hourly from AED 150" on the hero and service pages (F7).
8. Show the BMW 7-Series or explain its absence: the vehicles endpoint returns 5 of 6 cars for a DXB to Marina search and the page hides the sixth silently (F8).
9. Stop sending name, email and phone to GA4 in `booking_details_entered`; it breaches GA4 terms and adds nothing to the funnel measurement (F9).
10. Replace "Payment Not Found" with a state that names the booking reference and gives a WhatsApp link, for both the unpaid and the bad-id case (F10).

## Phase 0: stack and funnel map

Next 16 App Router frontend, Express 5 backend, Mongoose, Stripe Checkout (hosted). Booking state lives in `LimoBookingContext` and is mirrored to `localStorage.bookingData`, so refreshes and the Stripe cancel return preserve the booking. Prices come from `GET /api/bookings/available-vehicles` (zone-based pricing computed server-side; the client only echoes `totalPrice`). `POST /api/bookings` creates the booking, `GET /api/bookings/:id/payment-link` creates a Checkout Session with `success_url=/payment?id=<bookingId>` and `cancel_url=/book/booking-details`. The webhook is the shared `payments` handler with an atomic per-event claim and a stale-claim reclaim; duplicate deliveries cannot double-mark or double-email (CODE).

| Step | Route | What the user does | Guard |
|---|---|---|---|
| 1 | `/` and every service page | Point-to-point or hourly; pickup, drop-off (or hours), date, time | Toast on empty field; zone lookup on submit |
| 2 | `/book/select-limo` | Pick a vehicle from the list with prices | Redirects to `/` if the form data is missing |
| 3 | `/book/booking-details` | Name, email, phone, flight number and arrival time (airport trips), notes; Stripe is the only payment method | Redirects if no vehicle |
| 4 | Stripe Checkout | Pay | Hosted |
| 5 | `/payment?id=` | Confirmation | Shows success only when the webhook has marked the booking paid |

## Phase 1: funnel walk

| Step | Viewport | Observed | Evidence |
|---|---|---|---|
| Home first screen | 390 | Eyebrow, H1 "Book Your Dubai Chauffeur & Airport Transfer", 2-line subtitle, 4 trust bullets, then the form. The submit button is below the fold (page height 9,126 px). The WhatsApp pill sits on top of the "Pick-up time" field. No price anywhere on the first screen. | OBSERVED (`home-m-fold.png`) |
| Home first screen | 1440 | Form and "Select Your Vehicle" button fully in view; nav with four dropdowns and "Book a Ride". | OBSERVED |
| Empty submit | both | Toast "Please select your pickup location." Nothing inline; nothing on the field. | OBSERVED |
| Location search | both | Suggestions appear after 3 characters (Google Places via backend). "Dubai International Airport" returns DXB, DWC, a car park and a hotel, in that order. Picking "Dubai International Airport (DXB)" works. The list is rendered twice in the DOM (desktop and mobile variants both mounted). | OBSERVED |
| Date | both | Custom calendar, past days disabled, today allowed. | OBSERVED |
| Time | both | Custom three-column picker (hour, minute, AM/PM) then a "Set Time" button that only appears once hour and minute are chosen. On mobile it is a full-screen overlay. No default time, no "now + 2 h" shortcut, no minimum lead time. | OBSERVED, CODE |
| Submit to vehicles | both | Zone lookups, distance and available-vehicles calls complete in 760 ms (desktop) and 839 ms (mobile) on localhost. | OBSERVED |
| Vehicle list | both | Five cards with price "AED 170.00 / trip" style, passenger and bag counts, class. Kia Carnival and Lexus ES300 AED 170, GMC Yukon and V-Class AED 250, S-Class AED 430 for DXB to Dubai Marina Mall (40.2 km, zone-based). BMW 7-Series is missing: the API returned `results: 5` and the card component also hides any vehicle with `totalPrice === 0`. Nothing tells the user a car is unavailable. Every card carries the same generic description. | OBSERVED (`select-m-fold.png`), CODE |
| Selecting a vehicle | both | Ring highlight and tick; the "Enter Contact Details" button enables; mobile sticky bar shows the total. | OBSERVED |
| Details form | both | Six required fields for an airport trip. All inputs are `type="text"`, no `autocomplete`, no `inputmode`. "not-an-email" is accepted silently. "Proceed to Payment" stays disabled with no explanation until every field is non-empty. On mobile the total is only in the sticky bar; the order summary is below the fold. Stripe is the only payment option and is pre-selected. | OBSERVED (`details-m-fold.png`), CODE |
| Direct visit to `/book/select-limo` or `/book/booking-details` with no data | both | Redirects to `/`. Good. | OBSERVED |
| `/payment` with no id | both | "Payment Not Found" with a red X, no reference, no next step. | OBSERVED |
| `/payment?id=<unknown>` | both | Spinner, then nothing rendered inside the section (no heading at all) once the fetch fails. | OBSERVED |
| Stripe cancel | n/a | `cancel_url` returns to `/book/booking-details` with state intact from localStorage. | CODE |
| Success | n/a | Only shown when `payment.status === 'PAID'`. The webhook sets that; the redirect from Stripe usually beats the webhook by a few hundred milliseconds, so the first render after paying is the failure state. No polling, no retry. | CODE, INFERRED |

## Phase 2: first screen and message match

- The H1 says what the site sells and the form is the CTA. That is right for this category. OBSERVED.
- No price anchor. The one thing the GSC data says people compare on ("limo service dubai", "car rental dubai with driver") is cost, and the first screen says "Fixed Pricing" without a number. The vehicle step then reveals AED 170 to 430, which is competitive with a metered taxi on the same route. Show it earlier. INFERRED from GSC queries and observed prices.
- Service pages reuse the same hero and form, so a visitor from "abu dhabi to dubai transfer" lands on a page whose form is not pre-filled with Abu Dhabi and Dubai. Pre-filling pickup and drop-off from the page's intent would remove two of the four form interactions. CODE.
- The hero trust bullet says "Free Cancellation"; the terms say free only 24 hours or more before pickup. Not a contradiction, but the bullet should carry the condition. OBSERVED.
- The "Book Now" CTA at the bottom of the homepage now goes to `/book/select-limo`, which redirects straight back to `/` when there is no form data. A visitor who scrolled 9,000 px and clicked "Book Now" arrives at the top of the same page with no indication why. INFERRED from code paths, redirect OBSERVED on direct visit.

## Phase 3: trust, objections and risk reversal

| Signal | Present | Where | Evidence |
|---|---|---|---|
| Refund policy | Yes, 24 h full refund | Homepage benefits block, FAQs, terms | OBSERVED |
| Refund policy in the funnel | No | Neither step shows it; the summary card's benefits block (60 min waiting, water, multilingual chauffeurs) is commented out in `BookingSummary.js` | CODE |
| Guarantee | No | User says one exists; nothing on the site | User, OBSERVED |
| Reviews | Six named testimonials, no dates, no source, no rating, same six on every page | Homepage, service pages | OBSERVED |
| Third-party review platform | None linked | | CODE |
| Payment security | "Pay Securely with Stripe" plus Stripe, Visa, Mastercard, Apple Pay, Google Pay icons in the footer | Details step, footer | OBSERVED |
| Company identity | Address, phone, email in footer; "© TRAVL Technologies" | Footer | OBSERVED |
| What happens after paying | "Your driver will be assigned a day before your trip and their contact details will be shared with you via email" | Success page only | CODE |

The last row matters: the customer does not learn until after paying that the driver is only assigned the day before. For a traveller landing in 30 hours that is fine; for one booking three weeks out it is a reason to hesitate at the details step. Say it before payment, not after.

## Phase 4: forms, checkout and payment

| Field | Step | Type | Validation | Issue |
|---|---|---|---|---|
| Pick-up location | 1 | text with suggestions | Required (toast) | Fine. Airport entries are typed (`type: 'airport'`) and drive the flight fields later. |
| Drop-off location | 1 | text with suggestions | Required for point-to-point | Fine. |
| Hours | 1 (hourly) | custom select 1 to 8 | Required | No indication of the rate until the vehicle step. |
| Pick-up date | 1 | custom calendar | Past days disabled | Fine. |
| Pick-up time | 1 | custom 3-column picker | Required only | No minimum lead time, no default, no "ASAP". Backend `pickupTime: z.string()` accepts anything. A 10:00 pickup booked at 09:50 today is accepted and charged. |
| First / Last name | 3 | text | non-empty | No `autocomplete="given-name"` / `"family-name"`. |
| Email | 3 | text | non-empty | Not `type="email"`, no format check; the value is passed to Stripe as `customer_email`, so a typo means no receipt and no confirmation. |
| Phone | 3 | text with searchable country code, default +971 | non-empty | Not `type="tel"`, no `inputmode`, no length or digit check. The +971 default is right for the audience. |
| Flight number | 3 | text | non-empty on airport trips | Fine, has a placeholder. |
| Estimated arrival time | 3 | free text | non-empty on airport trips | No format hint and no picker; "10:30 AM", "10.30", "morning" are all accepted. This is the field ops depends on. |
| Notes | 3 | textarea | optional | Fine; placeholder suggests the child seat. |
| Payment method | 3 | one button, pre-selected | | Only Stripe; the selector is a step that cannot change anything. |
| Currency | 2 and 3 | AED switcher in the header | | Prices convert client-side using `selectedCurrency.rate`; Stripe is charged in the booking's currency. Fine. |

Checkout: Stripe Checkout hosted, `invoice_creation` on, promotion codes allowed, `customer_email` prefilled. The session is created fresh on every "Proceed" click; a booking already marked paid throws "already been paid", which surfaces as a toast. The webhook is idempotent per event id. Confirmation emails go to admin and customer via Brevo with per-recipient status tracking. CODE.

## Phase 5: states, feedback and failure

| State | Behaviour | Evidence |
|---|---|---|
| Empty required field, step 1 | Toast only, field not highlighted | OBSERVED |
| Missing field, step 3 | Button disabled, no message; `validateBookingForm()` computes the exact message and it is never rendered | CODE, OBSERVED |
| Pickup outside zones | Toast "Pickup location not covered." and the user stays on the form | CODE |
| Zone or distance API failure | Toast "Something went wrong fetching zones." | CODE |
| No vehicles returned | Empty list, no message, the summary says "Please select your limo" | CODE |
| Vehicles API error | Raw `Error loading vehicles: <message>` paragraph | CODE |
| Booking or payment-link failure | Toast with the server message | CODE |
| Paid, webhook not yet processed | "Payment Not Found" | CODE, INFERRED |
| Paid, webhook processed | Success with reference and trip details | CODE |
| Unknown booking id | Empty section after the spinner | OBSERVED |
| Stripe cancel | Back on details with data intact | CODE |
| Loading vehicles | Three skeleton cards | OBSERVED |

## Phase 6: mobile and speed as experience

- Homepage is 9,126 px tall at 390 px. The form is the only conversion point in the first two screens; the next is the "Book Now" CTA at the bottom, which as noted bounces to the top. OBSERVED, INFERRED.
- The WhatsApp pill (140x40, fixed bottom-right) overlaps the "Pick-up time" field on the first screen. OBSERVED (`home-m-fold.png`).
- The booking steps use a sticky bottom bar with the total and the next button on mobile. Good pattern. OBSERVED.
- The time picker is a full-screen overlay on mobile with three scroll columns and a "Set Time" button that appears only after two selections; nothing tells the user that AM is preselected. OBSERVED, CODE.
- Tap targets: the mobile menu button is 36x36; the FAQ accordion rows are 28 to 41 px tall; "View Full Fleet" and "Read More FAQs" are 40 px. All under the 44 px guideline. OBSERVED.
- Performance: PSI (supplied) reported 74 mobile with LCP 5.1 s and 3.1 MB of images. The image transforms shipped today cut the homepage's Cloudinary payload from about 6.2 MB to 681 KB (measured on production). LCP is unmeasured since.
- A React hydration warning fires on the homepage: the date and time field icons render one class on the server and another on the client because `LimoBookingContext` reads `localStorage` in the `useState` initialiser. Cosmetic today, but it means the first paint and the hydrated form can differ for returning visitors. OBSERVED in dev console, CODE.

## Phase 7: accessibility

- Step 1 inputs have visible labels but the `<label>` elements are not associated (`labels.length === 0` on every hero input). Step 3 inputs use a `Label` component that accepts `htmlFor` but `Input` never passes an id. OBSERVED, CODE.
- Time picker hours and minutes are `<p onClick>`; not focusable, not keyboard operable. CODE.
- Vehicle cards are `<div onClick>` with no role or key handler. CODE.
- Social icon links and the WhatsApp link got `aria-label`s today; the mobile menu button has one. OBSERVED.
- PSI flagged low contrast on muted text (`text-white/40`, `text-primary-500` on white) and unnamed links; the latter is fixed, the former is a design decision to revisit. Supplied PSI.

## Phase 8: analytics-informed findings

No GA4 data. What the code sends:

- `limo_form_submission`, `vehicle_selected`, `booking_details_entered`, `begin_checkout`, `purchase` are all defined and called. GA4 was not initialised until today's deploy, so none of it has ever recorded. CODE.
- `booking_details_entered` sends first name, last name, email, phone, flight number and free-text notes to GA4. That is PII in event parameters, which Google's terms prohibit, and it risks the property being disabled. CODE.
- `purchase` fires on every render of the success page; there is no dedupe on `transactionId`, so a refresh double-counts revenue. CODE. (The shared `frontend-shared/utils/analytics.js` has a `localStorage` dedupe for exactly this; the app's local `lib/analytics.js` does not use it.)
- Meta Pixel events are called but no Pixel base script is loaded anywhere, so they no-op. CODE.

## Fix list

| # | Issue | Where | Category | Evidence | Impact | Effort | Fix |
|---|---|---|---|---|---|---|---|
| F1 | "Proceed to Payment" disabled with no reason; the message exists in `validateBookingForm()` and is discarded | `/book/booking-details` | Feedback | OBSERVED, CODE | High | S | Render `error` under the button (and in the sticky bar on mobile) as `<p className="text-[13px] text-red-600 mt-2">{error}</p>`; or enable the button and toast the message on click, as step 1 does |
| F2 | Wrong input types, no format validation, free-text arrival time | `/book/booking-details` | Forms | OBSERVED, CODE | High | S | `type="email"` + regex check before enabling; `type="tel" inputmode="tel"`; `autocomplete` given-name, family-name, email, tel; replace "Estimated Arrival Time" with the same `SelectTime` picker used on step 1, label "Flight lands at" |
| F3 | No minimum lead time; past times today are accepted and charged | step 1 and `POST /api/bookings` | Funnel, ops | CODE | High | M | Decide the lead time (2 h is common); disable earlier slots in `SelectTime` when the date is today; reject in `validators.js` with "Pickups need at least 2 hours' notice. For sooner, WhatsApp us." |
| F4 | Success page shows "Payment Not Found" when the redirect beats the webhook | `/payment` | Failure | CODE, INFERRED | High | S | While `payment.status` is `pending`, poll `useGetBooking` every 2 s for up to 60 s with copy "Confirming your payment with Stripe"; show failure only after that |
| F5 | Refund line and guarantee absent from the funnel; benefits block commented out | `BookingSummary.js` | Trust | CODE | High | S | Re-enable `<Benefits />` with the true facts: "Full refund if you cancel 24 h or more before pickup", "60 min free airport waiting, 15 min elsewhere", "Tolls and VAT included"; add the guarantee if there is one |
| F6 | WhatsApp pill covers the pick-up time field at 390 px | `WhatsAppCTA.js` | Mobile | OBSERVED | High | S | On `lg:hidden` viewports, move the pill above the sticky bar or hide it while a form field is focused; or make it a 48 px icon-only circle bottom-left |
| F7 | No price on the first screen | hero on `/` and service pages | Clarity | OBSERVED, INFERRED | High | S | Add a fifth trust bullet or a line under the subtitle: "Airport transfers from AED 170. Hourly from AED 150. Tolls and VAT included." (170 is the lowest observed DXB fare; confirm the floor across zones before publishing) |
| F8 | One of six vehicles silently missing from results | `/book/select-limo`, pricing rules | Funnel | OBSERVED | Med | M | Check the BMW 7-Series zone pricing rules in admin; in the UI, list unavailable vehicles greyed with "Not available for this route" rather than dropping them |
| F9 | PII sent to GA4 | `lib/analytics.js` `trackBookingDetailsEntered` | Analytics, compliance | CODE | High | S | Send only `{ isAirportTransfer, hasNotes, tripType }` |
| F10 | "Payment Not Found" and the blank unknown-id state | `/payment` | Failure | OBSERVED | Med | S | One failure component: "We could not find this booking. If you paid, your reference is in the email from Stripe; message us on WhatsApp and we will confirm within minutes." with the WhatsApp link |
| F11 | `purchase` fires on every success-page render | `PaymentClient.js` | Analytics | CODE | Med | S | Dedupe on `transactionId` with `localStorage`, as the shared `trackPurchase` already does |
| F12 | Service pages do not pre-fill the form with the page's route | 12 service pages, `Hero` | Funnel | CODE | Med | M | Pass `defaults={{ pickup: 'Dubai International Airport (DXB)' }}` style hints per page into `LimoForm`; for hourly pages default the tab to Hourly |
| F13 | Bottom "Book Now" bounces to the top of the same page | homepage `ServiceCta` | Funnel | INFERRED | Med | S | Point it at `#booking-form` and give the hero form that id; keep `/book/select-limo` only for pages that carry state |
| F14 | Every vehicle card has the same description | `VehicleCard.js`, vehicle data | Clarity | OBSERVED | Med | S | Fill `description` per vehicle in admin (one line: who it suits) or drop the paragraph and let the pax/bags chips carry it |
| F15 | Payment method selector with one option | `/book/booking-details` | Friction | OBSERVED | Low | S | Remove the selector; keep the "Pay securely with Stripe" line and card logos |
| F16 | Driver assigned "a day before" is disclosed only after payment | success page | Trust | CODE | Med | S | Add to the details step under the button: "Your chauffeur's details are emailed the day before pickup. 24/7 WhatsApp support until then." |
| F17 | Time picker needs three taps and a hidden confirm; AM default unannounced | `SelectTime.js` | Friction | OBSERVED | Med | M | Use 15-minute slot list in one column (e.g. "10:30 AM"), or a native `<input type="time">` on mobile; always show the confirm button, disabled until valid |
| F18 | No message when zero vehicles come back; raw error on API failure | `SelectLimoClient.js` | Failure | CODE | Med | S | Empty state: "No vehicles are available for this route and time. Try another time or message us on WhatsApp."; error state with retry |
| F19 | Hero labels not associated; picker items not keyboard operable | step 1 form, `SelectTime`, `VehicleCard` | Accessibility | OBSERVED, CODE | Med | M | `htmlFor`/`id` pairs; `<button type="button">` for hour and minute items; `role="button" tabIndex={0}` and Enter handler on cards |
| F20 | Hydration mismatch from `localStorage` in the `useState` initialiser | `LimoBookingContext.js` | Mobile, correctness | OBSERVED, CODE | Low | S | Initialise with defaults and load `localStorage` in a `useEffect` |
| F21 | Tap targets under 44 px (menu 36 px, FAQ rows 28 px) | header, FAQs | Mobile | OBSERVED | Low | S | `min-h-11` on the menu button and accordion headers |
| F22 | Testimonials unsourced and identical on every page | home, service pages | Trust | OBSERVED | Med | M | Pull real reviews with dates from Google Business Profile or remove; never the same three on every page |
| F23 | Meta Pixel events without a base script | `lib/meta.js` | Analytics | CODE | Low | S | Load the Pixel or delete the calls |

## Top 10 highest-leverage fixes

F1, F2, F3, F4, F5, F6, F7, F8, F9, F10. Together they remove every silent failure in the funnel (F1, F4, F8, F10), stop bad data reaching Stripe and ops (F2, F3), and put the two things buyers compare on, price and refund terms, in front of them before they commit (F5, F7). F6 is a one-line layout fix on the single most-used screen. F9 is a compliance risk to the analytics you switched on today.

## Test these, don't just ship them

- **F7 price anchor**: "from AED 170" could attract price shoppers who then see AED 430 for the S-Class and leave. Test the hero with and without the number for two weeks once GA4 has data.
- **F15 removing the payment selector**: low risk, but some buyers read the Stripe line as reassurance. Keep the copy, drop the button, watch begin_checkout to purchase.
- **F12 pre-filled forms**: pre-filling drop-off on route pages helps when it is right and irritates when it is wrong (a Dubai to Abu Dhabi visitor wanting the reverse). Pre-fill pickup only, or offer a swap button.
- **F17 time picker**: a single slot list is faster for most, but a native input may win on iOS. Try the native input on mobile first because it is a one-line change.

## What was not verified

- No booking was created and no Stripe session opened (shared production database). F4's race is inferred from the code order and Stripe's documented redirect timing, not observed.
- Core Web Vitals after today's image fix.
- The hourly funnel end to end (the hourly tab and `SelectHours` were read, not driven).
- Whether a guarantee exists; the audit scores trust on what the site shows.
- The BMW 7-Series pricing rules were not inspected in admin; only the API result (5 of 6) was observed.
