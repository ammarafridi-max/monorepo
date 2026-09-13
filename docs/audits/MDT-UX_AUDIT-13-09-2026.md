# My Dummy Ticket UX and Conversion Audit

Date: 13 September 2026
Branch: `master` at `a41ea75` (working tree had unrelated uncommitted Picturesk changes; nothing under `apps/mdt-*` was modified)
Environment: `mdt-frontend` on `http://localhost:3200` (Next dev), `mdt-backend` on `http://localhost:3201`, started for this audit and shut down after. Ports 3000/3001 were occupied by another app and were left alone. `next dev` auto-generated `apps/mdt-frontend/AGENTS.md` and `CLAUDE.md`; both were deleted so the tree is unchanged.

## Instruments

- Real browser: YES. Headless Google Chrome 152 driven over CDP. Every funnel page was rendered at 390x844 (touch emulation, iPhone UA) and 1440x900, screenshotted and inspected via DOM queries. Empty-submit validation, airport autocomplete, date picking, the live flight search (one real SerpApi search, DXB to LHR, 15 Oct 2026, reused from cache after), flight selection, partial passenger-form entry, direct entry to every booking step, an unknown sessionId on the success page and the 404 page were all exercised in the browser.
- NOT exercised: creating a ticket (`POST /api/tickets`) and paying. Dev and prod share one MongoDB (see below), so no order was written. Review page, Stripe redirect, webhook and success page are assessed from code only.
- Analytics: NO access to GA4. Phase 8 is skipped.
- Competitors: none named. Phase 9 is skipped.
- Core Web Vitals: NOT measured. The app ran in `next dev`; load times, bundle size and CLS are not representative and are not reported.
- Database: **dev and prod point at the same MongoDB** (verified by hashing the `MONGO_URI` line of `.env.development` and `.env.production`, not printed). Any follow-up fix script runs against production data.

Evidence tags: **OBSERVED** (rendered or executed), **CODE** (read in the repo), **INFERRED** (reasoned from either).

## INPUTS

| Field | Value | Source |
|---|---|---|
| Primary conversion event | Paid Stripe Checkout for a dummy ticket (`checkout.session.completed` marks the ticket PAID, GA4 `purchase` fires on `/booking/payment`) | User |
| Secondary conversions | Travel insurance purchase (separate `/insurance-booking` funnel, out of scope here), hotel reservation by email, email contact | CODE |
| Known symptom | None stated; general health check | User |
| Risk reversal | Refund only where a visa was refused because the flight reservation was expired or invalid, with proof of rejection | User |
| House facts | Prices AED 49 / 69 / 79 for 2 / 7 / 14 days validity, per person, same for one way and return. Delivery is manual: an agent uploads a PDF from the admin (`sendReservation`), and the FAQ says 10 to 15 minutes during 09:00 to 21:00. Support is email only (`info@mydummyticket.ae`). | CODE (please confirm) |
| Traffic sources | Not provided. SEO landing pages per intent (Schengen, US, Emirates, Etihad, onward ticket, flight itinerary) and a blog are the visible investment. | INFERRED |
| Funnel | Landing page hero form, then `/booking/select-flights` (results plus an inline passenger form inside the selected card), then `/booking/review-details`, then Stripe Checkout, then `/booking/payment?sessionId=` | CODE + OBSERVED |

The refund fact you gave appears nowhere on the site. The FAQ says "No, we do not offer any refunds or money-back guarantee" and the T&C say "non-refundable except in cases of system failure or when the service is not delivered as described". See F1.

## Executive summary

| Bucket | Score | Weight |
|---|---|---|
| Clarity and message match | 68 | 20% |
| Funnel friction | 50 | 25% |
| Trust and risk reversal | 45 | 20% |
| Forms and checkout | 60 | 15% |
| States, feedback and failure handling | 40 | 10% |
| Mobile and performance experience | 60 (partial, no CWV) | 10% |
| **Overall (weighted)** | **55** | |

All scores are based on what was rendered or read. Nothing in the paid half of the funnel was observed working, so the checkout and success-page scores are code-based.

