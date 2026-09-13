# VisaWadi UX and Conversion Audit

Date: 12 September 2026
Branch: `master` at `a41ea75`
Environment: `visawadi-frontend` on `http://localhost:3100` (Next dev), `visawadi-backend` on `http://localhost:3101`, started for this audit and shut down after. Ports 3000/3001 were occupied by another app and were left alone.

## Instruments

- Real browser: YES. Headless Google Chrome driven over CDP. Every funnel page was rendered at 390x844 (touch emulation) and 1440x900, screenshotted, and inspected via DOM queries. Modal open, empty-submit validation and package preselection were exercised in the browser.
- Analytics: NO access to GA4 or Clarity. Phase 8 is skipped.
- Competitors: none named. Phase 9 is skipped.
- Core Web Vitals: NOT measured. The app ran in `next dev`, so load times, bundle size and CLS are not representative and are not reported.
- Database: **dev and prod share the same MongoDB host and database** (verified by comparing `.env.development` and `.env.production` targets, not printed). No lead was created. API failure paths were tested only with payloads the server rejects before writing (honeypot, invalid phone, unknown slug). Any follow-up fix script runs against production data.

Evidence tags: **OBSERVED** (rendered or executed), **CODE** (read in the repo or CMS data returned by the API), **INFERRED** (reasoned from either).

## INPUTS

| Field | Value | Source |
|---|---|---|
| Primary conversion event | Lead submitted via `LeadFormModal` (`POST /api/visa-leads`, GA4 `generate_lead`) | User |
| Secondary conversions | WhatsApp tap (sticky button, final CTA), email link | Inferred |
| Known symptom | None stated; general health check | User |
| Risk reversal | User said none. The Schengen FAQ says Concierge includes a free resubmission after refusal; Basic and Standard get a written refusal analysis. This exists but is not surfaced anywhere a buyer looks. | User + CMS |
| House facts (inferred, please confirm) | `src/config/trust.js` bans numeric claims ("3 min response", "98% approval", "500+ visas") because they have no source. `src/config/contact.js` records the trade licence expired 17/05/2026 and the registered address is Sharjah, not Dubai. Legal entity is City Tours LLC. Prices are AED; Schengen from 299. | CODE |
| Traffic sources | Not provided. SEO and blog are the visible investment. | Inferred |
| Funnel | Home or blog or `/visa-check` result, then `/uae/visa/<slug>`, then modal, then admin call-back | CODE |

The four house facts above were inferred from config, not confirmed by you. Contradictions are flagged below on that basis; if the licence and Dubai office are now resolved, drop findings F2 and F3.

## Executive summary

| Bucket | Score | Weight |
|---|---|---|
| Clarity and message match | 62 | 20% |
| Funnel friction | 48 | 25% |
| Trust and risk reversal | 44 | 20% |
| Forms and checkout | 68 | 15% |
| States, feedback and failure handling | 41 | 10% |
| Mobile and performance experience | 55 (partial, no CWV) | 10% |
| **Overall (weighted)** | **53** | |

**Highest drop-risk step:** the visa detail page between the hero and the lead modal. On mobile the page is 12,156px tall with exactly two lead CTAs above the package cards (hero at y=430) and none again until y=11,193. A visitor who scrolls past the packages has no way to convert for roughly 8,000px, and the only always-visible action is WhatsApp, which bypasses the lead form and the `generate_lead` event entirely.

**Top 10 fixes** (detail in the fix list):

