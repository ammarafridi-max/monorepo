export const TICKET_VALIDITIES = ['2 Days', '7 Days', '14 Days'];

export const SHORTEST_VALIDITY = TICKET_VALIDITIES[0];

export const VALIDITY_DAYS = Object.fromEntries(
  TICKET_VALIDITIES.map((validity) => [validity, parseInt(validity, 10)]),
);
