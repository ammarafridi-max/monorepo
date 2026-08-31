/**
 * Creates the Saudi Arabia visa landing page and its UAE overlay.
 *
 * One package only: the tourist eVisa for GCC residents, AED 700. Note that
 * GCC *citizens* need no visa at all — this page sells to expatriates holding a
 * GCC residence permit, which is a different audience and the copy says so.
 *
 * Facts checked 2026-08-31:
 *   Fragomen, "Saudi Arabia: E-Visa Eligibility Expanded to GCC Residents of
 *     All Professions" — all GCC residents eligible regardless of profession
 *     since March 2023; residence permit valid 3+ months, passport 6+ months;
 *     fee SAR 300; health insurance required before issue.
 *   Visit Saudi (visa.visitsaudi.com) — one year, multiple entry, up to 90 days
 *     total stay; tourism, family visits, events and Umrah outside Hajj season.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/seed-saudi-visa.mjs             # dry run
 *   node --env-file=.env.production scripts/seed-saudi-visa.mjs --apply     # write, as draft
 *   node --env-file=.env.production scripts/seed-saudi-visa.mjs --apply --publish
 *   node --env-file=.env.production scripts/seed-saudi-visa.mjs --apply --overwrite
 */

import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';
import VisaOverlaySchema from '@travel-suite/visa/overlay-schema';

const APPLY = process.argv.includes('--apply');
const PUBLISH = process.argv.includes('--publish');
const OVERWRITE = process.argv.includes('--overwrite');

const SLUG = 'saudi-arabia';

