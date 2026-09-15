# Picturesk UX and Conversion Audit

Date: 13 September 2026

## Environment audited

| Item | Value |
|---|---|
| Frontend | `apps/picturesk-frontend`, `next dev -p 3010`, http://localhost:3010 (port 3000 was held by another app's dev server) |
| Backend | `apps/picturesk-backend` `src/server.js` on http://localhost:3001 (worker not started) |
| Branch / commit | `master` @ `a41ea75`, plus 31 uncommitted modified files under `apps/picturesk-*` in the working tree. The render reflects the working tree, not the commit alone. |
| Production cross-check | `https://www.picturesk.ai/ai-headshot-generator` fetched once (HTML only) to confirm two findings are live |
| Database | Dev API connects to an Atlas database named `headliner-ai`. The production `MONGODB_URI` is a Fly secret and is not in the repo, so whether dev and prod share a database is **not verified**. No checkout was submitted and no order was written during this audit. |

## Instruments

- **Real browser: YES.** Headless Google Chrome driven over the DevTools Protocol with device metrics emulation at 390x844 (mobile, touch) and 1440x900. Full page screenshots taken of the landing page, Select, Upload, Payment and Cancel. Success was not rendered with a real order (that needs a paid order; none was created).
- **Screenshots: YES**, stored in the session scratchpad only, not committed.
- **Analytics: NO.** Plausible, GA4 and Clarity are wired in code but no dashboard access was given. Phase 8 skipped.
- **Competitors: none named.** Phase 9 skipped.
- Core Web Vitals were measured against the dev server. LCP and CLS numbers below are indicative only; dev mode is not production.

Every finding is tagged **OBSERVED** (rendered or ran it), **CODE** (read it) or **INFERRED** (reasoned).

## INPUTS

| Field | Value | Source |
|---|---|---|
| Product | Picturesk, AI headshot generator, one-time purchase | repo |
| Primary conversion event | Paid order completed (`checkout.session.completed` → order PAID) | user |
| Known symptom | None, general health check | user |
| Risk reversal | Money-back guarantee | user |
| Funnel | `/ai-headshot-generator` → `/select` → `/upload` (optional `/capture`) → `/payment` → Stripe Checkout → `/success` | code |
| Prices | Starter $9 / 5 shots, Pro $29 / 25 shots (popular), Premium $49 / 60 shots | `packages/picturesk-shared/src/pricing.js` |
| House facts (inferred, please correct) | 1) One-time payment, no subscription. 2) Delivered by email in about an hour. 3) Automatic refund if a run fails. 4) Look-like-you guarantee: full refund within 14 days if the set does not look like you. 5) Photos are checked before payment. 6) No account required to buy. | copy in `sections/*`, `data/faq.js`, `data/legal.js` |

House fact 4 is contradicted inside the product. See T1.

## Executive summary

Weights: Clarity 20, Funnel friction 25, Trust 20, Forms and checkout 15, States 10, Mobile and performance 10.

| Bucket | Score | Basis |
|---|---|---|
| Clarity and message match | 62 | Verdict-first hero with price and promises is strong. But the loudest proof image under "Headshots that don't look AI" is served at half resolution on phones, all proof is one person, and pricing sits 8.5 screens down on mobile. |
| Funnel friction | 55 | Select is one 3,392px page with 45 controls and a disabled Continue that never says what is missing. The plan the visitor chose on the pricing section is not carried into the funnel. Full nav and 17-link footer stay visible on every step. |
| Trust and risk reversal | 38 | Three invented testimonials with invented star ratings are live in production. The headline guarantee is contradicted by the Refund Policy and Terms. |
| Forms and checkout | 68 | Stripe hosted checkout, email prefilled, photos gated before payment, clean review step. No payment confirmation email, tier limits unenforced. |
| States, feedback and failure handling | 60 | Good live progress UI and automatic refund. But the success page says an email was sent before it was, and tells a buyer to expect minutes when the site promised an hour. |
| Mobile and performance experience | 66 | No horizontal overflow, CLS 0. Hero LCP image is upscaled 1.8x on mobile, footer links are 22px tall, option carousels clip. |
| **Overall (weighted)** | **57** | Projected. Nothing has been changed or re-measured. |