**Highest drop-risk step:** the passenger form that unfolds inside the selected flight card on `/booking/select-flights`. It asks for title, first name, last name, email, phone, validity, delivery type and an optional message, and its only CTA ("Review Your Information") sits disabled with no explanation until every field validates. The title `<select>` is required but looks optional, the phone country defaults to +44 for a UAE brand, and there is no analytics event between `flight_search` and `begin_checkout`, so whatever is lost here is invisible in GA4.

**Top 10 fixes** (detail in the fix list):

1. Put the real refund policy on the site and remove the two contradictory versions (F1).
2. Make one delivery-time claim and use it everywhere: the FAQ says 10 to 15 minutes in working hours, the onward-ticket page says "10–15 minutes, 24/7. No waiting for business hours", the homepage says "automated process" and "Instant Delivery" (F2).
3. On `/booking/payment`, poll the ticket while `paymentStatus` is UNPAID instead of showing "Payment not found" to a customer who has just paid (F3).
4. Show inline errors on the passenger form and enable the button, or list what is missing under it (F4).
5. Default the phone country to +971 (F5).
6. Redirect direct or refreshed visits to `/booking/select-flights` and `/booking/review-details` back to the form when there is no search or session, instead of a 7.5s skeleton then "Failed to load flights, email us" (F6, F7).
7. Add a second conversion point on the 9,293px mobile homepage: a "Book from AED 49" button under the pricing table and a sticky mobile bar that scrolls to the form (F8).
8. Fire a `select_flight` and a `passenger_form_submit` event so the drop between search and checkout is measurable, and do not wire the existing `trackFlightFormSubmission`, which would send email and phone to GA4 (F9).
9. Fix the pricing table on mobile: the "Best for" column is clipped behind a horizontal scroll at 390px (F10).
10. Fix the footer: "© 2025 . All rights reserved." with an empty company name, and one year behind (F11).

## Phase 0: stack and funnel map

Next.js 16 App Router, React 19, Tailwind v4, TanStack Query, react-hot-toast, GA4 through `react-ga4`. Backend Express 5 with the `tickets`, `flights`, `payments`, `insurance`, `affiliates`, `blog` domains. Flight results come from SerpApi (Google Flights), airport autocomplete from AirLabs. Payment is hosted Stripe Checkout (`payment_method_types: ['card']`, `customer_email` prefilled, `invoice_creation` on, idempotency key = ticket sessionId). PayPal exists in code but `enablePayPal` is false for MDT. **CODE**

State model: the search (type, from, to, dates, quantity) lives only in React context (`TicketContext`); only email, phone and affiliate attribution are persisted to localStorage. After the passenger form posts, the server-issued `SESSION_ID` is stored in localStorage and the review page fetches the ticket by it. Success page reads `sessionId` from the Stripe redirect URL and clears localStorage. **CODE**

Webhook: signature-verified, deduplicated by Stripe event id in a `stripe-webhook-event` collection, `paidAt` guarded with `{ paidAt: null }` so a resend cannot rewrite it. Customer gets an "Order confirmed" email; the admin email is deliberately disabled and admins rely on the in-app paid-order stream. **CODE**

Public routes with the ticket form: `/`, `/dummy-ticket-schengen-visa`, `/dummy-ticket-us-visa`, `/emirates-dummy-ticket`, `/etihad-dummy-ticket`, `/onward-ticket`, `/flight-itinerary`. All share `Hero` + `AllForms` (ticket and insurance tabs). **CODE**

## Phase 1: funnel walk