1. Fix the crashed 404 page (F1). Every unknown URL currently renders "Something went wrong" instead of a not-found page.
2. Add a sticky bottom CTA bar on `/uae/visa/[slug]` for mobile and a "Get free consultation" button after every major section (F5).
3. Move the "See what's included" CTA on `/visa-check/[destination]` above the nationality table, directly under the answer card (F6).
4. Remove or source the "3-minute response time" and "Licensed Dubai office" claims from the homepage pills and every visa's `whyUs` (F2, F3).
5. Put the refusal guarantee on the package cards and in the modal (F4).
6. Rename the modal and its button to match the CTA that opened it: "Get free consultation" opens "Apply for Schengen Visa / Submit application" (F7).
7. Resolve the VFS fee contradiction on the Schengen page: hero says "from AED 146.74", cost table says AED 95 (F8).
8. Send the lead a confirmation email or WhatsApp template on submit; today only the admin is notified (F9).
9. Either add `saudi-arabia` to `servicedSlugs` or pull it off the homepage; the checker tells Saudi-bound visitors "we do not currently file Saudi Arabia applications" while the homepage sells a AED 700 Saudi package (F10).
10. Fire a `lead_form_open` event so modal-open to submit drop-off becomes measurable (F11).

## Phase 0: stack and funnel map

Next.js 16 App Router, React 19, Tailwind v4, TanStack Query. Backend Express 5 with the `visa-leads` domain. Pages: `/` (homepage with inline visa checker), `/uae` (listing), `/uae/visa/[slug]` (10 published visas), `/visa-check` and `/visa-check/[destination]`, `/blog`, `/contact`, `/about`, `/faq`. No middleware; redirects live in `next.config.mjs`. **CODE**

The lead form is `LeadFormModal` (frontend-shared, v1). Fields: first name, last name, nationality, email, phone (country code + digits), package radio, applicant count, plus a honeypot. Sources are `hero_cta`, `package_card`, `final_cta`. Submit calls `POST /api/visa-leads`, which validates, saves, and emails the admin. Rate limit: 5 posts per IP per hour, honeypot hits included. **CODE**

## Phase 1: funnel walk

| Step | URL | What a visitor sees | Evidence | Risk |
|---|---|---|---|---|
| Entry | `/` | Dark hero, H1 "Visa Assistance for UAE Residents", inline checker (nationality, residence, destination), four trust pills. No lead CTA and no price above the fold on either viewport. First visa card at y=1,129 on mobile. | OBSERVED | Medium: the only above-fold action is a tool, which is the intended low-commitment ask, but "from AED 299" is not visible until the cards. |
| Entry via checker | `/visa-check/xs?nationality=IN&residence=AE` | H1 "Do you need a visa for the Schengen Area?", red "Visa required" card, then a 120-row nationality table. The sell CTA "See what's included" is at y=8,077 of 8,962. | OBSERVED | **High**: the visitor who just learned they need a visa has to scroll past 120 rows of other passports to find the product. |
| Entry via checker (Saudi) | `/visa-check/sa?nationality=IN&residence=AE` | "Visa required", then "We do not currently file Saudi Arabia applications" with a link to `/uae`. | OBSERVED | High for that segment: the homepage and footer both sell a Saudi package at AED 700. |
| Listing | `/uae` | 10 cards, from-prices AED 299 to 799, "Approx. 3 – 4 days" timelines. | OBSERVED | Low. |
| Detail | `/uae/visa/schengen` | Hero with two CTAs, qualifiers, 3 package cards (Standard "Most Popular"), 5-step process, requirements accordion, cost table, 8 trust cards, 3 testimonials, 8 FAQs, final CTA. 12,156px on mobile, 7,367px on desktop. | OBSERVED | **High**: see drop-risk note above. |
| Modal | click "Get free consultation" | Title "Apply for Schengen Visa", subtitle "We'll call you within minutes during business hours", 7 fields, button "Submit application", package defaults to "I haven't decided yet". Applicant count is below the fold on 390px. | OBSERVED | Medium: label mismatch turns a free consult into an application. |
| Modal from package card | click "Choose Standard" | Same modal with Standard preselected. | OBSERVED | Works. |
| Validation | submit empty | Five inline errors under the right fields, red text, no scroll to first error. | OBSERVED | Low. |
| Server reject | phone `+97112345` | Client accepts (5-digit rule), server returns 400 "Please provide a valid international phone number (e.g. +971501234567)". The message renders in the modal. | OBSERVED (API) + CODE | Low-medium: a wasted round trip, but the error is clear. |
| Rate limit | 6th post from one IP in an hour | 429 "Too many requests. Please try again later." shown in the modal with no alternative offered. | OBSERVED (API) | Medium: offices, family groups and carrier-grade NAT share IPs. INFERRED for CGNAT. |
| Success | after submit | In-modal "Thanks, {name}! We've got your details. Our rep will call you within a few minutes during business hours." Close button. No email to the lead, no reference, no next-step. | CODE | Medium: nothing lands in the lead's inbox, so the promise is only as good as the call-back. |
| Unknown URL | `/uae/visa/does-not-exist` | "Something went wrong. An unexpected error occurred." with Try again / Go home. Console: `useCurrency must be used inside <CurrencyProvider>`. | OBSERVED | **High**: every mistyped or stale link shows an error page, not a not-found page. |

