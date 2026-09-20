# Picturesk AI Dating Photos: implementation plan

Prepared 20 September 2026. Decisions taken the same day: $19 / $39 / $59 ladder, dog park and gym scenes shipped behind an opt-in note on the card, placeholder testimonials on the dating pages for now, no second-shoot upsell yet (no past buyers). Build shipped the same day; see the commit history for what landed. Companion to the market research at ~/Desktop/Picturesk_Market_Research_20-SEP.md (section 1).

## The verdict

Dating photos is a second product on the same engine. The customer uploads the same 5 to 15 selfies, we train the same FLUX LoRA, and the only things that change are the catalogue (dating scenes and outfits instead of studio backdrops and suits), the quality tail (candid phone-camera realism instead of 85mm studio headshot), the copy, and the price ladder. The whole build is: one `product` dimension threaded through catalog, pricing, order, prompts and the funnel, plus four landing pages.

Market proof, from the research: Photo AI publishes $105K/mo revenue with dating as one of its top packs and a 2.1 Trustpilot score driven by subscription billing and "5 to 10% of photos on point". Roast sells 40 photos for $39/mo and gets "€29 every month, 22 charges" complaints. DatePhotos.AI sells one-time packs at $29 to $79 and shows a "realness score" to pre-empt the "looks AI" objection. Nobody does one-time, quality-gated, guaranteed likeness at under $30. That is the slot.

## Ideal customer

Primary: men 24 to 40 in the US, UK, Canada, Australia and the Gulf, using Hinge, Bumble or Tinder, who know their photos are the problem and would never book a photographer for it. Roast and Photo AI's audiences skew male because men get fewer matches and are more willing to pay for a fix. They search "how to take better dating profile pictures", "hinge photo ideas for men", "do AI dating photos work", and they post in r/Tinder and r/hingeapp asking for profile reviews.

Secondary: women 25 to 40 in the same markets, more sensitive to the "looks fake" risk, more likely to be converted by a visible realism guarantee and by the "keep the images either way" refund line.

Moments that trigger the purchase: new city, breakup, post-gym transformation, a profile review that said "your photos are bad", January (peak dating-app signups) and the run-up to Valentine's.

What they want that headshot buyers do not: variety of scene (coffee shop, hike, dinner, beach, dog, travel), candid framing (three-quarter and full body, not head and shoulders), warm natural light, imperfection (no plastic skin, no studio bokeh), and privacy (they are more nervous about their face being stored than a LinkedIn buyer).

## Positioning and offer

One line: "Dating photos that look like you on a good day. Five selfies, one payment, done in about an hour."

Promises on the hero, in this order:
1. Look-like-you guarantee, or your money back (3 days, keep the images)
2. Three one-time packs, from $19. No subscription, no credits.
3. Candid, not studio. Real light, real places, real skin.

Price ladder (mirrors the headshot tiers, one step up because packs are bigger and buyers benchmark against $29 to $79):

| Tier | Price | Photos | Scenes | Outfits | Queue |
|---|---|---|---|---|---|
| Starter | $19 | 20 | 3 | 2 | Standard |
| Pro (popular) | $39 | 60 | 6 | 4 | Priority |
| Premium | $59 | 120 | all | all | Front |

Rationale: DatePhotos.AI's "79% pick" tier is $49 for 80 to 180 photos, Roast is $39/mo, PhotoPacks is $24 for 40. $39 for 60 with a guarantee undercuts on risk, not just price. Unit cost is unchanged from headshots (under $2 training, $0.025 per image on flux-dev), so Pro runs at roughly $3.50 COGS.

Upsell to existing headshot buyers: their model is already trained, so a "second shoot" at $15 for 40 photos is pure margin and the first email campaign we send.

## Catalogue

New `product: 'dating'` entries in `packages/picturesk-shared/src/catalog.js`, kept separate from the headshot LOOKS and ATTIRE so neither product's select page shows the other's options.

Scenes (dating equivalent of LOOKS), 12 to start, each with a prompt fragment written for candid framing:
coffee_shop, rooftop_bar_golden_hour, city_street_evening, hiking_trail, beach_sunset, park_picnic, cosy_kitchen, bookshop, gym_casual (not shirtless), dinner_table, travel_old_town, dog_park (adds "with a friendly dog", flagged as optional since it invents a pet)

