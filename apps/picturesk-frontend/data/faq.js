export const faq = [
  {
    q: 'Do the headshots actually look like me?',
    group: 'Results and likeness',
    home: true,
    a: 'Yes, when your photos are good. We train a model on your own face from the selfies you upload, so the results are you, not a generic lookalike. The biggest factor is your input: clear, recent, well lit photos from a few angles give the strongest likeness.',
  },
  {
    q: 'What if the headshots don\'t look like me?',
    group: 'Results and likeness',
    home: true,
    a: 'Then you shouldn\'t pay for them. If you open your results and they don\'t look like you, just reply to your delivery email or write to info@picturesk.ai within 3 days, and we\'ll refund your full purchase. You keep the images either way. We\'re a new studio earning your trust, so the risk is on us, not you.',
  },
  {
    q: 'How many photos do I need?',
    group: 'Your photos',
    home: true,
    a: 'Five to fifteen photos of one person, with one clear face in each. Use different angles and good light, and skip sunglasses and hats. We check every photo as you add it and flag anything that will hurt the result before you pay.',
  },
  {
    q: 'How long does it take?',
    group: 'Delivery and use',
    home: true,
    a: 'About an hour. After you pay, we train a model on your face and then generate your headshots. When they are ready we email you a link to download them. There is nothing to keep open or watch.',
  },
  {
    q: 'What if a run does not work?',
    group: 'Plans, payment and refunds',
    a: 'If the system cannot deliver your headshots, your payment is refunded automatically, no email needed. Because results depend heavily on your input photos, we check them up front and tell you how to get the best output. If you are unhappy with a delivered set, email us and we will help.',
  },
  {
    q: 'What happens to my photos?',
    group: 'Your photos',
    home: true,
    a: 'Your photos go to private storage and are used only to train your model and generate your headshots. They are not sold, and they are never used to train any shared model. We keep your trained model for 12 months so you can order another set without uploading again. Email us at any time and we will remove your photos, your results and your model.',
  },
  {
    q: 'Can I use the headshots anywhere?',
    group: 'Delivery and use',
    home: true,
    a: 'Yes. The headshots are yours. Put them on LinkedIn, a resume, a company page, a speaker bio, anywhere you need a professional photo.',
  },
  {
    q: 'Is this a subscription?',
    group: 'Plans, payment and refunds',
    a: 'No. You pick a plan and pay once, from nine dollars for a set of headshots. No recurring charge. You do create a free account: it keeps the model we train on your face so later sets need no new upload, and it gives you one free set to try first.',
  },
  {
    q: 'Are these good for LinkedIn?',
    group: 'Delivery and use',
    a: 'Yes, that is what most people use them for. You get clean, professional headshots framed for a profile photo, so you can update LinkedIn, a company page, or a resume the same day.',
  },
  {
    q: 'Do I need a professional camera?',
    group: 'Your photos',
    a: 'No. Clear phone selfies are exactly what we train on. Good light and a few different angles matter far more than the camera. If a photo will hurt the result, we flag it as you add it.',
  },
  {
    q: 'How is this different from a filter or Photoshop?',
    group: 'Results and likeness',
    a: 'A filter edits one photo. We train a model on your actual face and generate new photographs of you, in outfits and settings you never shot. The results keep your real features, not a smoothed-over version of a single selfie.',
  },
  {
    q: 'Which backgrounds and outfits can I choose?',
    group: 'Your photos',
    a: 'You pick from a range of backgrounds (studio, office, outdoor, and more) and outfits (business suit, business casual, and others), and we spread your set across the ones you choose. More looks mean more variety in what you get back.',
  },
  {
    q: 'Does it work for everyone?',
    group: 'Results and likeness',
    a: 'Yes. Because we train on your own photos, it works across ages, genders, and skin tones. You also tell us a few details up front, like gender and age range, so the results match you more closely.',
  },
  {
    q: 'What resolution are the headshots?',
    group: 'Delivery and use',
    a: 'Sharp, high-resolution square images, ready for LinkedIn, resumes, company pages, and most web profiles. Download them one at a time or grab the whole set as a single zip.',
  },
  {
    q: 'Is my payment secure?',
    group: 'Plans, payment and refunds',
    a: 'Yes. Payment runs through Stripe, so we never see or store your card details. You pay once, with no subscription and no hidden charges.',
  },
];

export const homeFaq = faq.filter((item) => item.home);

export const FAQ_GROUPS = ['Results and likeness', 'Your photos', 'Plans, payment and refunds', 'Delivery and use'];

export const groupedFaq = FAQ_GROUPS.map((label) => ({
  label,
  items: faq.filter((item) => item.group === label),
}));