| Step | URL | What a visitor sees | Evidence | Risk |
|---|---|---|---|---|
| Entry | `/` (390px) | Dark hero, H1 "Dummy Ticket From AED 49. Verifiable and Legit.", 4 pills, Ticket / Travel Insurance tab toggle, then the search form. Form starts at y=498, "Search Flights" at y=997. Page is 9,293px tall. | OBSERVED | Medium: price and promise are in the first screen, but the form's submit is 1.2 screens down and there is no other CTA on the whole page (the only other matching link is a blog title at y=6,764). |
| Entry | `/` (1440px) | Form beside the H1, submit at y=536, fully above the fold. | OBSERVED | Low. |
| Empty submit | click "Search Flights" | Three inline red errors under From, To, Departure Date; first field is focused and scrolled to. | OBSERVED | Low. Works. |
| Airport search | type "Dubai" | Suggestions "DUBAI (DXB)", "DUBAI (DWC)" after about 0.9s per keystroke (AirLabs 650 to 890ms). Minimum 3 characters. | OBSERVED | Low-medium: each keystroke past 3 chars is a live AirLabs call with no debounce visible in the log ("Dub", "Duba", "Dubai" all hit the API). |
| Date | open picker | Custom calendar, past days disabled. | OBSERVED | Low. |
| Results | `/booking/select-flights` | Stepper "Step 1 of 3", 5 Emirates DXB to LHR cards, each "AED 49.00 / person" with a grey "Select Flight" pill, "Load More Flights". SerpApi took 0.5 to 1.9s. | OBSERVED | Low-medium: every card shows the same AED 49 because price depends on validity, not the flight. A visitor who reads it as a flight price is confused; one who wanted a specific airline has no filter. |
| Passenger form | click "Select Flight" | Card expands with Title / First / Last, email, phone (+44 default), validity radios (2 Days selected), delivery type radio, Special Requests, and a disabled "Review Your Information" button at y=1,030. | OBSERVED | **High**: see drop-risk note. With first name, last name, a valid email and 9 phone digits filled, the button stays disabled because Title is empty, and nothing says so. |
| Refresh or direct entry | `/booking/select-flights` | 3 skeleton cards for 7.45s, then "Failed to load flights. We couldn't load flights at this time. Email us your route, dates, and passenger names and we'll help you out." with a "Send email" button. The backend returned 400 in 1 to 7ms; the delay is TanStack's three default retries. | OBSERVED | **High**: a back-button or refresh anywhere in step 1 loses the search and the copy sends the buyer to email instead of back to the form. |
| Review | `/booking/review-details` | Not reachable without writing a ticket. From code: Flight, Booking and Passenger cards, sticky order summary, custom checkbox for T&C, "Pay AED X" button that is disabled until the box is ticked. | CODE | Medium: the terms checkbox is a `div` with an `onClick`, not an `<input>`, so keyboard and screen-reader users cannot tick it. |
| Review with no session | `/booking/review-details` direct | Full page renders with every value as "—", "Passengers 0", "Total AED 0.00", and a "Pay AED 0.00" button. | OBSERVED | Medium: after a completed purchase the SESSION_ID is cleared, so pressing back from the success page lands here. |
| Stripe Checkout | hosted | Not observed. `success_url` = `/booking/payment?sessionId=`, `cancel_url` = `/booking/review-details`. | CODE | Low. |
| Success | `/booking/payment?sessionId=` | If the ticket is already PAID: "Booking Confirmed!", amount, "What's next" (two emails, check spam), insurance upsell from AED 30. If still UNPAID: "Payment not found. We couldn't find a successful payment linked to this booking. If you were charged, please contact our support team". No polling, no retry. | CODE | **High**: Stripe redirects the browser before or while the webhook is delivered. Any webhook latency at all shows the failure copy to a customer who has just paid. Frequency is not known without GA4 or logs. |
| Success with bad session | `?sessionId=does-not-exist` | Spinner 7.9s (retries again), then "Payment not found". | OBSERVED | Low. |
| Unknown URL | `/this-does-not-exist` | Proper 404 with "Go Back Home". | OBSERVED | Low. |

## Phase 2: first screen and message match

