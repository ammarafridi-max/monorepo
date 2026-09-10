/**
 * Landing copy that is repeated or likely to change, kept here so content can be
 * edited without touching layout. Every claim below has to stay true to what the
 * product actually does: the upload gate, the per-customer trained model, the
 * one-time Stripe charge, and the automatic refund on a failed run are all real.
 */

// PROCESS. Three steps, in order. No "meta" labels: the step body carries it.
export const steps = [
  {
    title: 'Upload your selfies',
    body: 'Add five to fifteen recent photos of your face, from a few different angles. We check each one as you add it and flag anything that will not work, so you find out before you pay.',
  },
  {
    title: 'We train a model on your face',
    body: 'Your photos train a model on your face alone, so the results are you and not a stock lookalike. You pick the backgrounds and the outfits, and we build the set around them.',
  },
  {
    title: 'Get your headshots by email',
    body: 'About an hour later we email you a link to the finished set, at full resolution and ready to use: LinkedIn, a CV, your company page, a conference bio.',
  },
];

// BENEFITS. Why us rather than the other AI headshot tools. Each one is a real
// difference in how the product is built, not a slogan. `icon` names one of the
// glyphs in sections/Benefits.js; the mapping lives there so the copy file stays
// free of component imports.
export const benefits = [
  {
    title: 'We check your photos before you pay',
    icon: 'screen',
    body: 'Most tools take your money first and let you find the problem in the results. We screen every photo as you upload it and say which ones will fail, so nobody pays for input we already know is bad.',
  },
  {
    title: 'A model trained on your face, not a filter',
    icon: 'face',
    body: 'A face swap pastes your features onto a stock body and it shows. We fine-tune a model on your own photos, so the whole image is built around your face. That is why the results hold up next to a real photo of you.',
  },
  {
    title: 'One price, no subscription, no credits',
    icon: 'price',
    body: 'You pay once and you are done. No monthly plan to cancel, no credit balance to top up, no upsell to unlock the good shots. Full resolution, no watermark, yours to use anywhere.',
  },
  {
    title: 'If a run fails, you are refunded automatically',
    icon: 'refund',
    body: 'Generation runs on hardware we do not own, and now and then a run fails. The refund is issued by the system itself, not after you chase us. And if the set does not look like you, we refund you in full.',
  },
];

// WHO IT IS FOR. Concrete situations that map to real search intent, each one
// specific enough that a visitor recognises themselves in it.
export const useCases = [
  {
    title: 'LinkedIn profiles',
    body: 'Your profile photo is the first thing a recruiter or a client sees. Get one that looks like the person your CV describes.',
  },
  {
    title: 'Resumes and CVs',
    body: 'A sharp, current headshot says you take the process seriously. Look the part before the interview, without booking a studio for one photo.',
  },
  {
    title: 'Company and team pages',
    body: 'Nothing dates an about page like fifteen headshots taken in fifteen rooms. Same backgrounds, same light, and the team finally looks like one company.',
  },
  {
    title: 'Consultants and freelancers',
    body: 'When you are the product, how you present yourself is part of the pitch. Turn up to every proposal looking like someone who charges what you charge.',
  },
  {
    title: 'Real estate agents',
    body: 'Buyers choose an agent they trust, and they start with your face on a listing. Get the warm, credible headshot the job asks for.',
  },
  {
    title: 'Founders and speakers',
    body: 'Press kits, panel bios and podcast covers all want a photo, usually at short notice. Keep a set in your inbox instead of hunting for one.',
  },
  {
    title: 'Remote and distributed teams',
    body: 'You cannot fly twelve people to one studio for an afternoon. Everyone uploads their own selfies and the sets come back to a single standard.',
  },
  {
    title: 'Conference and press bios',
    body: 'The request always arrives with a deadline and a resolution requirement attached. Have a current, high-resolution headshot ready for the next one.',
  },
];

// TESTIMONIALS.
//
// ⚠️ PLACEHOLDER CONTENT. These people are invented and so are their ratings. They
// exist so the section can be designed and reviewed, and they MUST be replaced with
// real, attributable customer quotes before this page goes live: presenting invented
// reviews and star ratings as genuine is deceptive to buyers and is regulated in
// most markets.
export const testimonials = [
  {
    quote:
      'I put the new photo on LinkedIn on a Tuesday and had three people ask which studio I used. It was fifteen selfies and nine dollars.',
    rating: 5,
    name: 'Dana Whitfield',
    role: 'Product Manager',
  },
  {
    quote:
      'We put the whole team through it before relaunching our about page. Twelve people, four countries, and for the first time the page looks like one company.',
    rating: 5,
    name: 'Marcus Oyelaran',
    role: 'Co-founder, remote agency',
  },
  {
    quote:
      'I was sure it would give me that plastic AI face. It did not. My beard is my beard and the photos still look like me on a good day.',
    rating: 5,
    name: 'Tomas Reinholt',
    role: 'Freelance consultant',
  },
];

// PLAN COMPARISON. The verdict line and the one real limit of each tier. What the
// plan INCLUDES is not written here: Pricing.js builds that checklist straight from
// the tier data, so the counts on the card can never disagree with what is sold.
// Keyed by the tier ids in @travel-suite/picturesk-shared/pricing.
export const planNotes = {
  starter: {
    best: 'Best for one profile photo you need today.',
    cons: ['One outfit means one look across the whole set'],
  },
  pro: {
    best: 'Best for most people, and for anyone who wants a choice.',
    cons: ['Not every outfit in the catalogue is unlocked'],
  },
  premium: {
    best: 'Best for teams, and for anyone who wants the full catalogue.',
    cons: ['More photos than one person usually needs'],
  },
};

export const included = [
  '5 to 60 headshots, depending on your plan',
  'High-resolution square JPGs, 1:1',
  'A model trained on your own face',
  'Delivered by email in about an hour',
  'Automatic refund if a run fails',
  'Yours to use anywhere',
];