Unhappy paths not verifiable here: backend down mid-submit (client shows `err.message`, and `AbortSignal.timeout(8000)` produces a generic "signal timed out" style message rather than the WhatsApp fallback text). **CODE**

## Phase 2: first screen and message match

- Homepage H1 names the audience and the service. Sub-line leads with the refusal fear. Good message match for "visa assistance UAE" traffic. **OBSERVED**
- Homepage pills "Licensed Dubai Office" and "3-Minute Response Time" repeat the exact claims `trust.js` removed from the visa pages for having no source. The same two claims also come back on every Schengen-family page through the CMS `whyUs` block ("DAFZ-licensed office in Dubai. Walk in any working day"). Meanwhile `contact.js` says the licence expired on 17/05/2026 and the registered address is in Sharjah. **CODE**
- Schengen hero sub-line is a 60-word paragraph of fees before the value proposition, and its VFS figure ("from AED 146.74") contradicts the page's own cost table (AED 95). **OBSERVED + CODE**
- Process step 1 says "Fill in your travel details online in under 5 minutes, dates, countries, and document uploads. No office visit needed at this stage." The actual step 1 is a 7-field call-back form with no dates, countries or uploads. **CODE**
- CTA "Get free consultation" opens a modal titled "Apply for Schengen Visa" with a "Submit application" button. **OBSERVED**
- Saudi page: one package, still badged "Most Popular". **OBSERVED**

## Phase 3: trust, objections and risk reversal

- Trust section on the detail page renders 8 cards: 4 from CMS `whyUs` and 4 from `TRUST_ASSURANCES`. "Every document reviewed" appears in the hero strip, the assurances, and the benefits list. Repetition without new information. **OBSERVED**
- Testimonials: three per major destination, full names and nationalities, no photos, no link to a review platform. `public/trustpilot.webp` exists but is not used on any audited page. I cannot verify these are real; if they are not, they are a liability, and if they are, they need a source. **CODE, flag for you to check**
- Risk reversal: "What happens if my visa is refused after I pay your fee?" is FAQ number 7 of 8 on a 12,000px page. Its answer contains the strongest conversion lever on the site (free resubmission on Concierge, written refusal analysis on the others) and it appears nowhere else. **CODE**
- Legal: footer has no address (`ADDRESS` is null), no licence number, and the legal pages name a trading name rather than City Tours LLC. For a service that takes passports and bank statements this is a visible gap. **CODE**
- Price transparency is good: cost table separates VisaWadi fee, embassy fee, VFS charge and biometrics with who is paid. **OBSERVED**

## Phase 4: forms

| Field | Type | Required | Autocomplete | inputMode | Validation | Note |
|---|---|---|---|---|---|---|
| First name | text | yes | none | | required, max 50 | add `autocomplete="given-name"` |
| Last name | text | yes | none | | required, max 50 | add `autocomplete="family-name"` |
| Nationality | searchable select | yes | off | | required | label not associated with the input (7 of 11 modal labels have no `for`) |
| Email | email | yes | none | | required, pattern | add `autocomplete="email"` |
| Phone | code + tel | yes | none | | client: 5+ digits; server: libphonenumber strict | mismatch causes a server round trip for short numbers; add `autocomplete="tel-national"` |
| Package | radio x4 | yes | | | required | defaults to "I haven't decided yet", good |
| Applicants | number 1 to 20 | yes | | | required | below the fold on 390px, easy to miss |
| Honeypot | hidden text | | | | | counts toward the rate limit even when it fires |

