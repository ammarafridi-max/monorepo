/**
 * /ai-dating-photos
 *
 * The canonical product page for dating photos, in the same shape as the other
 * landing pages: `meta` for metadata and schema, `sections` for everything the
 * page renders. Every claim must stay true to what the product does: the same
 * upload gate, a model trained on the customer's own face, one-time payment,
 * automatic refund on a failed run, and the 3-day look-like-you refund.
 *
 * TESTIMONIALS below are PLACEHOLDERS, invented so the section can be designed,
 * and must be replaced with real, attributable quotes.
 */
export const aiDatingPhotos = {
  meta: {
    // 52 chars / 159 chars
    title: 'AI Dating Photos That Look Like You | From $19, Once',
    description:
      'AI dating photos for Hinge, Tinder and Bumble, trained on your own selfies. Candid, natural, and yours in about an hour. One payment from $19, no subscription.',
    canonical: '/ai-dating-photos',
    breadcrumb: 'AI Dating Photos',
  },

  sections: {
    hero: {
      eyebrow: 'AI Dating Photos',
      title: 'Dating photos that look like you on a good day.',
      lede: 'Picturesk makes AI dating photos from your own selfies. Upload five to fifteen, choose the scenes and outfits, and pay once. We train a model on your face and send back a set of candid, natural photos for Hinge, Tinder and Bumble in about an hour. No photographer, no posing, no subscription.',
      promises: [
        'Look-like-you guarantee, or your money back',
        'Three one-time packs, from $19. No subscription, no credits.',
        'Candid, not studio. Real light, real places, real skin.',
      ],
    },

    process: {
      eyebrow: 'The process',
      title: 'Three steps, about an hour.',
      lede: 'No photographer to book, no friend to hold the camera, nothing to pose for. You upload, we train and generate, and the set lands in your inbox.',
      steps: [
        {
          title: 'Upload your selfies',
          body: 'Five to fifteen recent photos of your face, from a few angles. We check each one as you add it and flag anything that will not work, so you find out before you pay.',
        },
        {
          title: 'Pick your scenes and outfits',
          body: 'A coffee shop, a hike, dinner out, a rooftop at golden hour. Clothes you would actually wear. We spread your set across whatever you choose and vary the poses so it never looks like one shoot.',
        },
        {
          title: 'Get your photos by email',
          body: 'About an hour later we email you a link to the finished set at full resolution. Pick the best for each slot on your profile and keep the rest.',
        },
      ],
    },

    pricing: {
      eyebrow: 'Pricing',
      title: 'Three packs. One time.',
      lede: 'Every pack trains a model on your own face and delivers at full resolution. What changes is how many photos you get and how many scenes and outfits you can pick from.',
      cta: 'Get my dating photos',
    },

    benefits: {
      eyebrow: 'Why Picturesk',
      title: 'Built to pass the "is that really you" test.',
      lede: 'Every AI dating photo tool promises better matches. The difference is whether the person who turns up looks like the person in the photos.',
      benefits: [
        {
          icon: 'face',
          title: 'Trained on your face, not a filter',
          body: 'A face swap pastes your features onto a stock body and it shows on the first date. We fine-tune a model on your own selfies, so the whole photo is built around your face, your build and your hair.',
        },
        {
          icon: 'screen',
          title: 'Candid on purpose',
          body: 'Studio bokeh and a head-and-shoulders crop scream "AI headshot". These are shot wider, in natural light, with real skin texture, and a share of them look away from the camera or catch you mid-laugh.',
        },
        {
          icon: 'price',
          title: 'One price, no subscription, no credits',
          body: 'Most dating photo tools bill monthly and burn credits on photos you throw away. You pay once for a pack, keep everything at full resolution, and there is nothing to cancel.',
        },
        {
          icon: 'refund',
          title: 'If they do not look like you, you get your money back',
          body: 'If a run fails, the refund is automatic. If the set arrives and it does not look like you, tell us within 3 days and we refund in full. You keep the images either way.',
        },
      ],
    },

    useCases: {
      eyebrow: 'Who it is for',
      title: 'Photos for every slot on your profile.',
      lede: 'Most profiles have six photo slots and one decent picture. This fills the other five.',
      items: [
        {
          title: 'Hinge',
          body: 'Hinge rewards variety: a clear face, a full-length shot, something you are doing, somewhere you have been. One pack covers the lot.',
          href: '/hinge-photos',
        },
        {
          title: 'Tinder',
          body: 'The first photo decides everything. Get one that is unmistakably you, well lit, and not a mirror selfie.',
          href: '/tinder-photos',
        },
        {
          title: 'Bumble',
          body: 'Approachable beats intimidating. Warm light, a real smile, and a scene that gives someone something to open with.',
          href: '/bumble-photos',
        },
        {
          title: 'Men who hate having their photo taken',
          body: 'No photographer, no friend, no posing. Five selfies in, a full set out, and nobody watched you do it.',
          href: '/dating-profile-photos-for-men',
        },
        {
          title: 'New city, new profile',
          body: 'You moved, your photos did not. Refresh the whole set in an hour instead of waiting for a weekend and a willing friend.',
        },
        {
          title: 'Back on the apps after a break',
          body: 'The old photos are three years and one haircut out of date. Start again with a set that looks like you now.',
        },
      ],
    },

    testimonials: [
      {
        quote:
          'I have been on Hinge for two years with the same four photos. New set went up on a Sunday, I had more likes by Wednesday than the previous month. And they look like me, which was the part I was worried about.',
        rating: 5,
        name: 'Daniel Mercer',
        role: 'Software engineer, 31',
      },
      {
        quote:
          'I expected the plastic AI face. The coffee shop ones genuinely look like a friend took them. I used three of the sixty and kept the rest for later.',
        rating: 5,
        name: 'Priya Raman',
        role: 'Product designer, 28',
      },
      {
        quote:
          'I do not have a single friend who can take a photo. This solved that for $39 and I did not have to stand in a park feeling like an idiot.',
        rating: 5,
        name: 'Tom Whitaker',
        role: 'Teacher, 36',
      },
    ],

    faq: {
      eyebrow: 'FAQ',
      title: 'AI dating photos, answered.',
      lede: 'The things people ask before they upload anything.',
      faqs: [
        {
          q: 'Do AI dating photos actually work?',
          a: 'They work when they look like you. Better lighting, a clear face and some variety in scenes are what get profiles more matches, and that is what a good set gives you. A set that flatters you into someone else backfires on the first date, which is why we train on your own face and refund you if it does not look like you.',
        },
        {
          q: 'Will people be able to tell they are AI?',
          a: 'Not if your uploads are good. The giveaways are usually plastic skin, studio-style bokeh and the same posed expression in every shot. Ours are framed wider, lit naturally, keep real skin texture, and vary the pose across the set so it reads like photos from a few different days.',
        },
        {
          q: 'What photos do I need to upload?',
          a: 'Five to fifteen recent photos of just you, with one clear face in each, from a few angles and in decent light. Skip sunglasses, hats and filters. We check every photo as you add it and flag anything that will hurt the result before you pay.',
        },
        {
          q: 'Is this a subscription?',
          a: 'No. You pick one of three packs and pay once, from $19. No monthly charge, no credits that expire, and no account needed to buy.',
        },
        {
          q: 'What if they do not look like me?',
          a: 'Then you should not pay for them. If your photos do not look like you, reply to your delivery email within 3 days and we refund your purchase in full. You keep the images either way.',
        },
        {
          q: 'What happens to my selfies?',
          a: 'They go to private storage and are used only to train your model and generate your photos. They are never used to train a shared model and never shown to anyone. Email us at any time and we will remove your photos, your results and your model.',
        },
      ],
    },

    cta: {
      eyebrow: 'Ready when you are',
      title: 'Your dating photos, in about an hour.',
      lede: 'Pick your scenes, upload your selfies, pay once. We handle the rest.',
      button: 'Get my dating photos',
    },
  },
};