const VISA = {
  countryName: 'Saudi Arabia',
  slug: SLUG,
  status: PUBLISH ? 'published' : 'draft',

  excerpt:
    'A one year, multiple entry Saudi tourist eVisa for GCC residents. No embassy visit and no biometrics. We check that you qualify before you pay anything.',

  heroHeadline: 'Saudi Tourist Visa for GCC Residents',
  heroSubheadline:
    'If you hold a GCC residence permit, you can visit Saudi Arabia on a one year, multiple entry tourist eVisa. There is no embassy appointment and no biometrics to give. We confirm you qualify, file the application, and fix it if it comes back rejected.',
  heroCtaText: 'Check if you qualify',

  qualifierItems: [
    'You live in a GCC country on a residence permit and want to visit Saudi Arabia for tourism.',
    'You want to perform Umrah outside the Hajj season and need the right visa for it.',
    'You are visiting family or friends in Saudi Arabia, or travelling for an event or a concert.',
    'Your residence permit or passport is close to expiry and you are not sure whether you still qualify.',
    'You applied yourself, it was rejected, and nobody told you what was actually wrong.',
    'You would rather someone checked the photo, the details and the insurance before you pay a non refundable fee.',
  ],

  packages: [
    {
      name: 'Tourist Visa for GCC Residents',
      price: 700,
      currency: 'AED',
      timeline: '1 – 3 business days',
      description:
        'A one year, multiple entry Saudi tourist eVisa, applied for and tracked on your behalf. Everything happens online, so there is no appointment to attend.',
      features: [
        'Eligibility check against your residence permit and passport validity',
        'Application completed and submitted on your behalf',
        'Photo and passport scan checked against Saudi specifications before submission',
        'Mandatory medical insurance added correctly during the application',
        'Application tracked daily until the visa is issued',
        'Free resubmission if the application is rejected on document grounds',
      ],
      exclusions: [
        'Saudi eVisa fee and mandatory insurance (approx. AED 295) not included',
        'Hajj, work, study and residence visas are not covered',
      ],
      icon: 'FileText',
      isHighlighted: true,
    },
  ],

  processSteps: [
    {
      title: 'Send us your documents',
      description:
        'A passport copy, your GCC residence permit and a recent photo. That is enough for us to start.',
      icon: 'FileText',
    },
    {
      title: 'We confirm you qualify',
      description:
        'We check your residence permit has at least three months left and your passport at least six. That is where most rejections start.',
      icon: 'ShieldCheck',
    },
    {
      title: 'We complete the application',
      description:
        'We fill in the official application, upload your photo to the right specification and add the mandatory medical insurance.',
      icon: 'ClipboardCheck',
    },
    {
      title: 'You pay the Saudi fee',
      description:
        'The government fee and insurance are paid on the official portal. We tell you the exact amount before anything is submitted.',
      icon: 'CreditCard',
    },
    {
      title: 'We submit and track it',
      description:
        'Most eVisas are approved within one to three business days. We watch yours so you are not refreshing the portal.',
      icon: 'Send',
    },
    {
      title: 'Your visa arrives by email',
      description:
        'Print it or keep it on your phone. Carry your passport, your residence permit and the visa when you travel.',
      icon: 'Mail',
    },
  ],

  requirementSections: [
    {
      title: 'Documents We Need From You',
      intro: 'All of it is digital. Nothing needs to be posted or handed over in person.',
      items: [
        'Passport copy, valid for at least six months from the date you enter Saudi Arabia',
        'Your GCC residence permit, with at least three months of validity remaining',
        'A recent colour photograph against a plain white background, face clearly visible',
        'Your email address and mobile number',
        'Your approximate travel dates',
      ],
    },
    {
      title: 'Who Can Apply',
      intro: 'The tourist eVisa is open to GCC residents of any nationality.',
      items: [
        'Anyone holding a valid residence permit from the UAE, Bahrain, Kuwait, Oman, Qatar or Saudi Arabia',
        'Any profession. The old restriction to certain job categories was removed in March 2023',
        'First degree relatives, meaning parents, spouse and children, and domestic workers of a GCC sponsor',
        'Children need their own application, and under 18s must travel with a guardian',
        'GCC citizens do not need this visa, or any visa, to enter Saudi Arabia',
      ],
    },
    {
      title: 'What the Visa Covers',
      intro: 'It is a tourist visa, and Saudi Arabia is specific about what that includes.',
      items: [
        'Tourism and leisure travel',
        'Visiting family and friends',
        'Attending events, conferences and concerts',
        'Umrah, outside the Hajj season',
        'It does not cover Hajj, paid work, study or residence, which each need their own visa',
      ],
    },
    {
      title: 'What Usually Gets Applications Rejected',
      intro: 'Almost every rejection we see is one of these, and all of them are avoidable.',
      items: [
        'A residence permit with less than three months left to run',
        'A passport with less than six months of validity',
        'A photo that does not meet the specification, usually the background or the crop',
        'Names that do not match between the passport and the residence permit',
        'The mandatory medical insurance not being taken during the application',
      ],
    },
  ],

  pricingBreakdown: [
    {
      item: 'VisaWadi service fee',
      amount: 700,
      currency: 'AED',
      paidTo: 'VisaWadi',
      note: 'Covers the eligibility check, the application, and a free resubmission if it is rejected on document grounds.',
    },
    {
      item: 'Saudi eVisa fee and insurance',
      amount: 295,
      currency: 'AED',
      paidTo: 'Saudi Government',
      note: 'SAR 300 on the official portal, roughly AED 295. The exact total depends on the exchange rate and the insurance quoted on the day, and it is not refundable if the application is refused.',
    },
  ],

  whyUs: [
    {
      title: 'No embassy, no appointment',
      description:
        'The Saudi tourist visa is issued electronically. There is nothing to attend, no biometrics to give and no visa centre queue. The whole thing happens online.',
      icon: 'Laptop',
    },
    {
      title: 'We check before you pay',
      description:
        'Residence permit and passport validity sink most applications. We check both first, so you are not paying a non refundable fee to be told no.',
      icon: 'ShieldCheck',
    },
    {
      title: 'One year, multiple entry',
      description:
        'You are not applying for a single trip. The visa stays valid for a year, so your next visit to Saudi Arabia costs you nothing.',
      icon: 'CalendarCheck',
    },
    {
      title: 'Rejected applications fixed',
      description:
        'If your application is refused on document grounds, we correct it and reapply without charging our fee a second time.',
      icon: 'RefreshCw',
    },
    {
      title: 'Umrah is included',
      description:
        'The tourist visa covers Umrah outside the Hajj season, so there is no separate religious visa to arrange for it.',
      icon: 'Compass',
    },
    {
      title: 'Straight answers',
      description:
        'Ask a specialist before you commit. If your trip does not need us, we will tell you that instead of selling you a package.',
      icon: 'MessageCircle',
    },
  ],

  testimonials: [],

  faqs: [
    {
      question: 'Do GCC residents need a visa for Saudi Arabia?',
      answer:
        'Yes, if you are an expatriate resident. GCC citizens, meaning nationals of the UAE, Bahrain, Kuwait, Oman and Qatar, do not need a visa at all. If you live in a GCC country on a residence permit but hold another nationality, you do need one, and the tourist eVisa is the route open to you. It is one year, multiple entry, and applied for entirely online.',
    },
    {
      question: 'How much does the Saudi tourist visa cost for GCC residents?',
      answer:
        'The Saudi government charges SAR 300, around AED 295, which covers the visa and the mandatory medical insurance and is paid on the official portal. VisaWadi charges AED 700 to check your eligibility, complete and submit the application, and resubmit free of charge if it is refused on document grounds. Budget roughly AED 995 per applicant in total.',
    },
    {
      question: 'How long does the Saudi eVisa take?',
      answer:
        'Most applications are approved within one to three business days, and plenty come back the same day. Applications submitted over the Saudi weekend, which is Friday and Saturday, or during a public holiday can take longer. We track yours and tell you the moment it is issued, so you are not sitting there refreshing the portal yourself.',
    },
    {
      question: 'How long can I stay in Saudi Arabia on the tourist visa?',
      answer:
        'The visa is valid for one year from the date it is issued and lets you enter as many times as you like. The permitted stay is up to 90 days in total across that year, rather than 90 days on every trip. Always check the dates printed on your visa, because immigration goes by what is on the document.',
    },
    {
      question: 'Does my profession affect whether I can apply?',
      answer:
        'No. Saudi Arabia removed the profession restriction in March 2023, so GCC residents can apply whatever their job title says on the residence permit. Before that only certain professional categories qualified, which is why a lot of older guidance online still tells people they are ineligible. What matters now is the validity of your permit and your passport.',
    },
    {
      question: 'Can I perform Umrah on this visa?',
      answer:
        'Yes, outside the Hajj season. The Saudi tourist visa allows Umrah, so there is no separate religious visa to arrange. Hajj is different and needs its own permit through the official Hajj channels. If you are planning Umrah, tell us your dates early, because availability around Ramadan gets booked up well in advance.',
    },
    {
      question: 'What happens if my application is rejected?',
      answer:
        'Refusals are almost always about documents: a residence permit with under three months left, a passport under six months, or a photo that does not meet the specification. We check all of those before submitting. If it is still refused on document grounds we correct it and reapply at no extra service fee. The government fee is not refundable.',
    },
    {
      question: 'How soon before travelling should I apply?',
      answer:
        'Apply at least two weeks before you fly. The visa itself is usually quick, but that leaves room if your residence permit needs renewing first, or if the application has to be corrected and resubmitted. If you are travelling sooner than that, message us and we will tell you honestly whether it is achievable.',
    },
  ],

  finalCtaHeadline: 'Ready to sort your Saudi visa?',
  finalCtaText:
    'Send us your passport and residence permit copies. We will confirm whether you qualify before you pay anything.',

  metaTitle: 'Saudi Tourist Visa for GCC Residents | VisaWadi',
  metaDescription:
    'Saudi tourist eVisa for GCC residents. One year, multiple entry, no embassy visit. VisaWadi checks your eligibility and files it for you, AED 700.',
};