All evidence **OBSERVED** in the modal DOM. Seven fields for a call-back is more than the ask warrants; email and applicant count could be collected on the call.

## Phase 5: states, feedback and failure

- Loading: submit button shows a spinner and "Sending…", disabled. **CODE**
- Success: in-modal only. No confirmation email or WhatsApp message to the lead; only `sendVisaLeadToAdmin` fires. No lead reference number. **CODE**
- Errors: inline, per field, plus a red server banner. The fallback copy "Something went wrong. Please try again or WhatsApp us." only appears when `err.message` is empty, which is never the case for a 429 or a timeout. **CODE**
- Unsaved-changes guard uses `window.confirm` on Escape and backdrop tap. Functional but a native dialog. **CODE**
- 404: crashes to the error boundary (see Phase 1). The `not-found.js` also lists helpful links to `/quote`, `/privacy` and `/terms`, none of which exist on this brand. **OBSERVED + CODE**
- Modal accessibility: no `role="dialog"`, no `aria-modal`, focus stays on `body` after opening. **OBSERVED**

## Phase 6: mobile and speed

- On `/uae/visa/schengen` at 390px, 34 of 43 interactive elements are under 44px tall, including all seven primary CTAs at 43px. Marginal, but the guide links are 42px and the FAQ link is 21px. **OBSERVED**
- The header CTA "Check your visa" is hidden behind the hamburger on mobile, so the mobile header has no visible action. **OBSERVED**
- Sticky WhatsApp button sits bottom-right on every page and overlaps the fourth hero pill on the homepage at 390px. **OBSERVED** (Next dev indicator overlapped too; ignore that one)
- The visa detail page has one `priority` hero image; visa cards use `sizes`. No images without alt text on the homepage. **OBSERVED**
- CWV: not measured (dev server). Note that `VisaDetailPage` is a client component that pulls in every section as client code; production bundle size is worth checking with `next build` before assuming it is fine. **INFERRED**

## Phase 7: accessibility

- `lang="en"`, `main`, `nav`, `footer` landmarks present, heading order H1 then H2/H3 is sane. **OBSERVED**
- Modal: no dialog role, no focus management, 7 unlabeled inputs (labels present visually but not linked). **OBSERVED**
- Package radio cards rely on `has-[:checked]` styling; keyboard focus ring on the radio itself is the browser default. Not verified with a keyboard walk.

## Phase 8 and 9

Skipped: no analytics access, no competitors named.

## Scores and justification

- **Clarity and message match, 62.** Homepage H1 and sub-line are strong and specific. Lost points for the CTA-to-modal label mismatch, the fee-first Schengen hero, and process copy describing a form that does not exist.
- **Funnel friction, 48.** The detail page has an 8,000px CTA gap on mobile, the checker result buries the product under 120 rows, and the Saudi checker actively turns away buyers the homepage invited.
- **Trust and risk reversal, 44.** Unsourced claims contradicting the repo's own trust policy, a refund/resubmission policy hidden in FAQ 7, no address, no licence, unverifiable testimonials.
- **Forms and checkout, 68.** Inline validation works, package preselection works, honeypot and rate limit exist. Lost points for seven fields on a call-back, autocomplete missing everywhere, client/server phone mismatch, and rate limiting shared IPs.
- **States, feedback and failure, 41.** The 404 crash is the single worst state on the site. No customer confirmation. Fallback copy never shows.
- **Mobile and performance, 55, partial.** Layout holds at 390px and nothing breaks, but the tap targets, the hidden header CTA and the CTA gap all hit mobile hardest. Performance is unscored.

Weights: friction 25, clarity 20, trust 20, forms 15, states 10, mobile 10. Overall 53. This is a measured score for what was verified; it is not a projection of post-fix performance.