Outfits (dating equivalent of ATTIRE), 8 to start:
smart_casual_shirt, fitted_tee_jeans, knit_sweater, linen_shirt_summer, denim_jacket, bomber_jacket, blazer_no_tie, athleisure

Women's variants of the same ids resolve through the existing gender fragment; where an outfit reads differently by gender (linen shirt vs linen dress) the fragment carries both and `buildSubject` gender picks. This needs a small change to `buildPrompts` so an outfit can have `promptFragmentByGender`.

Quality tail, new `DATING_QUALITY_TAIL`: "candid lifestyle photo, three-quarter or waist-up framing, shot on a full-frame camera with a 35mm lens, natural available light, warm golden tones, genuine relaxed smile, looking slightly off camera or at camera, natural realistic skin texture with pores, no retouching, sharp eyes, slight film grain". Framing is the biggest single change: the headshot tail forces head-and-shoulders, which is exactly what looks staged in a dating profile.

Mix rule in `buildPrompts` for dating: at least 30% of prompts specify "looking away from camera, mid-laugh" or "walking", because every competitor review complaint about "too AI" is really about every shot being a posed portrait.

## Data model and backend

- `pricing.js`: add `product` to each tier (`'headshots'` on the existing three) and add three `dating_*` tiers. `getTier` unchanged. Add `tiersFor(product)`.
- `orderModel.js`: `product: { type: String, default: 'headshots', index: true }`. Legacy orders default correctly.
- `POST /checkout`: accept `product`, validate looks and attire against that product's catalogue, enforce that product's caps (the code shipped on 17 Sep already does caps per tier), stamp `product` on the order, and name the Stripe line item "Picturesk dating photos (Pro, 60 photos)".
- Worker: `buildPrompts` takes `product` and picks the catalogue and tail. Identity scoring threshold stays; consider raising `overgenerateFactor` for dating because candid poses drift more, and deliver only the top N by identity score. That is the "realness" claim made true.
- Emails: paid and delivery templates get a `product` switch for subject line and copy. Same 3-day guarantee.
- Admin orders list: a Product column and filter. Small.

## Frontend

Funnel reuses `app/(site)/ai-headshot-generator/(funnel)/*` by lifting the three step pages into a shared component that takes `product`. Two route groups mount it:

- `/ai-headshot-generator/select|upload|payment` (unchanged URLs)
- `/ai-dating-photos/select|upload|payment`

`lib/generator.js` state gets a `product` key and a namespaced localStorage key per product so a half-finished headshot order does not bleed into a dating order. Stepper, upload gate, capture flow, payment page and success page all work unchanged; the success page reads `order.product` for its headline.

Select page differences for dating: section labels become "Scenes" and "Outfits", the About-you block is identical, and the plan cards show the dating tiers. The `?tier=` param carries over from pricing cards, same as headshots.

## Pages and slugs

Same structure as `/ai-headshot-generator` (data-driven `data/pages/*.js` object, `landingMetadata` and `landingSchema` from `lib/landingPage.js`, sections Hero, HowItWorks, Pricing, Benefits, UseCases, Showcase, Testimonials, FAQ, final CTA). `landingSchema` gains a `root` argument so dating pages breadcrumb from `/ai-dating-photos`, not the headshot page.

| Slug | Primary keyword | Role |
|---|---|---|
| `/ai-dating-photos` | AI dating photos | Canonical product page. Hero, process, pricing, why us, who it is for, proof, testimonials (real only, see below), FAQ, CTA. |
| `/hinge-photos` | Hinge photos | Destination page. What works on Hinge specifically (six-photo slots, prompts, candid over posed), then the product. |
| `/tinder-photos` | Tinder photos | Destination page. First-photo psychology, full-body shot, no group shots. |
| `/bumble-photos` | Bumble profile pictures | Destination page. Women-message-first framing, approachable over intimidating. |
| `/dating-profile-photos-for-men` | dating profile photos for men | Intent page. The male buyer's actual question; links to all three app pages. |
| `/ai-dating-photos-vs-photographer` | dating photographer cost | Comparison page, same shape as `/ai-headshots-vs-photographer`. Dating photographers charge $200 to $500 a session (verify with two live quotes before publishing). |
| `/pricing` | existing | Gains a second tab or block for dating tiers. |

