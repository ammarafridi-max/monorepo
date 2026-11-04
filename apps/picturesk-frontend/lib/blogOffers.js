const HEADSHOTS = {
  id: 'headshots',
  eyebrow: 'AI Headshot Generator',
  price: 'From $9',
  note: 'Upload five to fifteen selfies. We train a model on your own face and email a set of studio headshots in about an hour.',
  href: '/ai-headshot-generator',
  cta: 'See how it works',
  tone: 'brand',
};

const LINKEDIN = {
  id: 'linkedin',
  eyebrow: 'LinkedIn Headshots',
  price: 'From $9',
  note: 'Square 1:1 headshots framed for the circular crop, so nothing important sits where LinkedIn cuts.',
  href: '/linkedin-headshots',
  cta: 'AI LinkedIn headshots',
};

const PRICING = {
  id: 'pricing',
  eyebrow: 'Pricing',
  price: '$9 / $29 / $49',
  note: 'Three one-time plans for 5, 25 or 60 headshots. No subscription, no credits, nothing locked behind a tier.',
  href: '/pricing',
  cta: 'What AI headshots cost here',
};

const VS_PHOTOGRAPHER = {
  id: 'vs-photographer',
  eyebrow: 'Compared',
  price: 'AI or a studio?',
  note: 'What each option costs, how long each takes, and the jobs where booking a photographer is still the right call.',
  href: '/ai-headshots-vs-photographer',
  cta: 'AI headshots vs a photographer',
};

const ANALYZER = {
  id: 'analyzer',
  eyebrow: 'Free tool',
  price: 'Score out of 100',
  note: 'Drop in the photo you use now and see how it reads in the circle, with the two or three things worth fixing.',
  href: '/tools/linkedin-photo-analyzer',
  cta: 'Score your LinkedIn photo',
};

const PRIVACY = {
  id: 'privacy',
  eyebrow: 'Your photos',
  price: 'What we keep',
  note: 'What happens to the selfies you upload, how long they are kept, and how to have them deleted.',
  href: '/privacy',
  cta: 'Read the privacy policy',
};

const REAL_ESTATE = {
  id: 'real-estate',
  eyebrow: 'For agents',
  price: 'From $9',
  note: 'Headshots big enough for listings, signage and print, from the selfies already on your phone.',
  href: '/real-estate-agent-headshots',
  cta: 'Real estate agent headshots',
};

const inline = (headline, note, href, cta) => ({ headline, note, href, cta });

