export const TICKET_VALIDITIES = ['2 Days', '7 Days', '14 Days'];

const FALLBACK_PRICES = { '2 Days': 49, '7 Days': 69, '14 Days': 79 };

export const FALLBACK_PRICING_OPTIONS = TICKET_VALIDITIES.map((validity) => ({
  value: validity,
  label: validity,
  price: FALLBACK_PRICES[validity],
}));
