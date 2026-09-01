/**
 * Three FAQs survived the differentiation pass identical across all six
 * Schengen-family pages: free movement, flight reservations, and what happens
 * after a refusal. The underlying rules genuinely are the same everywhere,
 * which is why the template produced one answer for all of them, but six pages
 * carrying the same three answers is the duplication we set out to remove.
 *
 * Each is rewritten around something concrete to that country: a worked
 * example of the main-destination rule, the specific centre that checks the
 * reservation, and the specific fees that are lost on a refusal.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/differentiate-shared-faqs.mjs          # dry run
 *   node --env-file=.env.production scripts/differentiate-shared-faqs.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const REWRITES = {
  'france-visa': {
    movement: 'Yes, and the rule that matters is which consulate you apply to. Spend four nights in Paris and two in Brussels and France is your main destination, so you apply to France and travel on freely across all 29 Schengen states. Get that backwards and the visa can be refused for applying to the wrong consulate.',
    flight: 'Yes. France checks the reservation against the itinerary you declared on France-Visas, so the two have to match. It needs a real booking reference the consulate can verify with the airline. Your package includes the reservation, booked in that format and handed over ready to submit.',
    refusal: 'The consular fee and the VFS service charge are gone either way, because the consulate sets that rule rather than us. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal grounds and the specific changes to make before reapplying.',
  },
  'germany-visa': {
    movement: 'Yes, and picking the right consulate matters. Four nights in Berlin and two in Prague makes Germany your main destination, so you apply to Germany and then travel freely across all 29 Schengen states. Applying to the wrong consulate for your itinerary is itself a ground for refusal.',
    flight: 'Yes. VFS checks the reservation against the travel dates on your VIDEX form, so the two need to agree. It has to carry a real booking reference the consulate can verify with the airline. Your package includes the reservation, booked in that format and handed over ready to submit.',
    refusal: 'The consular fee and the VFS charge are not refundable, because the Dubai consulate sets that rule rather than us. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal grounds and the specific changes to make before reapplying.',
  },
  'italy-visa': {
    movement: 'Yes, as long as Italy is where you spend the most nights. Five nights in Rome and two in Nice makes Italy your main destination, so you apply to Italy and then move freely across all 29 Schengen states. Applying through the wrong consulate is a refusal ground on its own.',
    flight: 'Yes. VFS Italy checks the reservation at the counter alongside the rest of the file, so it needs a real booking reference the consulate can verify with the airline. Your package includes the reservation, booked in that format and handed to you ready for the appointment.',
    refusal: 'The consular and VFS fees you paid at the counter are not refundable, because the consulate sets that rule rather than us. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal grounds and the specific changes to make before reapplying.',
  },
  'spain-visa': {
    movement: 'Yes, provided Spain is your main destination. Six nights in Barcelona and two in Lisbon means you apply to Spain, then travel freely across all 29 Schengen states. Applying to the wrong consulate for your itinerary is itself a ground for refusal, so the nights decide it, not the flight route.',
    flight: 'Yes. BLS uploads the reservation with the rest of your file, so it has to carry a real booking reference the consulate can verify with the airline. Your package includes the reservation, booked in that format and attached before your appointment rather than handed over on the day.',
    refusal: 'The consular fee and the BLS service charge were paid online at booking and are not refundable, because the consulate sets that rule rather than us. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal grounds and the changes to make.',
  },
  'greece-visa': {
    movement: 'Yes, as long as Greece is where you spend the most nights. Seven nights across Athens and the islands against two in Rome makes Greece your main destination, so you apply to Greece and then move freely across all 29 Schengen states. The nights decide it, not where you fly into.',
    flight: 'Yes. VFS at Wafi checks the reservation against your declared dates, so it needs a real booking reference the consulate can verify with the airline. Your package includes the reservation, booked in that format and handed over ready to submit inside the 15:00 window.',
    refusal: 'The consular fee and the VFS charge are not refundable, because the Greek Consulate sets that rule rather than us. Our Concierge package includes a free resubmission with a revised file. Basic and Standard clients get a written analysis of the refusal grounds and the specific changes to make before reapplying.',
  },
};

const MATCH = {
  movement: /visit other countries/i,
  flight: /accept a (?:gds )?flight reservation/i,
  refusal: /refused after I (?:have )?paid/i,
};

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}
const overlays = conn.db.collection('visa-overlays');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

for (const [slug, rew] of Object.entries(REWRITES)) {
  const d = await overlays.findOne({ residence: 'AE', visaSlug: slug });
  if (!d) { console.log(`  ${slug}: not found`); continue; }
  const hit = [];
  const faqs = (d.faqs || []).map((f) => {
    for (const [key, re] of Object.entries(MATCH)) {
      if (re.test(f.question)) { hit.push(key); return { ...f, answer: rew[key] }; }
    }
    return f;
  });
  console.log(`  ${slug.padEnd(14)} rewrote: ${hit.join(', ') || 'none matched'}`);
  if (APPLY) await overlays.updateOne({ _id: d._id }, { $set: { faqs } });
}

console.log('\n=== cross-page duplicate FAQ answers ===');
const SLUGS = ['schengen', 'france-visa', 'germany-visa', 'italy-visa', 'spain-visa', 'greece-visa'];
const norm = (t) => String(t).replace(/france|germany|italy|spain|greece|schengen|french|german|italian|spanish|greek|vfs|bls/gi, 'X').toLowerCase().replace(/\s+/g, ' ').trim();
const docs = {};
for (const s of SLUGS) docs[s] = await overlays.findOne({ residence: 'AE', visaSlug: s });
let dupes = 0;
for (let i = 0; i < SLUGS.length; i++) {
  for (let j = i + 1; j < SLUGS.length; j++) {
    for (const x of docs[SLUGS[i]]?.faqs || []) {
      for (const y of docs[SLUGS[j]]?.faqs || []) {
        if (norm(x.answer) === norm(y.answer)) { dupes++; console.log(`  ${SLUGS[i]} = ${SLUGS[j]}: "${x.question.slice(0, 55)}"`); }
      }
    }
  }
}
console.log(`  total duplicate pairs: ${dupes}`);

await mongoose.disconnect();
