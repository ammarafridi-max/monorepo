# emirateslimo-frontend → @travel-suite/frontend-shared — REMAINING

The refactor itself is **done**: all local `hooks`/`context`/`services`/`utils` were swapped
to shared or deleted; `lib/` is now brand-bound wrappers on shared (schema/meta) + local limo
analytics. `src/` = `app, components, config.js, data, lib`. Every phase ended with a clean
`next build` (48 routes).

What's left is **manual verification on dev** (can't be build-checked) + behavior-change
call-outs to confirm before/after the production redeploy.

## 1. Verify the booking flow on dev
Home form submit (zone resolve + distance) → `select-limo` (available vehicles + prices) →
`booking-details` → payment-link redirect. Then switch currency mid-flow and confirm the total
re-scales correctly.

## 2. Confirm the currency behavior changes (Phase 4)
1. **Conversion direction FIXED.** DB rates are unit-per-base (USD=0.27). The old local code
   used `price/rate` (×3.7) → **non-AED prices were inflated ~3.7×**; shared uses `price×rate`
   → now correct. Non-AED charged amounts will DROP to the correct value. Confirm this is
   expected (it fixes an overcharge) before redeploying.
2. **Lost IP auto-currency.** Old code picked currency by visitor country (IP); shared defaults
   to base (AED) + localStorage. Decide whether to re-add IP detection to shared `CurrencyContext`.
3. **localStorage key changed** (`currency` obj → `selectedCurrencyCode`); returning visitors
   default to AED until they re-pick.

## 3. Minor schema change to confirm
`buildOrganization.logo` is now an `ImageObject` (was a bare URL string) — richer/valid
schema.org, but verify it renders as intended in the JSON-LD.

---
Delete this file once the above are verified on dev.