const MAP = {
  'what-makes-a-good-linkedin-profile-photo': {
    offers: [LINKEDIN, ANALYZER],
    inlineOffer: inline(
      'Want one that ticks all of these?',
      'Upload a few selfies and we send back LinkedIn headshots framed for the circular crop, from $9.',
      '/linkedin-headshots',
      'AI LinkedIn headshots',
    ),
  },
  'best-background-for-linkedin-headshot': {
    offers: [LINKEDIN, HEADSHOTS],
    inlineOffer: inline(
      'Pick your background, we shoot it.',
      'Studio, office and outdoor backdrops you choose before you pay, delivered in about an hour from $9.',
      '/linkedin-headshots',
      'LinkedIn headshots from $9',
    ),
  },
  'should-you-smile-in-your-linkedin-headshot': {
    offers: [LINKEDIN, ANALYZER],
    inlineOffer: inline(
      'Get both versions and pick later.',
      'Plans deliver 5, 25 or 60 headshots, so you can test a warm one and a neutral one on your profile.',
      '/linkedin-headshots',
      'AI LinkedIn headshots',
    ),
  },
  'what-to-wear-for-a-linkedin-headshot': {
    offers: [LINKEDIN, PRICING],
    inlineOffer: inline(
      'Choose the outfit before you pay.',
      'Suits, shirts, knits and business casual, all picked from a catalogue up front. From $9, one payment.',
      '/linkedin-headshots',
      'LinkedIn headshots from $9',
    ),
  },
  'linkedin-photo-cropped-how-to-stop-it': {
    offers: [LINKEDIN, ANALYZER],
    inlineOffer: inline(
      'Or start from a photo framed for the crop.',
      'Every Picturesk headshot is composed square with headroom, so the circle never takes the top of your head.',
      '/linkedin-headshots',
      'AI LinkedIn headshots',
    ),
  },
  'how-often-to-update-linkedin-photo': {
    offers: [LINKEDIN, PRICING],
    inlineOffer: inline(
      'Due an update?',
      'A current set of LinkedIn headshots from your own selfies, in about an hour, from $9.',
      '/linkedin-headshots',
      'Update my LinkedIn photo',
    ),
  },
  'how-much-do-professional-headshots-cost': {
    offers: [PRICING, VS_PHOTOGRAPHER],
    inlineOffer: inline(
      'What the AI option costs here.',
      'Three one-time plans: $9 for 5 headshots, $29 for 25, $49 for 60. No subscription and no credits.',
      '/pricing',
      'See Picturesk pricing',
    ),
  },
  'ai-headshots-vs-photographer-compared': {
    offers: [VS_PHOTOGRAPHER, PRICING],
    inlineOffer: inline(
      'The two options, side by side.',
      'Our own comparison page puts real prices on both sides, including when a studio is still the better call.',
      '/ai-headshots-vs-photographer',
      'AI headshots vs a photographer',
    ),
  },
  'how-many-photos-for-ai-headshots': {
    offers: [HEADSHOTS, PRICING],
    inlineOffer: inline(
      'We check your uploads before you pay.',
      'Add five to fifteen selfies and we flag anything that will not work, so a weak set never reaches checkout.',
      '/ai-headshot-generator',
      'Try our AI headshot generator',
    ),
  },
  'selfies-that-make-ai-headshots-look-like-you': {
    offers: [HEADSHOTS, PRICING],
    inlineOffer: inline(
      'Ready to upload the good ones?',
      'We screen every selfie as you add it, then train a model on your own face. From $9, one payment.',
      '/ai-headshot-generator',
      'Try our AI headshot generator',
    ),
  },
  'good-light-for-selfies-before-you-upload': {
    offers: [HEADSHOTS, ANALYZER],
    inlineOffer: inline(
      'Good light in, good headshots out.',
      'Once you have five to fifteen usable selfies, we take it from there and email the set in about an hour.',
      '/ai-headshot-generator',
      'Upload your selfies',
    ),
  },
  'can-you-use-old-photos-for-ai-headshots': {
    offers: [HEADSHOTS, PRICING],
    inlineOffer: inline(
      'Not sure your photos will pass?',
      'Our screening tells you before you pay, and the free plan lets you check the likeness for nothing.',
      '/ai-headshot-generator',
      'Try our AI headshot generator',
    ),
  },
  'glasses-beards-hats-ai-headshots': {
    offers: [HEADSHOTS, LINKEDIN],
    inlineOffer: inline(
      'Your beard stays your beard.',
      'We fine-tune a model on your own face rather than pasting features onto a stock body. From $9.',
      '/ai-headshot-generator',
      'See how it works',
    ),
  },
  'are-ai-headshots-professional-enough': {
    offers: [LINKEDIN, VS_PHOTOGRAPHER],
    inlineOffer: inline(
      'Judge it on the output.',
      'Headshots trained on your own face, framed for a profile crop, with a refund if they do not look like you.',
      '/linkedin-headshots',
      'AI LinkedIn headshots',
    ),
  },
  'can-people-tell-a-headshot-is-ai': {
    offers: [HEADSHOTS, VS_PHOTOGRAPHER],
    inlineOffer: inline(
      'See a real set before you decide.',
      'The headshots on our product page came from ordinary phone selfies. Judge the likeness yourself.',
      '/ai-headshot-generator',
      'See real results',
    ),
  },
  'is-it-honest-to-use-an-ai-headshot': {
    offers: [LINKEDIN, VS_PHOTOGRAPHER],
    inlineOffer: inline(
      'A photo that still looks like you in the room.',
      'We train on your own face, and refund you if the set does not look like you. From $9, one payment.',
      '/linkedin-headshots',
      'AI LinkedIn headshots',
    ),
  },
  'why-ai-headshots-look-nothing-like-you': {
    offers: [HEADSHOTS, VS_PHOTOGRAPHER],
    inlineOffer: inline(
      'This is the problem we built around.',
      'Input screening before payment, a model trained on your face, and your money back if the likeness fails.',
      '/ai-headshot-generator',
      'See how it works',
    ),
  },
  'ai-headshot-vs-face-swap': {
    offers: [HEADSHOTS, VS_PHOTOGRAPHER],
    inlineOffer: inline(
      'Trained, not swapped.',
      'Picturesk fine-tunes a model on your own selfies, which is why the result holds up at full resolution.',
      '/ai-headshot-generator',
      'See how it works',
    ),
  },
  'how-do-ai-headshot-generators-work': {
    offers: [HEADSHOTS, PRICING],
    inlineOffer: inline(
      'Here is ours, end to end.',
      'Screening, training, generation and delivery by email, in about an hour. One payment from $9.',
      '/ai-headshot-generator',
      'Try our AI headshot generator',
    ),
  },
  'what-happens-to-your-photos-ai-headshot-generator': {
    offers: [PRIVACY, HEADSHOTS],
    inlineOffer: inline(
      'What Picturesk does with yours.',
      'Which files we keep, how long we keep them, and how to have every one of them deleted on request.',
      '/privacy',
      'Read our privacy policy',
    ),
  },
};

const FALLBACK = { offers: [HEADSHOTS, PRICING], inlineOffer: null };

const TAG_FALLBACK = [
  ['real-estate-headshots', { offers: [REAL_ESTATE, PRICING], inlineOffer: null }],
  ['linkedin-headshots', { offers: [LINKEDIN, PRICING], inlineOffer: null }],
  ['pricing-and-value', { offers: [PRICING, VS_PHOTOGRAPHER], inlineOffer: null }],
];

export function blogOffersFor(slug, tags = []) {
  if (MAP[slug]) return MAP[slug];

  const slugs = tags.map((t) => (typeof t === 'string' ? t : t?.slug)).filter(Boolean);
  const hit = TAG_FALLBACK.find(([tag]) => slugs.includes(tag));
  return hit ? hit[1] : FALLBACK;
}
