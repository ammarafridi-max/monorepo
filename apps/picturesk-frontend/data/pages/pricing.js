/**
 * /pricing
 *
 * Same shape as the landing pages. This one exists because pricing was only ever a
 * section of the home page, so "how much do AI headshots cost" had nowhere to land.
 * The plan facts themselves are NOT written here: the Pricing section reads them
 * from @travel-suite/picturesk-shared, so the page can never quote a price the
 * funnel does not charge.
 */
export const pricingPage = {
  meta: {
    // 47 chars / 154 chars
    title: 'AI Headshot Pricing: Plans From $9 | Picturesk',
    description:
      'AI headshot pricing with no subscription. Three one-time plans from $9: 5, 25 or 60 headshots, delivered in about an hour. See what each plan includes.',
    canonical: '/pricing',
    breadcrumb: 'Pricing',
  },

  sections: {
    hero: {
      eyebrow: 'Pricing',
      title: 'What AI headshots cost here.',
      lede: 'Three one-time plans, from $9. You pay once, there is no subscription and no credit balance, and every plan trains a model on your own face and delivers at full resolution with no watermark. What changes between them is how many headshots you get and how much of the outfit and background catalogue you can pick from.',
      promises: [
        'One payment, no subscription, no credits',
        'Full resolution, no watermark, yours to use anywhere',
        'Automatic refund if a run fails',
      ],
    },

    pricing: {
      eyebrow: 'The plans',
      title: 'Pick the number of headshots you need.',
      lede: 'Every plan includes the same model trained on your own face. Starter is enough for one profile photo; Pro is what most people take; Premium unlocks the whole catalogue.',
      cta: 'Get my headshots',
    },

    benefits: {
      eyebrow: 'What the price includes',
      title: 'No upsells hiding behind the number.',
      lede: 'The price you see is what you pay. These are the things other tools charge extra for, or do not offer at all.',
      benefits: [
        {
          icon: 'price',
          title: 'One payment, not a subscription',
          body: 'You pay once and you are done. There is no monthly plan to remember to cancel and no credit balance to top up before you can generate anything.',
        },
        {
          icon: 'screen',
          title: 'Nothing locked behind a higher tier',
          body: 'Every headshot is delivered at full resolution with no watermark, on every plan. There is no upsell to unlock the good shots after you have seen them.',
        },
        {
          icon: 'face',
          title: 'A model trained on your face on every plan',
          body: 'Starter is not a cheaper, worse process. The same fine-tune runs whichever plan you buy; the higher plans simply generate more of the set and open up more of the catalogue.',
        },
        {
          icon: 'refund',
          title: 'Refunded if it does not work',
          body: 'If a generation run fails, the refund is issued automatically by the system. If the set comes back and it does not look like you, tell us within 14 days and we refund in full.',
        },
      ],
    },

    faq: {
      eyebrow: 'FAQ',
      title: 'Pricing, answered.',
      lede: 'What people ask before they pick a plan.',
      faqs: [
        {
          q: 'How much do AI headshots cost?',
          a: 'Here, between $9 and $49 as a one-time payment. Starter is $9 for 5 headshots, Pro is $29 for 25, and Premium is $49 for 60. A traditional headshot session usually runs from around $150 upwards and needs a booking and a half day.',
        },
        {
          q: 'Is there a subscription or a credit system?',
          a: 'No. You pay once for the set you chose. There is no recurring charge, no credit balance, and nothing to cancel afterwards.',
        },
        {
          q: 'Which plan should I pick?',
          a: 'If you need one strong profile photo today, Starter does it. Most people take Pro, because 25 shots across three outfits and four backgrounds means you can pick a favourite and keep spares. Premium is for people who want the full catalogue or expect to use headshots all year.',
        },
        {
          q: 'What do the outfit and background limits mean?',
          a: 'Each plan sets how many of the catalogue options you can select before generating. Starter covers one outfit and two backgrounds, Pro covers three outfits and four backgrounds, and Premium unlocks all of them.',
        },
        {
          q: 'Can I get a refund?',
          a: 'Yes, in two situations. If a generation run fails, the refund is issued automatically without you asking. And if your headshots come back and they do not look like you, reply to your delivery email within 14 days and we refund your purchase in full.',
        },
      ],
    },

    cta: {
      eyebrow: 'Ready when you are',
      title: 'Pick a plan and upload your selfies.',
      lede: 'One payment, about an hour, and the set is in your inbox.',
      button: 'Get my headshots',
    },
  },
};
