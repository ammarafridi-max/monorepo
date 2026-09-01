/**
 * Template for de-duplicating the Schengen country pages.
 *
 * france-visa shared three FAQ answers verbatim with schengen (country name
 * swapped) and inherited everything else, so the two pages competed for the
 * same queries while saying the same thing. This writes the France overlay
 * with what is actually specific to a France application from the UAE.
 *
 * Facts checked 2026-09-01 against france-visas.gouv.fr and VFS Global:
 *   - France-Visas (france-visas.gouv.fr) is a mandatory first step. The
 *     reference number it issues is required to book at VFS.
 *   - The Consulate General in Dubai has had no visa section since 2019.
 *     Applications are decided by the consular section in Abu Dhabi, though
 *     documents can be submitted at either VFS centre.
 *   - Short-stay consular fee is EUR 90 for adults.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/differentiate-france-page.mjs          # dry run
 *   node --env-file=.env.production scripts/differentiate-france-page.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const OVERLAY = {
  heroHeadline: 'France Visa from the UAE, Filed Through France-Visas',
  heroSubheadline:
    'France runs its own application portal before VFS will take your file, and your application is decided in Abu Dhabi rather than Dubai. We handle the portal, the reference number and the appointment, and tell you which centre to attend.',

  metaTitle: 'France Visa from UAE | France-Visas Portal and VFS Booking',
  metaDescription:
    'Apply for a France Schengen visa from the UAE. We complete the France-Visas portal, book your VFS appointment and prepare the file. Packages from AED 299.',

  excerpt:
    'France visa assistance for UAE residents. We handle the France-Visas portal, the VFS appointment and the full document file.',

  processSteps: [
    {
      title: 'We register you on France-Visas',
      description:
        'France will not let VFS take your file without a France-Visas reference number. We complete the portal and generate it for you.',
      icon: 'Globe',
    },
    {
      title: 'We build the document file',
      description:
        'Cover letter, financial evidence, flight reservation, hotel booking, insurance and itinerary, assembled in the order the consulate reads them.',
      icon: 'FileText',
    },
    {
      title: 'We book your VFS appointment',
      description:
        'Dubai or Abu Dhabi, whichever has slots first. France appointments in Dubai book out quickly in spring and summer.',
      icon: 'CalendarCheck',
    },
    {
      title: 'You attend and give biometrics',
      description:
        'You hand over the file and give fingerprints. First-time Schengen applicants only, and they last 59 months.',
      icon: 'Fingerprint',
    },
    {
      title: 'Abu Dhabi decides, we track it',
      description:
        'The consular section in Abu Dhabi makes the decision, not the Dubai consulate. We follow the file until your passport is back at VFS.',
      icon: 'Send',
    },
  ],

  requirementSections: [
    {
      title: 'What France Asks For Specifically',
      intro:
        'These are the France requirements that catch out applicants who prepared for a generic Schengen file.',
      items: [
        'A France-Visas reference number, generated on france-visas.gouv.fr before any appointment can be booked',
        'The France-Visas checklist printed and signed, which is generated for your specific trip',
        'Passport valid for at least three months beyond the date you leave the Schengen Area',
        'Proof that France is your main destination, meaning the most nights, or your first point of entry if the nights are equal',
        'Travel insurance covering EUR 30,000 in medical expenses across all 29 Schengen states',
      ],
    },
  ],

  faqs: [
    {
      question: 'Do I have to use the France-Visas portal?',
      answer:
        'Yes. France-Visas is the official portal and it is not optional. It issues the reference number VFS asks for at the counter, and it generates a checklist specific to your trip. An application without that reference number cannot be booked, which is the single most common reason a France application stalls before it starts.',
    },
    {
      question: 'Is my France visa decided in Dubai or Abu Dhabi?',
      answer:
        'Abu Dhabi. The Consulate General in Dubai has had no visa section since 2019, so every France visa for UAE residents is decided by the consular section in Abu Dhabi. You can still submit your documents at the VFS centre in Dubai. Where you submit does not change who decides.',
    },
    {
      question: 'How long does a France visa take from the UAE?',
      answer:
        'France is one of the quicker Schengen consulates, typically deciding in 5 to 10 working days once your file reaches Abu Dhabi. That stretches sharply from June to August and over Christmas and New Year, when it can run to 30 days or more. Apply at least a month before you travel.',
    },
    {
      question: 'Why is a France appointment so hard to get in Dubai?',
      answer:
        'France is one of the most requested Schengen consulates in the UAE and VFS releases slots in batches rather than continuously. Dubai fills first. We watch both Dubai and Abu Dhabi and book whichever opens first, which often saves two to three weeks in spring and summer.',
    },
    {
      question: 'Can I visit other countries on a France visa?',
      answer:
        'Yes. A standard Schengen visa issued by France lets you move freely across all 29 Schengen states while it is valid. You must apply through France if it is your main destination, meaning where you spend the most nights, or your first point of entry when the nights are equal.',
    },
    {
      question: 'Will the France consulate accept a flight reservation?',
      answer:
        'Yes. France accepts a flight reservation rather than a paid ticket, as long as it carries a real booking reference the consulate can verify with the airline. Your package includes the flight reservation, so we book it in the format the consulate expects and hand it over ready to submit.',
    },
    {
      question: 'I was refused a France visa before. Can you still help?',
      answer:
        'Yes, and it is a large part of what we do. We start from the refusal notice, identify which of the stated grounds actually applies, and rebuild the file to answer it directly. Reapplying with the same file and hoping for a different officer is the most common mistake we see.',
    },
    {
      question: 'What happens if my France visa is refused after I have paid you?',
      answer:
        'The consular and VFS fees are non-refundable for everyone, through any provider, because the consulate sets that rule. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal and the specific changes to make before reapplying.',
    },
  ],

  visaCentre: {
    name: 'VFS Global France',
    city: 'Dubai',
    note: 'Abu Dhabi often has earlier slots. Your application is decided in Abu Dhabi either way.',
  },

  processingTime: '5 – 10 working days',
};

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const overlays = conn.db.collection('visa-overlays');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
const before = await overlays.findOne({ residence: 'AE', visaSlug: 'france-visa' });
if (!before) throw new Error('France AE overlay not found');

console.log(`  FAQs      ${before.faqs?.length ?? 0} -> ${OVERLAY.faqs.length}`);
console.log(`  steps     ${before.processSteps?.length ?? 'inherit'} -> ${OVERLAY.processSteps.length}`);
console.log(`  req.sect. ${before.requirementSections?.length ?? 'inherit'} -> ${OVERLAY.requirementSections.length}`);
console.log(`  metaTitle "${before.metaTitle}" -> "${OVERLAY.metaTitle}" (${OVERLAY.metaTitle.length} chars)`);
console.log(`  metaDesc  ${OVERLAY.metaDescription.length} chars`);

if (APPLY) {
  await overlays.updateOne({ residence: 'AE', visaSlug: 'france-visa' }, { $set: OVERLAY });
  console.log('\n  written');
}

const schengen = await overlays.findOne({ residence: 'AE', visaSlug: 'schengen' });
const norm = (t) => String(t).replace(/france|schengen/gi, 'X').toLowerCase();
const after = APPLY ? await overlays.findOne({ residence: 'AE', visaSlug: 'france-visa' }) : { faqs: OVERLAY.faqs };
const dupes = (after.faqs || []).filter((f) => (schengen.faqs || []).some((s) => norm(s.answer) === norm(f.answer)));
console.log(`\n  FAQ answers still identical to schengen: ${dupes.length}`);
for (const d of dupes) console.log(`    ${d.question}`);

await mongoose.disconnect();