- Verdict-first hero, price in the H1, a plain-English definition in the subtitle, four proof pills. This is the strongest part of the site. **OBSERVED**
- Message drift on the landing pages: `/flight-itinerary` H1 "Flight Itineraries for Travel from AED 49" and `/onward-ticket` H1 "Onward Ticket From AED 49" both lead to the same "Search Flights" form and the same product; the results page then calls it a "Flight Reservation" (Stripe line item) and the emails call it a "dummy ticket". Name the product one way after the click. **CODE + OBSERVED**
- "Delivered in Minutes" pill on `/`, `/onward-ticket`, `/flight-itinerary`; "Instant Delivery ... Our automated process" on `/`; "Our automated system delivers your onward ticket ... within 10–15 minutes, 24/7. No waiting for business hours" on `/onward-ticket`; FAQ: "created and sent within 10 to 15 minutes ... during working hours only (09:00 AM - 09:00 PM)"; confirmation email: "Most orders are delivered within 15 minutes during working hours". Delivery is a manual PDF upload by an agent. A buyer at 23:00 who read the onward-ticket page has been promised something the FAQ withdraws. **CODE + OBSERVED**
- `/flight-itinerary` says "24/7 Customer Support"; `/onward-ticket` says "responds within 2 hours"; the success page says "We usually reply within a few hours". Pick one. **OBSERVED + CODE**
- Every result card shows "AED 49.00 / person" regardless of the flight. Nothing on that page explains that the price is per validity period and the same for all flights until the form is open. **OBSERVED**

## Phase 3: trust, objections and risk reversal

- **Refund policy contradiction.** You state refunds are given where a visa was refused because the reservation was expired or invalid, with proof. The FAQ (`src/data/faqs.js`) says "No, we do not offer any refunds or money-back guarantee." The T&C say "non-refundable except in cases of system failure or when the service is not delivered as described" and require contact within 24 hours. The Schengen page FAQ says "refunds are not offered after delivery". Three different policies, none of them yours. A buyer worried about "will this get me rejected" finds the worst possible answer on the FAQ page. **CODE + OBSERVED**
- Testimonials (David S., Maria K., Ahmed R.) are hard-coded in `src/app/page.js` and duplicated in `src/data/testimonials.js` with no source, date or link. There is a Brevo review list (`reviewListId`) so reviews are being collected somewhere; nothing on the site points to it. I cannot verify whether these are real. **CODE**
- Footer shows Stripe, G Pay, Apple Pay, Visa, Mastercard badges. Checkout is created with `payment_method_types: ['card']`; wallets appear only if enabled in the Stripe dashboard. Not verified either way. **CODE**
- Footer reads "© 2025 . All rights reserved." (empty `copyrightName`, year hard-coded). **OBSERVED**
- On dark headers the logo is rendered with `brightness-0 invert`, which turns the teal disc with a white plane into a plain white disc. Every hero shows a blank circle next to the wordmark. **OBSERVED**
- Support is email only. No phone, no WhatsApp, no chat, no business hours on the contact section. The section title "Talk to a real person" leads to a mailto. **OBSERVED**
- Legal entity "TRAVL Technologies, Abraj Al Mamzar, Dubai" is in brand config and schema.org; it is not shown on the page footer or T&C page render that I checked. **CODE**
- The "Hotel Reservations" service card on the homepage has no price and says "just reach out". **OBSERVED**

## Phase 4: forms, checkout and payment

| Form | Fields | Validation | Evidence | Findings |
|---|---|---|---|---|
| Hero search | trip type, from, to, departure, return (if Return), adults/children/infants | On submit; inline errors; focus and scroll to first error; passengers capped 1 to 9 via toast | OBSERVED | Good. Trip type uses clickable `div`s with a circle icon, not radio inputs (keyboard-inaccessible). Counter buttons are 28x28. |
| Passenger form (inside flight card) | per passenger: title (select), first, last; email; phone (country + digits); validity (3 radios); delivery now / later (+ date); message | Continuous; button disabled until valid; no messages | OBSERVED | Silent disable. Title looks optional. Phone defaults to GB. Email/phone are remembered in localStorage across visits (good). Labels are not associated with inputs (`Label` has no `htmlFor` for these). |
| Review | agree checkbox | Button disabled until ticked | CODE | Checkbox is a `div onClick` inside a `<label>`; no `<input type=checkbox>`, so no keyboard toggle. "Secured by 256-bit SSL encryption" is filler text. |
| Stripe Checkout | hosted | Stripe | CODE | Email prefilled, invoice on, idempotency key set. Good. Line item name "One Way Flight Reservation" does not include validity or passenger count; the customer sees one line, one price. |

