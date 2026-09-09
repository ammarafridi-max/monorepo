/**
 * Writes metaTitle, metaDescription and an intro for the six tag pages with
 * fewer than four posts. All six had empty metaTitle and metaDescription, so
 * they fell back to the "<Tag> | Blog Tag | VisaWadi" template and had no
 * unique description at all.
 *
 * metaTitle is kept at or under 49 characters because the layout template
 * appends " | VisaWadi", and the rendered <title> should stay under 60.
 *
 * us-visa has no posts yet and is left listed on purpose; the copy is written
 * so the page reads as a section that is being built rather than an error.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/write-thin-tag-copy.mjs          # dry run
 *   node --env-file=.env.production scripts/write-thin-tag-copy.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SUFFIX = 11;

const COPY = {
  'us-visa': {
    metaTitle: 'US Visa Guides for UAE Residents',
    metaDescription:
      'B1/B2 visitor visa guidance for UAE residents: DS-160 preparation, the Dubai and Abu Dhabi interview, refusals under 214(b), and how to reapply.',
    description:
      'Guides on the US B1/B2 visitor visa for people applying from the UAE. The US process is unlike Schengen: there is no visa centre deciding admissibility, the interview carries most of the weight, and a refusal under section 214(b) turns on ties rather than paperwork. This section is being built out.',
  },
  'uk-visa': {
    metaTitle: 'UK Visa Guides for UAE Residents',
    metaDescription:
      'UK Standard Visitor visa guidance for UAE residents: the evidence the Home Office expects, financial requirements, refusal reasons and reapplying.',
    description:
      'Guides on the UK Standard Visitor visa for people applying from the UAE. The Home Office decides on the balance of probabilities from the documents you submit, with no interview in most cases, so the written evidence has to answer the questions a caseworker would otherwise ask.',
  },
  'canada-visa': {
    metaTitle: 'Canada Visa Guides for UAE Residents',
    metaDescription:
      'Canada visitor visa and eTA guidance for UAE residents: IRCC applications, giving biometrics in Dubai and Abu Dhabi, and what drives a refusal.',
    description:
      'Guides on the Canada visitor visa, the TRV, for people applying from the UAE. IRCC assesses financial capacity, travel history and intent to return, and biometrics are given locally before the file is decided offshore. Refusal letters are terse, so knowing which ground was cited matters.',
  },
  'visa-refusals': {
    metaTitle: 'Visa Refusals and How to Reapply',
    metaDescription:
      'Why visa applications from the UAE get refused, what the refusal notice actually tells you, and how to build a stronger second application.',
    description:
      'Guides on what causes a refusal and what to do next. A refusal notice cites a specific ground rather than a general impression, and reading it correctly is the difference between a second application that answers the objection and one that repeats it. Reapplying too quickly with the same file rarely works.',
  },
  'processing-times': {
    metaTitle: 'Visa Processing Times from the UAE',
    metaDescription:
      'How long visa applications take from the UAE, the legal deadlines that apply to Schengen decisions, and what pushes a file past the standard window.',
    description:
      'Guides on how long a decision takes and what the published deadlines actually commit a consulate to. For Schengen the Visa Code sets 15 calendar days, extendable to a maximum of 45 in individual cases. Other destinations publish service standards rather than binding limits.',
  },
  'appointments-and-biometrics': {
    metaTitle: 'Visa Appointments and Biometrics in the UAE',
    metaDescription:
      'Booking visa appointments at VFS Global and BLS International in the UAE, what happens at the counter, and how long biometrics stay on file.',
    description:
      'Guides on booking a slot and what happens when you get there. Which operator you deal with depends on the destination, not on you: most Schengen states in the UAE go through VFS Global while Spain uses BLS International. Schengen fingerprints are reused for 59 months.',
  },
};

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const tags = conn.db.collection('blog-tags');

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
let bad = 0;
for (const [slug, c] of Object.entries(COPY)) {
  const t = await tags.findOne({ slug });
  if (!t) { console.log(`\n${slug}: NOT FOUND`); bad++; continue; }
  const rendered = c.metaTitle.length + SUFFIX;
  const over = rendered > 60 || c.metaDescription.length > 160 || c.description.length > 400;
  if (over) bad++;
  console.log(`\n${slug}${over ? '  *** LIMIT EXCEEDED ***' : ''}`);
  console.log(`  title  ${String(rendered).padStart(2)} rendered  ${c.metaTitle} | VisaWadi`);
  console.log(`  meta  ${String(c.metaDescription.length).padStart(3)}/160    ${c.metaDescription}`);
  console.log(`  intro ${String(c.description.length).padStart(3)}/400 ${String(c.description.split(/\s+/).length).padStart(3)}w`);
  if (APPLY) await tags.updateOne({ _id: t._id }, { $set: { metaTitle: c.metaTitle, metaDescription: c.metaDescription, description: c.description } });
}
console.log(`\n  limit failures: ${bad}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
