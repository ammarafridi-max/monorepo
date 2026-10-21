export const TICKET_VALIDITIES = ['2 Days', '7 Days', '14 Days'];

export const SHORTEST_VALIDITY = TICKET_VALIDITIES[0];

export const VALIDITY_DAYS = Object.fromEntries(
  TICKET_VALIDITIES.map((validity) => [validity, parseInt(validity, 10)]),
);

const DEFAULT_PRICES = { '2 Days': 49, '7 Days': 69, '14 Days': 79 };

export const DEFAULT_PRICING_OPTIONS = TICKET_VALIDITIES.map((validity, index) => ({
  validity,
  price: DEFAULT_PRICES[validity],
  isActive: true,
  sortOrder: index,
}));
