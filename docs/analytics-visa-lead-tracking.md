# Visa lead tracking (Travl) — status & roadmap

How we measure visa lead-gen in GA4 / Google Ads, and the planned upgrade to
real (offline) revenue attribution.

## Phase 1 — shipped (valueless `generate_lead`)

When someone successfully submits the visa **LeadFormModal**, we fire GA4's
recommended `generate_lead` event.

- Helper: `trackVisaLeadSubmit()` in
  `packages/frontend-shared/src/utils/analytics.js`.
- Fired from `packages/frontend-shared/src/components/forms/v1/LeadFormModal.js`,
  only **after** `createVisaLeadAsync` resolves (so validation errors, server
  errors, and honeypot rejections never fire it).
- Params (deliberately **PII-free** — no name / email / phone / nationality):
  `visa_slug`, `package`, `applicant_count`, `lead_source`.
- **No value.** A lead is not revenue; only a fraction convert, and that happens
  offline. Putting a deal value here would overstate revenue.
- Gated by `shouldTrackAnalytics()` → fires in **production only**, off `/admin`.
  Verify on the live site with GA4 Realtime / DebugView.

### To use it now
1. GA4 admin → mark `generate_lead` as a **Key Event**.
2. Google Ads → import it as a conversion (GA4 conversion import).

⚠️ **Caveat:** importing `generate_lead` makes Google Ads optimize for form
*submissions*, not *sales*. With an estimated ~20% offline close rate, that can
attract high-volume, low-quality leads. It's a fine way to get campaigns
running, but Phase 2 is what makes Ads bid toward leads that actually pay.

## Phase 2 — planned (offline conversion attribution)

Goal: when a rep marks a lead **converted** in the admin, report the **real deal
value** back to GA4 / Google Ads, attributed to the original click/source.

The lead already has the status lifecycle `new → contacted → qualified →
converted → lost` (`visaLead.schema.js`) and an admin update flow
(`useUpdateVisaLeadStatus`), so the trigger point already exists.

### What it needs
1. **Capture at submit** (frontend, `LeadFormModal` / lead payload):
   - GA4 `client_id` (from gtag/ReactGA).
   - `gclid` from the URL (needed for Google Ads offline conversion import).
2. **Store on the lead** (`visaLead.schema.js`): `clientId`, `gclid`,
   `dealValue`, `currency`, `convertedAt`.
3. **Fire on conversion** (backend, when status → `converted`):
   - GA4 **Measurement Protocol** `purchase` (or `lead_converted`) using the
     stored `client_id` + real value.
   - and/or **Google Ads offline conversion import** using the stored `gclid`.

### Prerequisites / open items
- **Average deal value:** not established yet. Either capture the actual amount
  the rep closes at (best), or set a per-package default to seed `dealValue`.
- **Google Ads:** planned, not yet running. Capturing `gclid` early (even before
  Phase 2 is wired) avoids losing attribution data on leads that arrive in the
  meantime — worth doing as a cheap first step.
- Decide event semantics: reuse `purchase` (fits GA4 ecommerce/value reports) vs
  a custom `lead_converted` key event.
