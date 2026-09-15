/**
 * /linkedin-headshots
 *
 * One content object per landing page, in the same shape the travel brands use:
 * `meta` for metadata and schema, `sections` for everything the page renders. The
 * page file composes sections and passes these in; nothing on the page is hardcoded.
 *
 * This page is about the DESTINATION, not the product. It must not restate the
 * /ai-headshot-generator page: same product, different question ("what makes a
 * LinkedIn photo work"), so the two do not compete for the same query.
 */
export const linkedinHeadshots = {
  meta: {
    // 57 chars / 152 chars
    title: 'LinkedIn Headshots From Your Selfies | AI, From $9',
    description:
      'Get a LinkedIn headshot that looks like you. Upload a few selfies, pick your background, and we email a full set in about an hour. From $9, no subscription.',
    canonical: '/linkedin-headshots',
    breadcrumb: 'LinkedIn Headshots',
  },

  sections: {
    hero: {
      eyebrow: 'LinkedIn Headshots',
      title: 'A LinkedIn photo people take seriously.',
      lede: 'Your profile photo is the first thing a recruiter, a client or a hiring manager sees, and most people are using a cropped holiday snap. Upload five to fifteen selfies and we send back a set of studio headshots built for LinkedIn: square, well lit, and unmistakably you. About an hour, one payment, from $9.',
      promises: [
        'Square 1:1, so LinkedIn’s circular crop never cuts your head off',
        'Backgrounds that suit a profile, not a party',
        'Look-like-you guarantee, or your money back',
      ],
    },

    process: {
      eyebrow: 'How it works',
      title: 'From camera roll to profile photo.',
      lede: 'No studio booking, no photographer, no half day off work. Three steps and the set is in your inbox.',
      steps: [
        {
          title: 'Upload five to fifteen selfies',
          body: 'Recent photos of your face, from a few angles. We check each one as you add it and flag anything that will not work, so you find out before you pay.',
        },
        {
          title: 'Pick a profile-appropriate look',
          body: 'Choose the backgrounds and outfits you want. For LinkedIn, a plain studio backdrop or a softly blurred office reads best in a small circular crop.',
        },
        {
          title: 'Update your profile the same day',
          body: 'About an hour later we email the finished set at full resolution. Pick your favourite, upload it, and keep the rest for your CV and company page.',
        },
      ],
    },

    benefits: {
      eyebrow: 'Why it works on LinkedIn',
      title: 'Built for a small circular crop.',
      lede: 'A photo that looks fine at full size can fall apart at 200 pixels. These are the things that decide whether yours does.',
      benefits: [
        {
          icon: 'face',
          title: 'It still looks like you in person',
          body: 'A profile photo that flatters you into someone else is a problem the moment you turn up to the interview. We fine-tune a model on your own selfies, so the face on your profile is the face across the table.',
        },
        {
          icon: 'screen',
          title: 'Framed for the circle',
          body: 'LinkedIn crops your photo to a circle and shows it at a fraction of its size. Every shot is composed head and shoulders with headroom, so nothing important sits where the crop lands.',
        },
        {
          icon: 'price',
          title: 'One price, and enough shots to choose from',
          body: 'You are not picking between one take and nothing. Plans deliver 5, 25 or 60 headshots across the looks you chose, so you can test a couple on your profile and keep the rest.',
        },
        {
          icon: 'refund',
          title: 'No subscription to forget about',
          body: 'You pay once. No monthly plan, no credit balance, no upsell to unlock the good ones. If a run fails, the refund is issued automatically.',
        },
      ],
    },

    useCases: {
      eyebrow: 'Where else it goes',
      title: 'One set, every profile you keep.',
      lede: 'A LinkedIn photo is rarely the only place you need one. The same set covers the rest.',
      items: [
        {
          title: 'Your LinkedIn profile',
          body: 'The photo that decides whether a recruiter reads the rest of the page. Pick the cleanest shot in the set and put it where it counts.',
        },
        {
          title: 'CVs and applications',
          body: 'A current headshot on an application says you take the process seriously, without booking a studio for a single photo you needed by Friday.',
        },
        {
          title: 'Your company about page',
          body: 'Match the background everyone else on the team used and the page finally looks like one company rather than fifteen different rooms.',
        },
        {
          title: 'Conference and press bios',
          body: 'The request always arrives with a deadline and a resolution requirement attached. Keep a high-resolution headshot ready for the next one.',
        },
      ],
    },

    pricing: {
      eyebrow: 'Pricing',
      title: 'One payment. No subscription.',
      lede: 'Every plan trains a model on your own face and delivers at full resolution. What changes is how many headshots you get and how much of the catalogue you can pick from.',
      cta: 'Get my LinkedIn headshots',
    },

    faq: {
      eyebrow: 'FAQ',
      title: 'LinkedIn headshots, answered.',
      lede: 'What people ask before they replace the photo on their profile.',
      faqs: [
        {
          q: 'Will a recruiter be able to tell it is AI?',
          a: 'Not if your uploads are good. We train a model on your own face rather than pasting your features onto a stock body, which is what makes most AI headshots obvious. The giveaways are usually plastic skin and a face that is nobody in particular, and both come from thin input.',
        },
        {
          q: 'What background works best for LinkedIn?',
          a: 'A plain studio backdrop or a softly blurred office. LinkedIn shows your photo small and circular, so a busy background turns to noise. Save the outdoor and greenery looks for a personal site or a speaker bio where the photo runs larger.',
        },
        {
          q: 'How many photos do I need to upload?',
          a: 'Between five and fifteen, and ten to twelve is the sweet spot. Use recent photos from a few different angles, in even light, with nothing covering your eyes. We check each one as you add it and tell you which will not work before you pay.',
        },
        {
          q: 'Can I use the headshots anywhere else?',
          a: 'Yes. The set is yours to use on your CV, your company page, a conference bio, a press kit, or anywhere else you need a photo. Full resolution, no watermark, no usage limit.',
        },
        {
          q: 'What if they do not look like me?',
          a: 'Then you should not pay for them. Open your results and if they do not look like you, reply to your delivery email within 14 days and we refund your purchase in full. You keep the images either way.',
        },
      ],
    },

    cta: {
      eyebrow: 'Ready when you are',
      title: 'Your new profile photo, in about an hour.',
      lede: 'Upload your selfies, pick your look, pay once. We handle the rest.',
      button: 'Get my LinkedIn headshots',
    },
  },
};