**Single highest drop risk step (INFERRED, no analytics):** the Select step. It is the first step after the click, it is 3.4k px tall on a phone, asks for gender, age, race and email before the visitor has seen a single sample of their chosen background, and its only forward control is greyed out with no reason.

### Top 10 fixes

1. Replace the three invented testimonials with real quotes or remove the section (T1 in the table, live in prod).
2. Make the guarantee consistent everywhere: add the 14-day look-like-you clause to `/refunds` and `/terms`, or remove it from the hero, payment step, FAQ and delivery email.
3. Pass `sizes` for the hero frames so the LCP image is not upscaled on phones.
4. Carry the plan from the pricing cards into the funnel (`/select?tier=pro`) and default to Pro, the plan the badge already calls most popular.
5. Enforce `attireCount` and `lookCount` on the Select step and in `/checkout`, or stop printing those limits on the pricing cards.
6. Tell the visitor what is missing when Continue is disabled ("Pick a background and an outfit, then add your email").
7. Send a payment confirmation email on the webhook, and change the success page footer line to match reality.
8. Fix the success page timing copy to match the hour the site promises.
9. Hide the marketing nav and footer inside the funnel; keep the wordmark, the stepper and a "Need help?" mail link.
10. Add a second real person, ideally a woman, to the hero cluster and showcase.

## Phase 0: stack and funnel map (CODE)

Next.js 16 App Router, plain CSS on the customer site. State between steps lives in `localStorage` (`lib/generator.js`); the first database write is `POST /checkout` on the Payment step. Photos go browser → R2 via presigned PUT, then `POST /uploads/gate` runs face and moderation checks per photo. Stripe Checkout hosted page; `success_url` carries `orderId` and a public token; `cancel_url` returns to `/ai-headshot-generator/payment`. Worker trains and generates, emails once on delivery.

Events tracked: `landing_view`, `upload_started`, `upload_completed`, `checkout_started`, `purchase_completed`, `quality_gate_failed`. There is no event for reaching Select or Payment, so the two steps this audit flags most cannot be measured today.

## Phase 1: funnel walk

| Step | URL | Observed (390px) | Findings |
|---|---|---|---|
| Landing | `/ai-headshot-generator` | 10,516px tall. Hero CTA at y=763, just inside the fold. Proof section at y=5,072 (6 screens), pricing at y=7,212 (8.5 screens). Desktop: pricing at 4,312 of 6,672. | OBSERVED: price is in the CTA ("from $9") so it is not hidden, but the plan comparison a buyer needs to pick Pro is very deep. Cookie banner covers the bottom 150px of every first screen including the hero CTA on mobile. |
| Select | `/ai-headshot-generator/select` | 3,392px tall. 3 plan cards, 23 chips (gender, age, 9 race, 6 facial hair), 11 background cards and 8 attire cards as horizontal carousels, email field, Continue at y=2,540 disabled. | OBSERVED: Starter is preselected while Pro carries the "Most popular" badge. Carousels show 2.3 cards with the third clipped. One attire ("Blazer over tee") renders a grey "Preview" box because `image: ''` in the catalog. CODE: `canContinue` requires looks, attire, gender, age and a valid email but the UI never says which is missing. CODE: `?tier=` is not read; the plan cards on the landing page are not links. |
| Upload | `/ai-headshot-generator/upload` | 1,801px. Two green primary buttons visible at once: "Use my camera" and "Continue". Dropzone copy says "Drag your photos here" on a touch device. | OBSERVED. CODE: per-photo server gate as each photo lands is a real strength, failures are shown on the thumbnail with a reason. |
| Capture | `/capture` | Not rendered (needs a camera). | CODE: six guided poses, auto-capture on face detection, manual fallback. Good. Pose direction unverified (own comment). |
| Payment | `/ai-headshot-generator/payment` | 1,617px. Review table, "Pay and start $29", guarantee line, terms line. | OBSERVED: no delivery time, no "what happens next", no way to change plan without going back two steps. CODE: `/checkout` creates the order then the Stripe session; webhook is idempotent by session id. |
| Stripe | hosted | Not rendered. | CODE: `customer_email` prefilled, one line item named with plan and count. |
| Success | `/success?orderId&t` | Not rendered with a real order. Rendered with a bad id: "We could not load this order." plus a link to start over. | CODE: status headline, step list, generation percentage, download all. See Phase 5 for the two copy defects. |
| Cancel | `/cancel` | "Checkout canceled" with one link "Back to your order" → `/ai-headshot-generator` (the landing page). | OBSERVED. CODE: Stripe's `cancel_url` actually points at `/payment`, so `/cancel` is only reachable by old links. Its one link still drops a warm buyer on the marketing page instead of `/payment`. |

