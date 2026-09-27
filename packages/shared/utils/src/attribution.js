const TOUCH_KEYS = [
  'source', 'medium', 'campaign', 'term', 'content',
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid',
  'landingPage', 'referrer',
];

const touchFields = () => ({
  ...Object.fromEntries(TOUCH_KEYS.map((key) => [key, { type: String }])),
  capturedAt: { type: Date },
});

export const attributionSchemaField = () => ({ first: touchFields(), last: touchFields() });

function sanitizeTouch(touch) {
  if (!touch || typeof touch !== 'object') return undefined;
  const clean = {};
  for (const key of TOUCH_KEYS) {
    if (typeof touch[key] === 'string' && touch[key].trim()) clean[key] = touch[key].trim().slice(0, 500);
  }
  const capturedAt = touch.capturedAt ? new Date(touch.capturedAt) : null;
  if (capturedAt && !Number.isNaN(capturedAt.getTime())) clean.capturedAt = capturedAt;
  return Object.keys(clean).length ? clean : undefined;
}

export function sanitizeAttribution(input) {
  if (!input || typeof input !== 'object') return undefined;
  const first = sanitizeTouch(input.first);
  const last = sanitizeTouch(input.last);
  return first || last ? { first, last } : undefined;
}
