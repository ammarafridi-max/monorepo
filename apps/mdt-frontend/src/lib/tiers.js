import { CURRENCY, PRICING_OPTIONS } from '@/config';

/** Validity tiers for the quick answer rail, read from config so a price
 *  change lands here too rather than being retyped on ten pages. */
export const AED_TIERS = PRICING_OPTIONS.map((o) => ({
  label: o.label.toLowerCase(),
  price: `${CURRENCY} ${o.price}`,
}));