/** Only what actually differs for a UAE resident. Everything else inherits. */
const OVERLAY = {
  residence: 'AE',
  residenceName: 'United Arab Emirates',
  residenceSlug: 'uae',
  visaSlug: SLUG,

  metaTitle: 'Saudi Visa for UAE Residents | Tourist eVisa from Dubai',
  metaDescription:
    'Apply for the Saudi tourist eVisa from the UAE. One year, multiple entry, no embassy appointment. We check your Emirates ID and passport, then file it for you.',

  heroHeadline: 'Saudi Tourist Visa for UAE Residents',
  heroSubheadline:
    'If you hold a UAE residence visa, you can visit Saudi Arabia on a one year, multiple entry eVisa. There is no embassy, no appointment in Dubai and no biometrics. We confirm you qualify and file it for you.',
  excerpt:
    'Saudi tourist eVisa for UAE residents. One year, multiple entry, filed online from Dubai. We check your Emirates ID and passport first.',

  processingTime: '1 – 3 business days',

  requirementSections: [
    {
      title: 'Documents We Need From You',
      intro: 'All of it is digital, so nothing needs to be posted or dropped off anywhere in Dubai.',
      items: [
        'Passport copy, valid for at least six months from the date you enter Saudi Arabia',
        'Your UAE residence visa page, with at least three months of validity remaining',
        'A copy of your Emirates ID, front and back',
        'A recent colour photograph against a plain white background, face clearly visible',
        'Your email address and UAE mobile number',
        'Your approximate travel dates',
      ],
    },
  ],

  isPublished: PUBLISH,
};

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Run with --env-file=.env.production');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}

