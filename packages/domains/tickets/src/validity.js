import { TICKET_VALIDITIES } from '@travel-suite/utils/ticket-validity';

export { TICKET_VALIDITIES, SHORTEST_VALIDITY, VALIDITY_DAYS } from '@travel-suite/utils/ticket-validity';

const DEFAULT_PRICES = { '2 Days': 49, '7 Days': 69, '14 Days': 79 };

export const DEFAULT_PRICING_OPTIONS = TICKET_VALIDITIES.map((validity, index) => ({
  validity,
  price: DEFAULT_PRICES[validity],
  isActive: true,
  sortOrder: index,
}));