Unhappy paths checked (CODE): expired or tampered catalog ids are stripped on read; a 422 from the gate at checkout shows the exact failing photos; network failure on upload marks the photo "Upload failed, remove and try again"; a Stripe retry does not re-enqueue; a failed run auto-refunds once.

## Phase 2: first screen and message match

- OBSERVED: H1 "Headshots that don't look AI." Lede states the product in one paragraph. CTA carries the entry price. Three ticked promises. This is a good first screen.
- OBSERVED: the hero's primary frame (`/work/hero-1.jpg`) is served through `next/image` at **195px wide for a 349px slot on a 390px viewport** (naturalWidth 195, rendered 349), because `Hero.js` never passes `sizes` and `Frame.js` defaults to `50vw`. The proof for a claim about image quality is delivered blurry on the device most visitors use. At 1440px the same frame is 359px for 249px, fine.
- OBSERVED: `hero-1.jpg` at full size shows soft, waxy skin and uneven beard blending. This is a judgement, not a measurement, but it is the first image a visitor sees under a headline promising the opposite. `hero-2` and `hero-3` read as more natural. Swap the order.
- OBSERVED: all three hero frames and the entire showcase are one man. The FAQ says "it works across ages, genders, and skin tones"; nothing on the page shows it.
- CODE: the root `/` is a 308 to `/ai-headshot-generator`. Fine for SEO, but every ad or share link to the bare domain pays a redirect.

## Phase 3: trust, objections and risk reversal

| Id | Finding | Evidence | Cost |
|---|---|---|---|
| T1 | Testimonials are invented. `data/landing.js` says so in a comment ("PLACEHOLDER CONTENT… MUST be replaced"). They render with five-star ratings and names. | OBSERVED locally; "Dana Whitfield" appears 3 times in the production HTML. | Legal exposure (fake reviews are regulated in the UK, EU and US) and, if a visitor searches a name and finds nothing, the whole page loses credibility. |
| T2 | The guarantee contradicts itself. Hero, Payment step, FAQ and the delivery email promise a full refund within 14 days if the set does not look like you. `/refunds` says dissatisfaction "is not covered by the automatic refund" and "handled case by case"; `/terms` says the same. The `/refunds` page title even says "Look-Like-You Guarantee" and the body never mentions it. | CODE: `sections/Hero.js`, `payment/page.js`, `data/faq.js`, `emailClient.js:208` vs `data/legal.js:148-152, 191-215`. | A buyer who clicks "Refund Policy" from the pricing fine print, the one place the doubtful buyer clicks, reads that the headline promise is not policy. |
| T3 | Pricing fine print under the plans mentions only the failed-run refund, not the guarantee. | OBSERVED. | The strongest objection handler is missing from the decision point. |
| T4 | Terms carry a live TODO: "The specific jurisdiction will be confirmed here." | CODE `data/legal.js`. | Reads as unfinished to anyone who opens Terms. |
| T5 | "Most popular" badge on Pro while the funnel preselects Starter. | OBSERVED on `/select`. | Social proof and default disagree; the default wins and the average order is $9 not $29. |
| T6 | Starter and Pro pricing cards state outfit and background caps ("1 outfit option, 2 background options"). Neither the client nor `/checkout` enforces `attireCount` or `lookCount`. | CODE: `pricing.js` defines them, `select/page.js` and `server.js /checkout` never read them. | Either the card is false or the Pro upsell is hollow. A Starter buyer picking 5 outfits gets 5 photos across 5 outfits, which is also the worst possible set for $9. |
| T7 | No payment confirmation email. The only customer email is sent at delivery (`worker.js:260`). | CODE. | For up to an hour the buyer's only proof of purchase is a browser tab and, if enabled in Stripe, Stripe's receipt. |

Good: real processors named in Privacy, Stripe named at pay, photos gated before payment, refund automation is real code (`pipeline/refund.js`).

