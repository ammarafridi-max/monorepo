/**
 * The home page (the hub). It answers "what can I make from my selfies" and sends
 * the visitor into the right funnel. It must not restate a product page: the
 * headshot page owns "AI headshot generator", the dating page owns "AI dating
 * photos". The hub owns the brand and the category ("AI photos from selfies").
 */
export const hub = {
  meta: {
    // 54 chars / 154 chars
    title: 'Picturesk: AI Headshots and Dating Photos From Selfies',
    description:
      'Picturesk turns a few selfies into professional headshots and candid dating photos. A model trained on your face, one payment, delivered in about an hour.',
  },

  hero: {
    eyebrow: 'AI photo studio',
    title: 'One set of selfies. Every photo you need.',
    lede: 'Picturesk is an AI photo studio. Upload five to fifteen selfies once, and we train a model on your own face and generate the photos you need from it: professional headshots for LinkedIn and your CV, or candid dating photos for Hinge, Tinder and Bumble. No photographer, no studio, one payment per set, delivered by email in about an hour.',
  },

  services: {
    eyebrow: 'Services',
    title: 'Two shoots. One face.',
    lede: 'Each service has its own catalogue, its own price and its own funnel. Both train the same model on your selfies.',
    items: [
      {
        id: 'headshots',
        title: 'Professional Headshots',
        from: 9,
        href: '/ai-headshot-generator/about',
        learn: '/ai-headshot-generator',
        who: 'For LinkedIn, CVs, company pages and speaker bios.',
        body: 'Studio backdrops, offices and outdoor looks in suits, shirts and knits. Head and shoulders, framed for a profile crop. 5, 25 or 60 headshots.',
        links: [
          { label: 'LinkedIn Headshots', href: '/linkedin-headshots' },
          { label: 'Real Estate Agent Headshots', href: '/real-estate-agent-headshots' },
          { label: 'AI vs Photographer', href: '/ai-headshots-vs-photographer' },
        ],
      },
      {
        id: 'dating',
        title: 'Dating Photos',
        from: 19,
        href: '/ai-dating-photos/about',
        learn: '/ai-dating-photos',
        who: 'For Hinge, Tinder and Bumble.',
        body: 'Coffee shops, rooftops, trails and dinner tables, in clothes you actually own. Candid framing, natural light, real skin. 20, 60 or 120 photos.',
        links: [
          { label: 'Hinge Photos', href: '/hinge-photos' },
          { label: 'Tinder Photos', href: '/tinder-photos' },
          { label: 'Bumble Profile Pictures', href: '/bumble-photos' },
          { label: 'Dating Photos for Men', href: '/dating-profile-photos-for-men' },
        ],
      },
    ],
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'Picturesk, answered.',
    lede: 'The things people ask before they upload anything.',
    faqs: [
      {
        q: 'What is Picturesk?',
        a: 'Picturesk is an AI photo studio. You upload five to fifteen selfies, we train a model on your face, and we generate the photos you need from it: professional headshots or candid dating photos. You pay once per set, and the results arrive by email in about an hour.',
      },
      {
        q: 'Which service should I pick?',
        a: 'Headshots if the photo is going on LinkedIn, a CV, a company page or a bio: head and shoulders, studio or office backgrounds, framed for a profile crop. Dating photos if it is going on Hinge, Tinder or Bumble: wider, candid, in real places and everyday clothes. Same selfies either way, so you can do both.',
      },
      {
        q: 'Do the photos actually look like me?',
        a: 'Yes, when your photos are good. We train a model on your own face rather than pasting your features onto a stock body, so the results are you. If a set arrives and it does not look like you, tell us within 3 days and we refund in full.',
      },
      {
        q: 'Is this a subscription?',
        a: 'No. Every service is sold as one-time packs: headshots from $9, dating photos from $19. No monthly charge and no credits that expire. Your first small set is free, once per account, so you can see the result before you pay.',
      },
      {
        q: 'How long does it take?',
        a: 'About an hour. After you pay we train a model on your face and generate your set, then email you a link to download it. Nothing to keep open or watch.',
      },
      {
        q: 'What happens to my photos?',
        a: 'Your selfies go to private storage and are used only to train your model and generate your photos. They are never used to train a shared model. We keep your trained model for 12 months so you can order another set without uploading again, and we remove everything on request.',
      },
    ],
  },

  cta: {
    eyebrow: 'Ready when you are',
    title: 'Pick a shoot. Upload your selfies. Pay once.',
    lede: 'Headshots for work, dating photos for the apps, or both from the same five selfies.',
  },
};
