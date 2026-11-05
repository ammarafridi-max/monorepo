import { CURRENCY, PRICING_OPTIONS } from '@/config';

export const AED_TIERS = PRICING_OPTIONS.map((o) => ({
  label: o.label.toLowerCase(),
  price: `${CURRENCY} ${o.price}`,
}));