## Phase 4: forms and checkout

| Field / control | Step | Finding | Tag |
|---|---|---|---|
| Plan radio | Select | Works with keyboard, `role=radio`. Defaults to Starter. No `?tier` intake. | OBSERVED, CODE |
| Gender, age | Select | Required, never marked as required. | CODE |
| Race (9 chips) | Select | Optional and labelled so. Asking it before any value is shown is unusual; placing it after background and attire would cost nothing. | INFERRED |
| Facial hair | Select | Hidden for "Woman", cleared on switch. Good. | CODE |
| Background, attire | Select | Horizontal carousels on mobile, third card clipped as the only scroll cue. Multi-select with no count shown ("2 of 11 chosen"). | OBSERVED |
| Email | Select | Bottom of a 3.4k px page, `type=email`, `inputMode`, regex `.+@.+\..+`. No inline error on a typo, the button just stays grey. | CODE |
| Continue | Select, Upload | `disabled` with `opacity: .5`, no message naming the missing field. | OBSERVED, CODE |
| Dropzone | Upload | `role=button`, keyboard opens picker. Copy assumes drag. `accept="image/*"`; HEIC from iPhone will be accepted by the picker, its fate in the server gate is not verified here. | CODE |
| Pay and start | Payment | Shows price on the button, busy state "Taking you to payment". Single click guard. | CODE |
| Stripe Checkout | Stripe | Hosted, email prefilled, no promo field, no address collection. | CODE |

## Phase 5: states, feedback and failure

- CODE: Success page footer says "A copy of your results link has been emailed to you" in every status. The email is sent only when the order reaches DELIVERED. For PAID, TRAINING and GENERATING this sentence is false, and a buyer who closes the tab expecting that email has nothing.
- CODE: Success sub-copy says "This takes a few minutes" (PAID) and "usually a few minutes" (TRAINING). The landing page, FAQ and process section all say "about an hour". `pipeline.js` allows 30 minutes of training and 45 minutes for training to start. I do not have measured delivery times; whichever is true, the two surfaces must agree.
- CODE: FAILED state is handled well: calm copy, refund status, link to start again.
- CODE: GENERATING shows a percentage; TRAINING shows nothing but an elapsed clock, which counts up against a "few minutes" promise. Replace with "usually done by HH:MM" once you have a real median.
- CODE: `/cancel` links to the landing page. Cancelled buyers should land on `/payment` with their state intact (it is, `localStorage` is not cleared until success).
- CODE: `clearState()` is exported and never called anywhere in the funnel, so after a successful purchase the next visit to `/select` is prefilled with the previous order including its photos. Harmless for one buyer, confusing on a shared machine.

## Phase 6: mobile and speed as experience

- OBSERVED: no horizontal overflow at 390px (scrollWidth 391). CLS 0 on both widths. Viewport meta correct.
- OBSERVED: LCP 480ms mobile / 148ms desktop on the dev server. Not representative of production; not scored.
- OBSERVED: hero LCP image upscaled 1.8x on mobile (see Phase 2).
- OBSERVED: mobile page heights: landing 10,516px, Select 3,392px, Upload 1,801px, Payment 1,617px. Pricing on the landing page is 8.5 viewports down.
- OBSERVED: tap targets under 44px: every footer link (146x22), pricing fine print links (16px tall), "See all questions" (18px), consent "Decline" (38px), "Back" in the funnel (40x38). Chips are 40px tall.
- OBSERVED: the cookie banner overlaps the hero CTA region on mobile until dismissed. It appears because GA or Clarity is configured; Plausible alone would need no banner.
- CODE: Google Fonts loaded from the network with `display=swap`; four `<link>` elements. Self-hosting Commissioner would remove a third-party round trip on first paint.

## Phase 7: accessibility

- OBSERVED: no unlabelled inputs. Heading order is H1 → H2 → H3 throughout.
- OBSERVED: 3 hero images have `alt=""`. They are the proof, not decoration. Give them "AI headshot of a man in a black turtleneck against greenery" style alts.
- CODE: 14 `:focus-visible` rules exist; option cards and chips use `aria-pressed`; stepper is a `nav` with `aria-label`; progress bar has ARIA values. Good baseline.
- CODE: disabled Continue conveys nothing to a screen reader about why. Add `aria-describedby` pointing at the missing-fields message once it exists.
- CODE: `.info-tip` tooltip uses `role=note` on a span with `tabIndex=0`; content is duplicated in `aria-label`, acceptable.