Checkout correctness: the server recomputes the total from the ticket and the pricing service, ignoring any client-sent amount. Currency conversion runs server-side. Webhook is idempotent on event id and on `paidAt`. No double-issue path found. **CODE**

## Phase 5: states, feedback and failure

- **Success page race (F3).** `PaymentSuccessContent` fetches the ticket once (`useGetDummyTicket`, no `refetchInterval`) and renders `ErrorState` if `paymentStatus === 'UNPAID'`. The webhook is what flips it to PAID. Stripe's redirect and the webhook are independent; the redirect regularly lands first. The customer then reads "Payment not found ... If you were charged, please contact our support team", and the `purchase` GA4 event never fires for that session. A refresh a few seconds later would show success, but nothing tells them to refresh. **CODE**
- **Direct entry to step 1 (F6).** `useFlights` posts empty from/to, gets a 400, and TanStack retries three times with backoff. The user watches skeletons for 7.45s, then is told to email. The right response is a redirect to the form with the message "Your search expired, please search again". **OBSERVED**
- **Step 2 with no session (F7).** Renders a complete empty page with "Pay AED 0.00" rather than redirecting. **OBSERVED**
- Zero flights: `TicketSelectFlightsPage` throws `new Error('No flights available for this route.')` on an empty array, which drops into `select-flights/error.js`. Not triggered in this audit. **CODE**
- Stripe URL failure: a toast "Could not get payment URL. Please send us an email." Reasonable, but the button re-enables with no retry hint. **CODE**
- Passenger form submit failure: `toast.error(err.message)` with the raw server message. **CODE**
- 404 page is correct. Global `error.js` exists. **OBSERVED + CODE**

## Phase 6: mobile and speed as experience

- No horizontal overflow on any page at 390px. **OBSERVED**
- Pricing table (`PricingTiers`) has `min-w-[520px]` inside `overflow-x-auto`; at 390px the "Best for" column is clipped and the table scrolls sideways. This is the section that answers the H2 "How Much Does a Dummy Ticket Cost?". **OBSERVED**
- Tap targets under 40px: hero counter buttons 28x28, "Search Flights" 319x34, footer links 18 to 21px tall, "Read all FAQs" 93x18. **OBSERVED**
- Homepage is 9,293px on mobile with one conversion point at the top. Landing pages are 8,275px (Schengen) and 9,994px (onward). No sticky CTA, no mid-page CTA. **OBSERVED**
- Next dev warnings: `/logo.webp` has width or height set without the other; `/happy-traveler1.webp` is the LCP on desktop and lacks `priority`; `scroll-behavior: smooth` on `<html>` without `data-scroll-behavior`, which Next warns can make route transitions scroll visibly. **OBSERVED (console)**
- Ticket form and insurance form are code-split so only the visible tab ships. **CODE**
- CWV: not measured (dev server).

## Phase 7: accessibility

- Trip type selector and the terms checkbox are non-focusable `div`s. **CODE + OBSERVED**
- Passenger form `Label`s have no `htmlFor`; inputs rely on placeholders ("First Name", "Last Name", "50 123 4567"). **CODE**
- Delivery-type radios have no `name` and no label association; the info tooltip is a `span` with `aria-label` but no role or keyboard trigger. **CODE**
- Result cards: "Select Flight" buttons have no accessible name that includes the flight; five identical buttons for a screen reader. **OBSERVED**
- Images have alt text (0 missing on the homepage). **OBSERVED**

## Phase 8 and 9

Skipped: no GA4 access, no competitors named.

## Fix list

