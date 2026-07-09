/**
 * FAQ content. Single source of truth for the FAQ section, structured for direct,
 * verdict-first answers (good for people and for AI citation). Every answer is
 * truthful to how the system actually works: the refund maps to a failed run, not
 * to taste, and we do not claim to auto-delete photos.
 */
export const faq = [
  {
    q: 'Do the headshots actually look like me?',
    a: 'Yes, when your photos are good. We train a model on your own face from the selfies you upload, so the results are you, not a generic lookalike. The biggest factor is your input: clear, recent, well lit photos from a few angles give the strongest likeness.',
  },
  {
    q: 'How many photos do I need?',
    a: 'Five to fifteen photos of one person, with one clear face in each. Use different angles and good light, and skip sunglasses and hats. We check every photo as you add it and flag anything that will hurt the result before you pay.',
  },
  {
    q: 'How long does it take?',
    a: 'About an hour. After you pay, we train a model on your face and then generate your headshots. When they are ready we email you a link to download them. There is nothing to keep open or watch.',
  },
  {
    q: 'What if a run does not work?',
    a: 'If the system cannot deliver your headshots, your payment is refunded automatically, no email needed. Because results depend heavily on your input photos, we check them up front and tell you how to get the best output. If you are unhappy with a delivered set, email us and we will help.',
  },
  {
    q: 'What happens to my photos?',
    a: 'Your photos go to private storage and are used only to train your model and generate your headshots. They are not sold, and they are never used to train any shared model. You can email us to have them removed.',
  },
  {
    q: 'Can I use the headshots anywhere?',
    a: 'Yes. The headshots are yours. Put them on LinkedIn, a resume, a company page, a speaker bio, anywhere you need a professional photo.',
  },
  {
    q: 'Is this a subscription?',
    a: 'No. One payment of thirty-five dollars for one set of headshots. No plan, no recurring charge, and no account required to buy.',
  },
];
