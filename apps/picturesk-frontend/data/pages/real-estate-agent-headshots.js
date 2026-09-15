/**
 * /real-estate-agent-headshots
 *
 * Same shape as every landing page: `meta` plus `sections`, all rendered through
 * props. A vertical page, so the copy has to be about the job rather than the
 * product. If it reads like the home page with the word "agent" pasted in, it is
 * competing with /ai-headshot-generator instead of adding to it.
 */
export const realEstateAgentHeadshots = {
  meta: {
    // 56 chars / 155 chars
    title: 'Real Estate Agent Headshots From Selfies | From $9',
    description:
      'Realtor headshots that look like you, from your own selfies. Warm, credible photos for listings, signage and your brokerage page. About an hour, from $9.',
    canonical: '/real-estate-agent-headshots',
    breadcrumb: 'Real Estate Agent Headshots',
  },

  sections: {
    hero: {
      eyebrow: 'Real Estate Agent Headshots',
      title: 'The headshot buyers decide to call.',
      lede: 'Your face is on the listing, the sign, the mailer and the brokerage page, and for most sellers it is the first thing they know about you. Upload five to fifteen selfies and we send back a set of warm, credible headshots in about an hour. One payment, from $9.',
      promises: [
        'Enough shots for listings, signage and your profile',
        'Full resolution, no watermark, yours to use anywhere',
        'Look-like-you guarantee, or your money back',
      ],
    },

    process: {
      eyebrow: 'How it works',
      title: 'A new headshot before your next listing.',
      lede: 'No studio booking and no half day out of the field. Three steps, and the set arrives while you are still showing properties.',
      steps: [
        {
          title: 'Upload five to fifteen selfies',
          body: 'Recent photos of your face from a few angles. We check each one as you add it and flag anything that will not work, so you never pay for photos we already know will fail.',
        },
        {
          title: 'Pick the look the job asks for',
          body: 'Choose your backgrounds and outfits. For property, a soft office interior or a clean studio backdrop reads more trustworthy than a dramatic one.',
        },
        {
          title: 'Use it everywhere the same day',
          body: 'About an hour later the finished set lands in your inbox at full resolution, ready for the listing portal, the yard sign and the brokerage directory.',
        },
      ],
    },

    benefits: {
      eyebrow: 'Why agents use it',
      title: 'Built for the way agents actually work.',
      lede: 'You need a current photo in more places than most professions, and you need it without losing a day.',
      benefits: [
        {
          icon: 'face',
          title: 'You still look like your photo at the viewing',
          body: 'A headshot that flatters you into someone else costs you trust at the front door. We fine-tune a model on your own selfies, so the person on the sign is the person who turns up.',
        },
        {
          icon: 'screen',
          title: 'Enough shots for every surface',
          body: 'A portal thumbnail, a yard sign, a mailer and a brokerage bio all crop differently. Plans deliver 5, 25 or 60 headshots, so you have a version that suits each one.',
        },
        {
          icon: 'price',
          title: 'Cheaper than a reshoot every time you switch brokerage',
          body: 'Branding changes, dress codes change, and photos date. At $9 to $49 a set, refreshing your photo stops being a budget decision.',
        },
        {
          icon: 'refund',
          title: 'No subscription, no licensing terms',
          body: 'You pay once and the images are yours to use anywhere, at full resolution and without a watermark. If a run fails, the refund is issued automatically.',
        },
      ],
    },

    useCases: {
      eyebrow: 'Where it goes',
      title: 'One set, every place your face appears.',
      lede: 'Agents need the same photo in more places than almost anyone else. The set covers all of them.',
      items: [
        {
          title: 'Listing portals and your own site',
          body: 'The thumbnail next to every property you represent, at the resolution the portal actually wants rather than a phone photo scaled up.',
        },
        {
          title: 'Yard signs and print',
          body: 'Print is unforgiving about resolution and crop. Full-resolution files mean the sign does not blur when it goes large.',
        },
        {
          title: 'Brokerage and team pages',
          body: 'Put the whole office through the same backgrounds and the directory finally looks like one brokerage rather than fifteen different phone cameras.',
        },
        {
          title: 'Mailers, ads and social',
          body: 'A consistent face across every farm-area mailer and paid ad is how a name becomes recognisable in a neighbourhood.',
        },
      ],
    },

    pricing: {
      eyebrow: 'Pricing',
      title: 'One payment. No subscription.',
      lede: 'Every plan trains a model on your own face and delivers at full resolution. What changes is how many headshots you get and how much of the catalogue you can pick from.',
      cta: 'Get my agent headshots',
    },

    faq: {
      eyebrow: 'FAQ',
      title: 'Agent headshots, answered.',
      lede: 'What agents ask before they put a new photo on a sign.',
      faqs: [
        {
          q: 'Are the files big enough for print and signage?',
          a: 'Yes. Every headshot is delivered at full resolution as a square 1:1 image with no watermark, which covers portal thumbnails, brokerage pages and print work like mailers and yard signs.',
        },
        {
          q: 'Can I use them in paid ads and on listing portals?',
          a: 'Yes. There is no usage limit and no licensing fee. You pay once and the images are yours to use wherever your business needs them.',
        },
        {
          q: 'Which background works best for property?',
          a: 'A softly blurred office interior or a clean studio backdrop. Both read as approachable and credible, which is what a seller is judging. Dramatic low-key lighting looks striking but reads corporate rather than local.',
        },
        {
          q: 'Can my whole office do this together?',
          a: 'Today each agent buys their own set. If everyone picks the same background and outfit, the brokerage directory still comes out looking consistent, which is usually the point.',
        },
        {
          q: 'What if the headshots do not look like me?',
          a: 'Then you should not pay for them. Open your results and if they do not look like you, reply to your delivery email within 14 days and we refund your purchase in full. You keep the images either way.',
        },
      ],
    },

    cta: {
      eyebrow: 'Ready when you are',
      title: 'A headshot your next seller trusts.',
      lede: 'Upload your selfies, pick your look, pay once. We handle the rest.',
      button: 'Get my agent headshots',
    },
  },
};