| # | Issue | Where | Category | Evidence | Impact | Effort | Fix summary |
|---|---|---|---|---|---|---|---|
| F1 | Three contradictory refund policies, none of them the real one | `src/data/faqs.js` "Is there a money-back guarantee?", T&C "Payments & Refund Policy", Schengen page FAQ | Trust | CODE + OBSERVED | High | Low | Replace the FAQ answer with: "Yes, in one case. If your visa is refused because the flight reservation we sent was expired or invalid, send us the refusal letter and we refund the order in full. Refunds are not offered for a change of plans or for a refusal on other grounds." Put the same two sentences in the T&C refund clause and on the Schengen FAQ. Add a one-line "Refund if our reservation causes a refusal" pill or note beside the validity radios. |
| F2 | Delivery-time claims disagree with each other and with how delivery works | `/` benefits and hero pills, `/onward-ticket` benefits, `/flight-itinerary` benefits, FAQ, confirmation email | Clarity | CODE + OBSERVED | High | Low | Pick the FAQ version as the truth. Change every "Instant Delivery" and "automated" line to "Sent within 15 minutes, 09:00 to 21:00 Gulf time" and delete "24/7. No waiting for business hours" on `/onward-ticket`. Add to the success page "What's next": "Our team sends tickets between 09:00 and 21:00 Gulf time. Orders placed outside those hours go out first thing in the morning." |
| F3 | Success page shows "Payment not found" until the webhook lands | `TicketPaymentPage.js` `PaymentSuccessContent`, `useGetDummyTicket` | States | CODE | High | Low | In `useGetDummyTicket` (or a wrapper on the payment page) set `refetchInterval: (q) => q.state.data?.paymentStatus === 'UNPAID' ? 2000 : false` for up to 60s. While UNPAID and under the limit, render "Confirming your payment with Stripe..." with a spinner. Only after the limit render the current error, and change its copy to "We have not received Stripe's confirmation yet. If your card was charged, your ticket is safe: reply to the Stripe receipt or email us with the sessionId shown here." Show the sessionId. |
| F4 | Passenger form button is disabled with no explanation | `FlightForm.js` | Forms | OBSERVED | High | Low | Keep the button enabled. On submit, run the same checks and render a `FieldError` under each failing field ("Choose a title", "Enter a valid email", "Enter your phone number") and focus the first. Alternatively keep it disabled but render a one-line list under it: "Still needed: title for Adult 1, phone number". Mark Title visibly required. |
| F5 | Phone country defaults to United Kingdom | `PhoneInput.js` line 100 | Forms | OBSERVED + CODE | Medium | Low | Accept a `defaultCountry` prop and pass `'AE'` from MDT's page; fallback in the shared component stays GB only if nothing is passed. |
| F6 | Refresh or direct entry on step 1 shows 7.5s of skeletons then "email us" | `TicketSelectFlightsPage.js`, `useFlights.js` | States | OBSERVED | High | Low | In `useFlights` set `enabled: !!(from && to && departureDate)` and `retry: false` for 4xx. In the page, when `from`/`to` are empty, `router.replace('/?expired=1')` and on the homepage show a toast "Your search expired, please search again". Optionally persist the search fields to sessionStorage in `TicketContext` so a refresh survives. |
| F7 | Step 2 with no session renders "Pay AED 0.00" | `TicketReviewDetailsPage.js` | States | OBSERVED | Medium | Low | If `!sessionId`, `router.replace('/')`. If `isErrorDummyTicket` or `totalQuantity === 0`, render a "Start a new booking" card instead of the summary. |
| F8 | One conversion point on a 9,293px mobile page | `src/app/page.js` and the six landing pages | Friction | OBSERVED | High | Medium | Add a `PrimaryButton` "Book from AED 49" under the pricing table and after the FAQ, both linking to `#form`. Add a sticky bottom bar on mobile (hidden while the form is in view) with "From AED 49 · Book now" that scrolls to `#form`. |
| F9 | No event between `flight_search` and `begin_checkout`; an unused tracker would send PII | `FlightCard.js`, `FlightForm.js`, `analytics.js` `trackFlightFormSubmission` | Analytics | CODE | High | Low | Fire `select_item` (GA4 ecommerce name) from `handleSelectFlight` and `add_to_cart` from `FlightForm` submit success with `{ ticketValidity, passengers: count, tripType }` only. Delete `trackFlightFormSubmission` or strip `email`/`phoneNumber` from it before anyone wires it. |
| F10 | Pricing table clips "Best for" on mobile | `src/components/PricingTiers.js` | Mobile | OBSERVED | Medium | Low | Drop `min-w-[520px]`; on `<md` render three stacked cards (validity, price, best-for) instead of a table. |
| F11 | Footer "© 2025 . All rights reserved." | `Footer.js` line 64 and `AppLayout` props | Trust | OBSERVED | Low | Low | Use `new Date().getFullYear()` and pass `copyrightName="My Dummy Ticket"` (or the legal entity) from MDT's `Providers.js`. |
| F12 | Every result card shows "AED 49.00 / person" with no explanation | `FlightCard.js`, `TicketSelectFlightsPage.js` | Clarity | OBSERVED | Medium | Low | Add one line above the list: "Every reservation costs the same. Pick any flight, then choose how long it stays valid (2, 7 or 14 days)." Change the card price caption to "AED 49 / person · 2-day validity". |
| F13 | Testimonials unsourced | `src/app/page.js`, `src/data/testimonials.js` | Trust | CODE | Medium | Medium | Replace with quotes that carry a date and a source (Google, Trustpilot or the Brevo review responses) and link the section title to the source profile. If no public profile exists, remove the section rather than keep unverifiable quotes. |
| F14 | Terms checkbox and trip-type selector are non-focusable divs | `TicketReviewDetailsPage.js`, `TicketForm.js` | Accessibility | CODE + OBSERVED | Medium | Low | Use a visually hidden `<input type="checkbox">` inside the label and `<input type="radio" name="tripType">` for One Way / Return. |
| F15 | Support promises differ: "24/7", "within 2 hours", "a few hours"; email only | `/flight-itinerary`, `/onward-ticket`, success page, Contact section | Trust | OBSERVED + CODE | Medium | Low | State one thing everywhere: "Email support, replies within 2 hours between 09:00 and 21:00 Gulf time" (or whatever is true). If WhatsApp is answered, pass `whatsappNumber` to `Contact`, which already supports it. |
| F16 | Logo renders as a blank white disc on dark headers | `MobileNavigation.js` / `Navigation.js` `brightness-0 invert` | Trust | OBSERVED | Low | Low | Ship a `logo-white.webp` with the plane cut out and swap `src` on `onDark` instead of filtering. |
| F17 | Airport autocomplete calls AirLabs on every keystroke after 3 chars | `SelectAirport.js` | Performance | OBSERVED (backend log) | Low | Low | Debounce the query 250ms. |
| F18 | Stripe line item hides validity and passenger count | `service.js` `createStripePaymentUrl` | Checkout | CODE | Low | Low | `product_data.name`: "Dummy ticket, 7-day validity, 2 passengers (DXB to LHR)". |
| F19 | LCP image without priority, logo sizing warning, smooth-scroll warning | `layout.js`, hero image component, `globals.css` | Performance | OBSERVED (console) | Low | Low | Add `priority` to the hero image, set both width and height on the logo, add `data-scroll-behavior="smooth"` to `<html>`. |

## Top 10 highest-leverage fixes

F1, F2, F3, F4, F5, F6, F8, F9, F10, F11.

## Test these, don't just ship them

- F8 sticky mobile CTA bar: it can cannibalise the hero form or annoy readers on long SEO pages. Run it on `/` and `/onward-ticket` first and compare `flight_search` per session.
- F12 price caption wording: "2-day validity" in the card may push buyers to the cheapest option; compare average order value before and after.
- F4 enabled-button-with-errors versus disabled-button-with-hint list: both are defensible; measure `add_to_cart` per `select_item` (after F9 ships).

## What was not verified

- Review page, Stripe Checkout, webhook processing and the success page were not executed because dev and prod share the database. F3 is a code reading, and its frequency in production is unknown.
- Whether Apple Pay and Google Pay actually appear in Checkout.
- Whether the testimonials are real.
- Core Web Vitals and real load times.
- The mobile hamburger menu was not opened (selector did not match in the script); nothing is claimed about it.
