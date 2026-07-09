/**
 * Landing copy that is repeated or likely to change: the process steps, the list
 * of what you get, the delivered looks, and the price. Kept here so content can be
 * edited without touching layout. The looks mirror the worker's generation prompts
 * (apps/worker/replicateClient.js), one look per generated headshot; keep them in
 * step if you change the prompt set.
 */

export const steps = [
  {
    title: 'Upload your selfies',
    body: 'Add five to fifteen clear photos of your face. We check each one on the spot, so you never pay for photos that will not work.',
  },
  {
    title: 'We train your model',
    body: 'We fine-tune a model on your face, then generate a set of studio headshots across a range of professional looks.',
  },
  {
    title: 'Get them by email',
    body: 'In about an hour we email you a link to download your headshots. Ready for LinkedIn the same day.',
  },
];

export const looks = [
  'Navy business suit',
  'Light blue button-down',
  'Charcoal blazer',
  'Outdoor, natural light',
  'Black turtleneck',
  'Grey sweater',
  'Three-piece suit',
];

export const included = [
  'Seven headshots, one per look',
  'High-resolution square JPGs, 1:1',
  'A model trained on your own face',
  'Delivered by email in about an hour',
  'Automatic refund if a run fails',
  'Yours to use anywhere',
];

export const price = {
  amount: '$35',
  cadence: 'one time',
  note: 'No subscription. No account required to buy.',
};