## Fix list

| # | Issue | Where | Category | Evidence | Impact | Effort | Fix |
|---|---|---|---|---|---|---|---|
| F1 | Unknown URLs render the error boundary, not a 404 | `apps/visawadi-frontend/src/app/not-found.js` | States | OBSERVED | High | Low | Remove the bare `<Navbar />` and `<Footer>` from `not-found.js` (Providers already wraps it in the layout) or pass `showCurrency={false}`. Replace the helpful links with `/uae`, `/visa-check`, `/blog`, `/contact`. |
| F5 | No conversion path for ~8,000px on the mobile detail page | `VisaDetailPage.js`, `VisaHero.js` | Friction | OBSERVED | High | Medium | Add a fixed bottom bar on mobile (`From AED 299` + "Get free consultation") that appears after the hero scrolls out; add an inline "Get free consultation" button after Process, Requirements and Cost Breakdown. |
| F6 | Checker result CTA sits below a 120-row table | `visa-check/[destination]/page.js` | Friction | OBSERVED | High | Low | Move the `rule.isServiced` block to directly under the answer card. Keep a second copy at the bottom. |
| F10 | Checker says "we do not file Saudi Arabia" while homepage sells it | `visawadi-backend/src/routes/index.js` `servicedSlugs` | Clarity | OBSERVED | High for Saudi traffic | Low | Add `"saudi-arabia"` to `servicedSlugs`, or remove it from the homepage order and footer. |
| F2 | "3-Minute Response Time" pill and `whyUs` card contradict `trust.js` policy | `src/app/page.js` hero pills; CMS `whyUs` on Schengen-family visas | Trust | CODE | High | Low | Replace pill with "Free consultation, no obligation". In CMS, replace the card with "Reply within business hours" or delete it, unless you can source the number. |
| F3 | "Licensed Dubai Office" while contact.js records an expired licence and a Sharjah address | Same as F2 | Trust | CODE | High | Low | Remove until the licence is renewed and the address is published, then show licence number and address in the footer. |
| F4 | Refusal guarantee hidden in FAQ 7 | CMS packages; `VisaPackages.js`; `LeadFormModal.js` | Trust | CODE | High | Low | Add "Free resubmission if refused" to the Concierge features and "Written refusal analysis included" to Basic and Standard. Add one line under the modal submit button: "If the embassy refuses, Concierge clients get a free resubmission." |
| F7 | CTA says consultation, modal says application | `LeadFormModal.js` | Clarity | OBSERVED | Medium-High | Low | Title: "Free consultation: Schengen visa". Subtitle keep. Button: "Request my call-back". Pass a `mode` prop so `package_card` source can keep "Apply". |
| F8 | VFS fee stated twice with different numbers on one page | CMS `heroSubheadline` vs `pricingBreakdown` (Schengen) | Trust | CODE | Medium | Low | Pick one figure and use it in both places. Then cut the hero sub-line to: "Most refusals are preventable document errors. We check every file against current embassy requirements before it goes in. Packages from AED 299, embassy and VFS fees shown separately." |
| F9 | No confirmation to the lead | `packages/domains/visa-leads/src/service.js`, notifications | States | CODE | Medium | Medium | Add `sendVisaLeadToCustomer` (name, package, what happens next, WhatsApp link). Fire it alongside the admin email. |
| F11 | Modal open is not tracked | `VisaDetailPage.js`, `utils/analytics.js` | Measurement | CODE | Medium | Low | Emit `lead_form_open` with `source` and `visa_slug` in `openModal`. Without it the open-to-submit rate is unknowable. |
| F12 | Process step 1 promises uploads and a 5-minute online form | CMS `processSteps` on Schengen-family visas | Clarity | CODE | Medium | Low | "Request a free consultation. Tell us your destination, dates and who is travelling. A specialist calls you back during business hours." |
| F13 | 429 and timeout hide the WhatsApp fallback | `LeadFormModal.js` `onFormSubmit` catch | States | CODE | Medium | Low | Always append "or WhatsApp us" with a link to the server message; treat status 429 with a specific line: "That's a lot of requests from your network. Message us on WhatsApp and we'll pick it up." |
| F14 | Rate limit counts honeypot hits and shared IPs | `visa-leads/src/router.js` | Forms | OBSERVED (API) | Medium | Low | Skip the counter when the honeypot fires; raise `RATE_LIMIT_MAX` to 10, or key on IP plus email. |
| F15 | Seven required fields for a call-back | `LeadFormModal.js` | Forms | OBSERVED | Medium | Low | Make applicant count optional (default 1) and move it below package. Consider making email optional when phone is given; test this. |
| F16 | Client phone rule (5 digits) is looser than server (libphonenumber) | `LeadFormModal.js` | Forms | CODE | Low-Medium | Low | Validate with `libphonenumber-js` on the client using the same rule, or at minimum 7 to 12 digits. |
| F17 | Mobile header has no visible CTA | `Navbar.js` via `AppMegaLayout` | Mobile | OBSERVED | Medium | Low | Render `cta` as a compact button beside the hamburger on mobile. |
| F18 | Autocomplete missing on every field | `LeadFormModal.js` | Forms | OBSERVED | Low-Medium | Low | `given-name`, `family-name`, `email`, `tel-national`; `inputMode="numeric"` on applicants. |
| F19 | Modal has no dialog semantics or focus management | `LeadFormModal.js` | Accessibility | OBSERVED | Low-Medium | Low | `role="dialog" aria-modal="true" aria-labelledby`, focus the first input on open, restore focus on close, link labels with `htmlFor`. |
| F20 | Eight trust cards, three repeat the same point | `VisaTrust.js` and CMS `whyUs` | Trust | OBSERVED | Low | Low | Show `whyUs` only when it adds something the assurances do not; otherwise drop to four cards. |
| F21 | Testimonials carry no source | `VisaTestimonials.js`, CMS | Trust | CODE | Low-Medium | Low | If they are real, add "Google review" or platform links and use `trustpilot.webp`; if not, remove them. |
| F22 | Single Saudi package badged "Most Popular" | `VisaPackages.js` `getPkgTier` | Clarity | OBSERVED | Low | Low | Only render the badge when `packages.length > 1`. |
| F23 | Tap targets at 42 to 43px, FAQ guide link at 21px | `VisaHero.js`, `VisaGuideLink.js`, `VisaPackages.js` | Mobile | OBSERVED | Low | Low | `min-h-11` on buttons and guide links. |
| F24 | Sticky WhatsApp overlaps hero pills at 390px | `StickyWhatsApp.js`, homepage hero | Mobile | OBSERVED | Low | Low | Add `pb-20` to the hero on mobile, or delay the sticky button until after the first scroll. |
| F25 | No address or licence anywhere on the site | `contact.js`, Footer | Trust | CODE | Medium (blocked) | Blocked on licence renewal | Publish `ADDRESS`, `GMB_URL` and the licence number once the entity is sorted. |

## Top 10 highest-leverage fixes

F1, F5, F6, F2 and F3 together, F4, F7, F8, F9, F10, F11.

## Test these, don't just ship them

- F15: dropping email or applicant count from the modal. Fewer fields usually lifts submits but may lower lead quality for the call-back team. Run it as a split on `source=hero_cta` first.
- F7: "Request my call-back" versus "Get free consultation" as the button label. Direction is uncertain; the title fix is not.
- F5: sticky bar versus inline repeated CTAs. Ship the inline CTAs unconditionally, test the sticky bar since it competes with the WhatsApp button for the same thumb.
- Whether the homepage fold should show a lead CTA alongside the checker, or keep the checker alone. The comment in `Providers.js` argues for the tool as the qualifier; that is a hypothesis, not a result.

## What was not verified

Production bundle and Core Web Vitals, real device rendering, keyboard-only navigation, the success state in a real browser (would have written to the shared production database), the admin call-back SLA, whether the testimonials are genuine, and whether the licence and address issues in `contact.js` are still current.
