/**
 * Differentiates Germany, Italy, Spain and Greece from each other and from the
 * Schengen page, following the France template.
 *
 * These five pages were generated from one template with the country name
 * swapped, so they carried identical FAQ answers, identical process steps and
 * identical requirements. Each now leads on what actually differs: the form,
 * the centre, who decides, and the rule that catches applicants out.
 *
 * Facts checked 2026-09-01 against the missions and their visa centres:
 *   DE  VIDEX (videx.diplo.de) is the application form. The German Consulate
 *       General in Dubai decides every UAE application. Emirate of residence
 *       fixes the centre: Dubai and the Northern Emirates submit in Dubai,
 *       Abu Dhabi and Al Ain in Abu Dhabi. No applying more than 180 days out.
 *   IT  VFS Italy. Fees are paid at the counter on the day, not online.
 *       Biometrics are held in the VIS for five years. No submitting earlier
 *       than six months before travel.
 *   ES  BLS International, not VFS. Applicants need their own BLS account and
 *       the Annex A form, and fees are paid online at booking. Indian
 *       nationals face extra residency and employment evidence.
 *   GR  VFS Greece at Wafi Mall, submissions 09:00-15:00. Emirate on the
 *       Emirates ID fixes the centre. Insurance must cover all 29 states.
 *
 * Consular fee amounts are deliberately absent from this copy: the
 * pricingBreakdown still quotes EUR 80 when the current fee is EUR 90, and
 * repeating a figure that is under review would only spread the error.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/differentiate-schengen-country-pages.mjs          # dry run
 *   node --env-file=.env.production scripts/differentiate-schengen-country-pages.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const PAGES = {
  'germany-visa': {
    heroHeadline: 'Germany Visa from the UAE, Decided in Dubai',
    heroSubheadline:
      'Germany runs its own application form, VIDEX, and your emirate of residence decides which centre you must use. We complete the form, book the right centre and prepare the file the consulate expects.',
    metaTitle: 'Germany Visa from UAE | VIDEX Form and VFS Booking',
    metaDescription:
      'Apply for a Germany Schengen visa from the UAE. We complete the VIDEX form, book the correct VFS centre for your emirate and prepare the file. From AED 299.',
    excerpt:
      'Germany visa assistance for UAE residents. We handle the VIDEX form, the right VFS centre for your emirate, and the full document file.',
    processingTime: 'Up to 15 days',
    visaCentre: {
      name: 'VFS Global Germany',
      city: 'Dubai',
      note: 'Your emirate decides the centre. Dubai and the Northern Emirates submit here, Abu Dhabi and Al Ain in Abu Dhabi.',
    },
    processSteps: [
      { title: 'We complete your VIDEX form', description: 'Germany uses its own online form at videx.diplo.de rather than the generic Schengen one. We fill it and print the signed copy VFS asks for.', icon: 'FileText' },
      { title: 'We check your timing', description: 'Germany will not accept an application more than 180 days before you travel. We confirm your dates fall inside that window before booking.', icon: 'CalendarCheck' },
      { title: 'We book the right centre', description: 'Dubai and the Northern Emirates submit in Dubai, Abu Dhabi and Al Ain in Abu Dhabi. Turning up at the wrong one costs you the appointment.', icon: 'MapPin' },
      { title: 'We build the document file', description: 'Cover letter, financial evidence, flight reservation, hotel booking, insurance and itinerary, in the order the consulate reads them.', icon: 'ClipboardCheck' },
      { title: 'You attend and give biometrics', description: 'You hand over the file and give fingerprints. First-time Schengen applicants only.', icon: 'Fingerprint' },
      { title: 'Dubai decides, we track it', description: 'Every UAE application is decided by the German Consulate General in Dubai, wherever you submitted. We follow it to the decision.', icon: 'Send' },
    ],
    requirementSections: [{
      title: 'What Germany Asks For Specifically',
      intro: 'These are the Germany requirements that catch out applicants who prepared a generic Schengen file.',
      items: [
        'A completed VIDEX form from videx.diplo.de, printed and signed. The generic Schengen form is not accepted',
        'An application date no more than 180 days before you travel, which Germany enforces strictly',
        'Submission at the centre matching your emirate of residence, not the one nearest you',
        'Passport valid at least three months beyond the date you leave the Schengen Area',
        'Travel insurance covering EUR 30,000 in medical expenses across all 29 Schengen states',
      ],
    }],
    faqs: [
      { question: 'What is the VIDEX form and do I have to use it?', answer: 'VIDEX is Germany\'s own online visa application form at videx.diplo.de, and it is mandatory. Germany does not accept the generic Schengen application form used by other consulates. You complete it online, print it and sign it, and VFS will not take your file without it.' },
      { question: 'Which VFS centre do I use for a Germany visa?', answer: 'Your emirate of residence decides, not your convenience. If you live in Dubai or the Northern Emirates you submit in Dubai. If you live in Abu Dhabi or Al Ain you submit in Abu Dhabi. Turning up at the wrong centre means losing the appointment and rebooking.' },
      { question: 'Who decides my Germany visa application?', answer: 'The German Consulate General in Dubai decides every application from the UAE, including files submitted at the Abu Dhabi centre. VFS only collects documents and biometrics and forwards them. The centre you attend has no bearing on the outcome.' },
      { question: 'How early can I apply for a Germany visa?', answer: 'No earlier than 180 days before you travel, and Germany enforces that limit. Apply at least four weeks ahead so there is room if the consulate asks for more documents. Processing takes up to 15 days once your file reaches the consulate.' },
      { question: 'Can the German consulate call me for an interview?', answer: 'Yes. The Dubai consulate reserves the right to request additional documents or call you in, usually where the purpose of travel or the funding is unclear. It is uncommon with a complete file, which is the main reason we check the whole thing before submission.' },
      { question: 'Can I visit other countries on a Germany visa?', answer: 'Yes. A standard Schengen visa issued by Germany lets you move freely across all 29 Schengen states while it is valid. Apply through Germany only if it is your main destination, meaning where you spend the most nights, or your first point of entry if the nights are equal.' },
      { question: 'Will the German consulate accept a flight reservation?', answer: 'Yes. Germany accepts a flight reservation rather than a paid ticket, provided it carries a real booking reference the consulate can verify with the airline. Your package includes the flight reservation, so we book it in the format the consulate expects and hand it over ready to submit.' },
      { question: 'What happens if my Germany visa is refused after I have paid you?', answer: 'Consular and VFS fees are non-refundable for everyone, through any provider, because the consulate sets that rule. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal and the specific changes to make.' },
    ],
  },

  'italy-visa': {
    heroHeadline: 'Italy Visa from the UAE, Prepared for the Counter',
    heroSubheadline:
      'Italy collects its fees at the VFS counter on the day rather than online, and will not take an application more than six months before you travel. We prepare the file, book the slot and tell you exactly what to bring.',
    metaTitle: 'Italy Visa from UAE | VFS Booking and Document Preparation',
    metaDescription:
      'Apply for an Italy Schengen visa from the UAE. We prepare the file, book your VFS appointment and tell you what to bring to the counter. From AED 299.',
    excerpt:
      'Italy visa assistance for UAE residents. We prepare the file, book the VFS slot and brief you on what Italy collects at the counter.',
    processingTime: 'Up to 15 calendar days',
    visaCentre: {
      name: 'VFS Global Italy',
      city: 'Dubai',
      note: 'Fees are paid here on the day, by cash or card, not online in advance.',
    },
    processSteps: [
      { title: 'We check your travel window', description: 'Italy will not accept a file more than six months before your travel date. We confirm your dates qualify before anything else starts.', icon: 'CalendarCheck' },
      { title: 'We complete and sign the form', description: 'The Schengen application form, filled and prepared for your signature, with the supporting documents Italy expects behind it.', icon: 'FileText' },
      { title: 'We book your VFS slot', description: 'Italy slots in Dubai go quickly over summer and the holidays. We book the earliest that still leaves time to prepare.', icon: 'Clock' },
      { title: 'We brief you on the counter', description: 'Italy takes the consular and service fees at the appointment itself, cash or card. We tell you the amount to bring so nothing stalls on the day.', icon: 'CreditCard' },
      { title: 'You attend and give biometrics', description: 'Fingerprints go into the Visa Information System and are reused for five years, so most repeat applicants skip this step.', icon: 'Fingerprint' },
      { title: 'The consulate decides, we track it', description: 'VFS forwards your file to the Italian Consulate, which makes the decision. We follow it until your passport is back.', icon: 'Send' },
    ],
    requirementSections: [{
      title: 'What Italy Asks For Specifically',
      intro: 'The Italy application differs from its neighbours in ways that are easy to miss.',
      items: [
        'A travel date within six months of the application, which Italy will not stretch',
        'The consular and VFS fees brought to the appointment, in cash or on a card. Italy does not take them online in advance',
        'Biometrics in person, unless you have given them for a Schengen visa within the last five years',
        'Travel insurance covering EUR 30,000 in medical expenses across all 29 Schengen states',
        'Passport valid at least three months beyond the date you leave the Schengen Area',
      ],
    }],
    faqs: [
      { question: 'When do I pay for an Italy visa?', answer: 'At the VFS counter on the day of your appointment, by cash or card. Italy does not collect the consular or service fee online when you book, which catches out applicants who assumed the booking covered it. We tell you the exact amount to bring.' },
      { question: 'How early can I apply for an Italy visa?', answer: 'No earlier than six months before your travel date. Applying sooner means the file is refused at the counter rather than assessed. Four to six weeks ahead is the practical window, which leaves room if the consulate asks for more documents.' },
      { question: 'Do I need to give biometrics again for Italy?', answer: 'Only if you have not given them for a Schengen visa in the last five years. Fingerprints are stored in the Visa Information System and reused across all Schengen states, so most repeat applicants skip that part of the appointment entirely.' },
      { question: 'How long does an Italy visa take from the UAE?', answer: 'Up to 15 calendar days from the date your file reaches the consulate. Complex cases can extend to 30 days, and in rare cases 45. Summer and the Christmas period are the slowest, so apply four to six weeks before you fly.' },
      { question: 'Can I visit other countries on an Italy visa?', answer: 'Yes. A standard Schengen visa issued by Italy lets you move freely across all 29 Schengen states while it is valid. Apply through Italy only if it is your main destination, meaning where you spend the most nights, or your first point of entry if the nights are equal.' },
      { question: 'Will the Italian consulate accept a flight reservation?', answer: 'Yes. Italy accepts a flight reservation rather than a paid ticket, provided it carries a real booking reference the consulate can verify with the airline. Your package includes the flight reservation, so we book it in the format the consulate expects and hand it over ready to submit.' },
      { question: 'I was refused an Italy visa before. Can you still help?', answer: 'Yes, and it is a large part of what we do. We start from the refusal notice, work out which of the stated grounds actually applies, and rebuild the file to answer it. Reapplying with the same documents and hoping for a different officer is the common mistake.' },
      { question: 'What happens if my Italy visa is refused after I have paid you?', answer: 'Consular and VFS fees are non-refundable for everyone, through any provider, because the consulate sets that rule. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal and the specific changes to make.' },
    ],
  },

  'spain-visa': {
    heroHeadline: 'Spain Visa from the UAE, Filed Through BLS',
    heroSubheadline:
      'Spain is the one Schengen destination that does not use VFS. You need a BLS account, the Annex A form and the fees paid online before the appointment exists. We handle all three.',
    metaTitle: 'Spain Visa from UAE | BLS Account, Annex A and Booking',
    metaDescription:
      'Apply for a Spain Schengen visa from the UAE. We set up the BLS account, complete Annex A, pay the fees online and prepare the file. From AED 299.',
    excerpt:
      'Spain visa assistance for UAE residents. We handle the BLS account, the Annex A form and the full document file.',
    processingTime: '15 calendar days',
    visaCentre: {
      name: 'BLS International Spain',
      city: 'Dubai',
      note: 'Spain does not use VFS. Fees are paid online at booking, not at the counter.',
    },
    processSteps: [
      { title: 'We set up your BLS account', description: 'Spain requires a registered BLS account before anything can be booked. We create it and keep the credentials with your file.', icon: 'UserPlus' },
      { title: 'We complete the Annex A form', description: 'Spain uses its own Annex A declaration alongside the Schengen form. Both need to be right before BLS will accept the file.', icon: 'FileText' },
      { title: 'We book and pay online', description: 'Spain takes the consular and service fees online at the point of booking, so the appointment is not confirmed until they clear.', icon: 'CreditCard' },
      { title: 'We build the document file', description: 'Cover letter, financial evidence, flight reservation, hotel booking, insurance and itinerary, assembled the way the consulate reads them.', icon: 'ClipboardCheck' },
      { title: 'You attend BLS and give biometrics', description: 'You hand over the file and give fingerprints. Bring the passport with two blank pages, which BLS checks at the counter.', icon: 'Fingerprint' },
      { title: 'The consulate decides, we track it', description: 'BLS forwards the file to the Spanish Consulate, which makes the decision. We follow it until your passport is back.', icon: 'Send' },
    ],
    requirementSections: [{
      title: 'What Spain Asks For Specifically',
      intro: 'Spain runs a different centre and a different form from every other Schengen destination here.',
      items: [
        'A registered BLS International account, which the appointment is booked under',
        'The Annex A declaration, in addition to the standard Schengen application form',
        'Consular and service fees paid online at booking. Spain does not take them at the counter',
        'A passport with at least two blank pages and three months validity beyond your return',
        'Emirates ID copied front and back, plus your UAE residence visa page',
        'Indian nationals: at least six months of UAE residency, an employment contract or trade licence, and copies of previous Schengen visas',
      ],
    }],
    faqs: [
      { question: 'Why does Spain use BLS instead of VFS?', answer: 'BLS International holds the outsourcing contract with the Spanish Embassy and Consulates in the UAE, so every Spain application goes through BLS rather than VFS. It means a different account, a different form and a different centre from the rest of your Schengen options.' },
      { question: 'What is the Annex A form?', answer: 'Annex A is a declaration Spain requires alongside the standard Schengen application form. It is specific to Spain, and BLS will not accept a file without it. It is one of the more common reasons a Spain application is turned away at the counter rather than assessed.' },
      { question: 'When do I pay for a Spain visa?', answer: 'Online, at the point of booking. Spain takes both the consular fee and the BLS service fee up front, and the appointment is not confirmed until payment clears. This is the opposite of Italy, which collects everything at the counter on the day.' },
      { question: 'Are the requirements different for Indian nationals?', answer: 'Yes. Indian passport holders applying from the UAE must additionally show at least six months of UAE residency, an employment contract or trade licence, and copies of any previously issued Schengen visas. A file that would pass for another nationality can be turned away without these.' },
      { question: 'How many blank passport pages does Spain need?', answer: 'At least two, and BLS checks this at the counter before accepting the file. Your passport also needs at least three months of validity beyond the date you return. Both are routine to fix in advance and expensive to discover on appointment day.' },
      { question: 'Can I visit other countries on a Spain visa?', answer: 'Yes. A standard Schengen visa issued by Spain lets you move freely across all 29 Schengen states while it is valid. Apply through Spain only if it is your main destination, meaning where you spend the most nights, or your first point of entry if the nights are equal.' },
      { question: 'Will the Spanish consulate accept a flight reservation?', answer: 'Yes. Spain accepts a flight reservation rather than a paid ticket, provided it carries a real booking reference the consulate can verify with the airline. Your package includes the flight reservation, so we book it in the format the consulate expects and hand it over ready to submit.' },
      { question: 'What happens if my Spain visa is refused after I have paid you?', answer: 'Consular and BLS fees are non-refundable for everyone, through any provider, because the consulate sets that rule. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal and the specific changes to make.' },
    ],
  },

  'greece-visa': {
    heroHeadline: 'Greece Visa from the UAE, Filed at Wafi',
    heroSubheadline:
      'Greece takes submissions at VFS in Wafi Mall on a shorter counter window than most, and your Emirates ID decides which centre you use. We prepare the file and book the slot that fits.',
    metaTitle: 'Greece Visa from UAE | VFS Wafi Booking and Documents',
    metaDescription:
      'Apply for a Greece Schengen visa from the UAE. We prepare the file, book your VFS appointment at Wafi and check the insurance Greece requires. From AED 299.',
    excerpt:
      'Greece visa assistance for UAE residents. We prepare the file, book the VFS slot at Wafi and check the insurance covers all 29 states.',
    processingTime: '10 – 15 working days',
    visaCentre: {
      name: 'VFS Global Greece',
      city: 'Dubai',
      address: 'Ground and First Floor, Phase 5 Horus, Wafi Mall, Umm Hurair Second, Dubai',
      note: 'Submissions close at 15:00, earlier than collections at 17:00.',
    },
    processSteps: [
      { title: 'We check your emirate and dates', description: 'The emirate on your Emirates ID fixes which centre you apply at, and Greece will not take a file more than six months before travel.', icon: 'MapPin' },
      { title: 'We build the document file', description: 'Cover letter, financial evidence, flight reservation, hotel booking and itinerary, assembled the way the consulate reads them.', icon: 'FileText' },
      { title: 'We check the insurance covers all 29', description: 'Greece rejects single-country policies outright. The cover has to run across every Schengen state for the whole trip.', icon: 'ShieldCheck' },
      { title: 'We book your VFS slot at Wafi', description: 'Submissions close at 15:00 even though the counter stays open to 17:00 for collections. We book inside the submission window.', icon: 'Clock' },
      { title: 'You attend and give biometrics', description: 'You hand over the file and give fingerprints. First-time Schengen applicants only, and they last five years.', icon: 'Fingerprint' },
      { title: 'The consulate decides, we track it', description: 'VFS forwards the file to the Greek Consulate for the decision. We follow it until your passport is back at Wafi.', icon: 'Send' },
    ],
    requirementSections: [{
      title: 'What Greece Asks For Specifically',
      intro: 'Greece is stricter than most on insurance and on where you are allowed to apply.',
      items: [
        'Travel insurance covering all 29 Schengen states for the full trip. Single-country policies are rejected outright',
        'Application at the centre matching the emirate on your Emirates ID',
        'A travel date within six months of the application',
        'Attendance inside the submission window, which closes at 15:00 rather than 17:00',
        'Passport valid at least three months beyond the date you leave the Schengen Area',
      ],
    }],
    faqs: [
      { question: 'What insurance does Greece accept?', answer: 'A policy covering EUR 30,000 in medical expenses across all 29 Schengen states, valid for the full trip. Greece rejects single-country policies outright, which is one of the more common reasons a file is turned away. We check the wording before you submit.' },
      { question: 'Where do I submit a Greece visa application in Dubai?', answer: 'VFS Global Greece on the Ground and First Floor, Phase 5 Horus, Wafi Mall, Umm Hurair Second. Submissions close at 15:00 even though the counter stays open until 17:00 for passport collection, so an afternoon appointment is not the same as an afternoon collection.' },
      { question: 'Can I apply at any Greece centre in the UAE?', answer: 'No. The emirate on your Emirates ID decides where you apply, not where it is convenient to travel. Attending the wrong centre means losing the appointment and rebooking, which in peak season can cost two to three weeks.' },
      { question: 'How long does a Greece visa take from the UAE?', answer: 'Typically 10 to 15 working days from the date VFS forwards your file to the consulate. That stretches over summer and the Christmas period. Apply four to six weeks before you travel so a request for extra documents does not cost you the trip.' },
      { question: 'How early can I apply for a Greece visa?', answer: 'No earlier than six months before your travel date. Beyond that the file is refused at the counter rather than assessed. Four to six weeks ahead is the practical window and leaves room for the consulate to come back with questions.' },
      { question: 'Can I visit other countries on a Greece visa?', answer: 'Yes. A standard Schengen visa issued by Greece lets you move freely across all 29 Schengen states while it is valid. Apply through Greece only if it is your main destination, meaning where you spend the most nights, or your first point of entry if the nights are equal.' },
      { question: 'Will the Greek consulate accept a flight reservation?', answer: 'Yes. Greece accepts a flight reservation rather than a paid ticket, provided it carries a real booking reference the consulate can verify with the airline. Your package includes the flight reservation, so we book it in the format the consulate expects and hand it over ready to submit.' },
      { question: 'What happens if my Greece visa is refused after I have paid you?', answer: 'Consular and VFS fees are non-refundable for everyone, through any provider, because the consulate sets that rule. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal and the specific changes to make.' },
    ],
  },
};

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const overlays = conn.db.collection('visa-overlays');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

for (const [slug, doc] of Object.entries(PAGES)) {
  const before = await overlays.findOne({ residence: 'AE', visaSlug: slug });
  if (!before) { console.log(`  ${slug}: overlay not found, skipped`); continue; }
  console.log(`  ${slug.padEnd(14)} faqs ${before.faqs?.length ?? 0}->${doc.faqs.length}  steps ${before.processSteps?.length ?? 'inherit'}->${doc.processSteps.length}  metaTitle ${doc.metaTitle.length}ch  metaDesc ${doc.metaDescription.length}ch`);
  if (APPLY) await overlays.updateOne({ residence: 'AE', visaSlug: slug }, { $set: doc });
}

console.log('\n=== cross-page duplicate FAQ answers (country name normalised) ===');
const SLUGS = ['schengen', 'france-visa', 'germany-visa', 'italy-visa', 'spain-visa', 'greece-visa'];
const norm = (t) => String(t).replace(/france|germany|italy|spain|greece|schengen|french|german|italian|spanish|greek|vfs|bls/gi, 'X').toLowerCase().replace(/\s+/g, ' ').trim();
const docs = {};
for (const s of SLUGS) docs[s] = await overlays.findOne({ residence: 'AE', visaSlug: s });

let dupes = 0;
for (let i = 0; i < SLUGS.length; i++) {
  for (let j = i + 1; j < SLUGS.length; j++) {
    const a = docs[SLUGS[i]]?.faqs || [], b = docs[SLUGS[j]]?.faqs || [];
    for (const x of a) {
      for (const y of b) {
        if (norm(x.answer) === norm(y.answer)) {
          dupes++;
          console.log(`  ${SLUGS[i]} = ${SLUGS[j]}: "${x.question.slice(0, 60)}"`);
        }
      }
    }
  }
}
console.log(`  total duplicate pairs: ${dupes}`);

await mongoose.disconnect();