Titles under 60 chars, descriptions under 160, primary keyword in both, no em dashes, per the frontend CLAUDE.md rule. Each page repeats its title question as an H2 above a 40 to 80 word answer, and carries a FAQ block that feeds FAQPage schema. Product schema price becomes "19" for dating pages.

Internal links: the headshot page's UseCases grid gets a "Dating profiles" card pointing at `/ai-dating-photos`; the footer Product column lists it; the blog gets two posts at launch ("Do AI dating photos work in 2026" and "Hinge photo ideas for men") via the existing blog admin.

Sitemap: add the six static slugs to `app/sitemap.js`.

## Proof and testimonials

The showcase needs a real dating set. Run the pipeline on the founder's existing trained model with the dating catalogue before writing any page copy, so the hero and showcase show real output and we learn whether the candid tail actually works. The testimonials section on dating pages ships empty or is omitted until there are real quotes; do not reuse the invented headshot ones on a new page.

## Marketing strategy

Channels, in the order to switch them on:

1. Email to past headshot buyers on launch day: "Your model is already trained. 40 dating photos for $15, this week only." Zero acquisition cost, tests the catalogue on real faces.
2. Reddit: r/Tinder, r/hingeapp, r/Bumble, r/datingoverthirty. Not ads, participation: post genuine before/after of the founder's set with the realism angle, answer "are AI dating photos a scam" threads honestly (they often are, which is the pitch).
3. TikTok and Reels creators in the dating-advice niche, paid per post, brief: "five selfies in, this came out, and here is the one that got matches". Roast's growth came from exactly this format.
4. SEO and GEO: the six pages above plus two blog posts a month. The head terms are contested by Photo AI's `/tinder` and `/ai-dating-photos` pages; we win the long tail ("Photo AI alternative one-time", "AI dating photos that don't look fake", "Hinge photos for men over 30") and the comparison intent.
5. Affiliates: dating coaches and profile-review services (Roast's model shows buyers pay for the outcome). 20% on a $39 sale is attractive to them.
6. Paid: Google Search on "ai dating photos" and "dating photo ai" only after the organic pages exist, so the landing page quality score is real. Meta ads in January and early February.

Messaging pillars: (1) looks like you, guaranteed; (2) candid, not studio; (3) one payment, keep everything; (4) private: photos used only for your model, never for training a shared one, deletable on request.

## Analytics

Reuse the existing events with a `product` prop: `landing_view`, `select_view`, `upload_started`, `upload_completed`, `payment_view`, `checkout_started`, `purchase_completed`. GA4 conversion stays `purchase_completed`; segment by product in reports.

## Build order and estimate

1. Catalogue, tail, pricing tiers, `product` on order and checkout, worker prompt switch. Backend only, testable with the dev fake pipeline. About a day.
2. Run a real dating set on the founder's model; iterate the tail until output is candid and recognisable. Half a day plus GPU time.
3. Funnel refactor to a shared product-aware component, second route group, namespaced state. About a day.
4. `/ai-dating-photos` product page and `/pricing` block. Half a day.
5. Four destination and comparison pages, sitemap, footer, headshot UseCases link, two blog posts. One day.
6. Emails, admin product column, success page headline. Half a day.
7. Launch email to past buyers, Reddit posts, creator briefs. Marketing, not code.

Roughly four to five working days of build before marketing starts.

## Decisions taken

1. Prices: $19 / $39 / $59 (20 / 60 / 120 photos).
2. `dog_park` and `gym_casual` ship, each with a note on the option card so the customer opts in knowingly.
3. Second-shoot upsell: deferred, there are no past buyers yet.
4. Testimonials: placeholder quotes on the dating pages for now, flagged in the data file, to be replaced with real ones.

## Still to do after launch

- Run a real dating set on a trained model and iterate `DATING_QUALITY_TAIL` until output is candid and recognisable; then add a Showcase to `/ai-dating-photos` with that real output and preview images for the scene and outfit cards (they render as colour swatches until then).
- Two launch blog posts.
- Spot-check the photographer price ranges on `/ai-dating-photos-vs-photographer` against two live quotes.