## Phase 8 and 9

Skipped: no analytics access, no competitors named.

## Master fix list

| # | Issue | Where | Category | Evidence | Impact | Effort | Fix |
|---|---|---|---|---|---|---|---|
| 1 | Invented testimonials live in production | `data/landing.js` testimonials, `sections/Testimonials.js` | Trust | OBSERVED (prod) | Very high | Low | Delete the section from the page until three real, attributable quotes exist. If you have delivered orders, email those customers today and ask. |
| 2 | Guarantee contradicted by Refund Policy and Terms | `data/legal.js` refunds + terms | Trust | CODE | Very high | Low | Add a section to `refunds`: h "Look-like-you guarantee", body "If your delivered headshots do not look like you, reply to your delivery email or write to info@picturesk.ai within 14 days of delivery and we refund the full price. You keep the images." Change the terms Refunds body to "Failed runs are refunded automatically. Delivered sets that do not look like you are refunded in full within 14 days, see the Refund Policy." Change the refunds lede to "If a run fails you are refunded automatically. If the set does not look like you, tell us within 14 days and you are refunded in full." |
| 3 | Hero LCP image upscaled on mobile | `sections/Hero.js` | Mobile | OBSERVED | High | Trivial | Pass `sizes="(max-width: 760px) 100vw, 30vw"` to frame 1 and `sizes="(max-width: 760px) 50vw, 15vw"` to frames 2 and 3. |
| 4 | Plan choice on landing not carried into funnel; default is Starter under a "Most popular" Pro | `sections/Pricing.js`, `select/page.js`, `lib/generator.js` | Friction | OBSERVED, CODE | High | Low | Wrap each plan card in `<a href="/ai-headshot-generator/select?tier=<id>">`, read `useSearchParams().get('tier')` on Select and `writeState({tier})` when valid, change `EMPTY.tier` and the `readState` fallback to `'pro'`. |
| 5 | Tier caps printed but not enforced | `select/page.js`, `server.js /checkout` | Trust, Forms | CODE | High | Medium | On Select, disable further cards once `looks.length >= tier.lookCount` (null = no cap) with a caption "Starter includes 2 backgrounds. Switch to Pro for 4." In `/checkout`, reject with 400 when a cap is exceeded. Or delete the two "option" lines from `includesFor` and the `cons` copy and sell on count and queue only. Pick one. |
| 6 | Disabled Continue with no reason | `select/page.js`, `upload/page.js` | Friction | OBSERVED, CODE | High | Low | Under the button render the first unmet item: "Choose at least one background", "Choose at least one outfit", "Tell us your gender and age range", "Enter the email for your results". Upload already has `note`; move it next to the button. |
| 7 | Success page claims an email that has not been sent | `success/SuccessView.js` footer line | States | CODE | High | Trivial | Render "We will email your results link to {nothing, no PII} when they are ready" while processing and the current line only when `isDelivered`. |
| 8 | No confirmation email at payment | `server.js` webhook | Trust, States | CODE | High | Medium | In the `checkout.session.completed` branch, after enqueue, send a one-paragraph email with the order id, the success URL with token, and "usually ready in about an hour". Add `sendPaidEmail` to `emailClient.js`. |
| 9 | Timing copy disagrees across surfaces | `SuccessView.js` SUBCOPY vs hero, FAQ, HowItWorks | Clarity | CODE | Medium | Trivial | Change PAID to "Your model starts training now. Most sets are ready in about an hour. You can close this page, we email you." and TRAINING to "The slow part. Usually 20 to 40 minutes." only once you have measured medians. Until then say "about an hour" everywhere. |
| 10 | Marketing nav and 17-link footer inside the funnel | `SiteChrome.js`, `(funnel)/layout.js` | Friction | OBSERVED | Medium | Low | In `SiteChrome`, when `pathname` starts with `/ai-headshot-generator/` and is not the landing page, render only the wordmark and a `mailto:info@picturesk.ai` "Help" link, and skip `Footer`. |
| 11 | Proof is one person, one gender | `data/samples.js` | Clarity, Trust | OBSERVED | Medium | Medium (needs a consenting customer) | Add a second `samples` entry from a delivered order, put one of her shots in `heroShots[1]`. |
| 12 | Hero frame 1 is the weakest of the three images | `data/samples.js` heroShots order | Clarity | OBSERVED (judgement) | Medium | Trivial | Reorder to `hero-2, hero-3, hero-1`. Test this, do not just ship it. |
| 13 | Pricing 8.5 screens down on mobile | `ai-headshot-generator/page.js` section order | Clarity | OBSERVED | Medium | Low | Move `<Pricing />` directly after `<HowItWorks />`; keep the FAQ and use cases below. Test against the current order. |
| 14 | Two primary buttons on Upload | `upload/page.js` capture-cta | Friction | OBSERVED | Medium | Trivial | Make "Use my camera" a `btn btn--link` styled secondary, or show it only when `navigator.mediaDevices` exists and the viewport is under 820px. |
| 15 | "Drag your photos here" on touch | `upload/page.js` | Friction | OBSERVED | Low | Trivial | "Tap to choose photos" under 820px, drag copy above. |
| 16 | Cancel page sends warm buyers to marketing | `cancel/page.js` | Friction | OBSERVED | Low | Trivial | Link to `/ai-headshot-generator/payment`, text "Back to review and pay". |
| 17 | Attire "Blazer over tee" has no image | `catalog.js` | Clarity | OBSERVED | Low | Low | Add the image or remove the option. |
| 18 | Carousels clip with no count or scroll cue | `select/page.js`, `globals.css .cards` | Friction | OBSERVED | Low | Low | Show "2 of 11 selected" next to the subhead, and on mobile switch to a 2-column wrapped grid so nothing hides off-screen. |
| 19 | Sign Up / Log in in the nav on a no-account product | `SiteChrome.js` | Friction | OBSERVED | Low | Trivial | Keep "Log in" only, move it to the drawer on mobile. |
| 20 | Pricing fine print omits the guarantee | `sections/Pricing.js` | Trust | OBSERVED | Medium | Trivial | "You pay on Stripe. Look-like-you guarantee: full refund within 14 days if the set is not you. Failed runs are refunded automatically." |
| 21 | Cookie banner covers the hero CTA on mobile | `components/Analytics.js` | Mobile | OBSERVED | Medium | Low | Either drop GA and Clarity in favour of Plausible only (no banner needed), or render the banner as a top strip under the header on mobile. |
| 22 | Terms carry a jurisdiction TODO | `data/legal.js` | Trust | CODE | Low | Trivial | Fill it in. |
| 23 | Funnel steps Select and Payment are not tracked | `lib/analytics.js` | Measurement | CODE | Enables everything above | Trivial | Add `select_view` and `payment_view` events fired once per page mount. |
| 24 | Footer and fine-print tap targets under 44px | `globals.css` | Mobile, a11y | OBSERVED | Low | Trivial | `padding: 10px 0` on `.footer__col a`, 44px min-height on `.btn--link`. |
| 25 | Hero proof images have empty alt | `sections/Hero.js` | a11y | OBSERVED | Low | Trivial | Descriptive alt per frame. |
| 26 | Stale funnel state after purchase | `SuccessView.js` | States | CODE | Low | Trivial | Call `clearState()` when `PAID_STATES.has(order.status)` first becomes true. |

## Test these, don't just ship them

- Fix 12 (hero image order) and fix 11 (second person in the hero). Likeness is the promise; which face leads should be measured.
- Fix 13 (pricing directly after the process section). The current order builds the case before the price; some buyers need that.
- Fix 4's default of Pro over Starter. It should raise average order value; watch whether Select → Upload progression drops.
- Fix 10 (stripping chrome from the funnel). Expected to help, but the footer's Refunds link is also where anxious buyers go.

## What was and was not verified

Verified by rendering: landing, Select, Upload, Payment, Cancel and the bad-id Success state at 390 and 1440. Verified by reading: checkout, webhook, worker delivery, email templates, pricing and catalog data, legal copy. Not verified: Stripe Checkout itself, a real Success page with a live order, the camera capture step, actual production delivery times, production Core Web Vitals, HEIC handling in the server gate, whether dev and prod share a database. No file outside `docs/audits/` was modified and no order was created.