const Visa = conn.model('Visa', VisaSchema);
const VisaOverlay = conn.model('visa-overlay', VisaOverlaySchema);

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
console.log(`  status: ${VISA.status}, overlay published: ${OVERLAY.isPublished}\n`);

const existingVisa = await Visa.findOne({ slug: SLUG });
const existingOverlay = await VisaOverlay.findOne({ residence: 'AE', visaSlug: SLUG });

if ((existingVisa || existingOverlay) && !OVERWRITE) {
  console.log('  Already exists. Pass --overwrite to replace it.');
  console.log(`    base:    ${existingVisa ? existingVisa.status : 'absent'}`);
  console.log(`    overlay: ${existingOverlay ? `isPublished=${existingOverlay.isPublished}` : 'absent'}`);
  await mongoose.disconnect();
  process.exit(0);
}

for (const [label, Model, data] of [['base', Visa, VISA], ['overlay', VisaOverlay, OVERLAY]]) {
  const err = new Model(data).validateSync();
  if (err) {
    console.error(`  ${label} failed validation:`);
    for (const e of Object.values(err.errors)) console.error(`    ${e.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
}

console.log(`  base ${existingVisa ? 'replace' : 'create'}: ${SLUG}`);
console.log(`    ${VISA.packages.length} package, ${VISA.processSteps.length} steps, ${VISA.requirementSections.length} requirement sections, ${VISA.faqs.length} FAQs`);
console.log(`    ${VISA.packages[0].name} — ${VISA.packages[0].currency} ${VISA.packages[0].price}`);
console.log(`  overlay ${existingOverlay ? 'replace' : 'create'}: AE / ${SLUG}`);
console.log(`\n  URL: https://www.visawadi.com/uae/visa/${SLUG}`);

if (!APPLY) {
  console.log('\n  Nothing written.');
  await mongoose.disconnect();
  process.exit(0);
}

const doc = { ...VISA, ...(VISA.status === 'published' ? { publishedAt: new Date() } : {}) };
await Visa.findOneAndUpdate({ slug: SLUG }, doc, { upsert: true, runValidators: true, returnDocument: 'after', setDefaultsOnInsert: true });
await VisaOverlay.findOneAndUpdate({ residence: 'AE', visaSlug: SLUG }, OVERLAY, { upsert: true, runValidators: true, returnDocument: 'after', setDefaultsOnInsert: true });

console.log('\n  Written.');
await mongoose.disconnect();
