// Usage: node --env-file=.env.production scripts/seo-blog-wave2.mjs [--apply]
//
// SEO batch 2. Adds contextual links to the four money pages that sat on one
// inbound, adds one outbound authority citation to each of the nine posts that
// had none, and rewrites flat section headings as questions on three posts.
// Writes straight to the collection: the blog service regenerates slug and
// readingTime on save, which would churn published URLs. updatedAt is left
// alone so these edits do not read as a freshness signal.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

const A = (href, text) => `<a href="${href}">${text}</a>`;
// Every URL below returned 200 when checked. Wizz Air was dropped: it answers
// automated requests with 405, so it cannot be verified and is not cited.
const EURLEX = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32009R0810';
const VFS = 'https://www.vfsglobal.com/en/individuals/index.html';
const IATA = 'https://www.iata.org/en/programs/passenger/';
const TURKEY = 'https://www.evisa.gov.tr/en/';
const RYANAIR = 'https://www.ryanair.com/gb/en/useful-info/help-centre/faq-overview/Bags';

// [find, replace] applied in order. Find strings were all confirmed present.
const EDITS = {
  'do-embassies-accept-dummy-tickets-in-2026': [
    ['United States</li>', `${A('/dummy-ticket-us-visa', 'United States')}</li>`],
    ['proof of onward travel requirements.',
     `proof of onward travel requirements. Article 14 of the ${A(EURLEX, 'EU Visa Code')} lists the supporting documents a Schengen application must carry, and evidence of transport is one of them.`],
  ],
  'how-do-dummy-tickets-work': [
    ['such as Emirates and Etihad directly under Manage Booking',
     `such as ${A('/emirates-dummy-ticket', 'Emirates')} and ${A('/etihad-dummy-ticket', 'Etihad')} directly under Manage Booking`],
    ['verified on the GDS and airline systems using a live PNR.',
     `verified on the GDS and airline systems using a live PNR, the same reservation record ${A(IATA, 'IATA')} defines for passenger bookings.`],
  ],
  'are-dummy-tickets-legal-for-visa-application': [
    ['such as Emirates and Etihad you can also check it directly under Manage Booking',
     `such as Emirates and ${A('/etihad-dummy-ticket', 'Etihad')} you can also check it directly under Manage Booking`],
    ['whether using one puts them at financial or legal risk.',
     `whether using one puts them at financial or legal risk. Article 14 of the ${A(EURLEX, 'EU Visa Code')} sets out the supporting documents a Schengen application must include, and a flight reservation is one of them.`],
  ],
  'is-travel-insurance-mandatory-for-schengen-visa-from-uae': [
    [`which our ${A('/schengen-travel-insurance', 'Schengen travel insurance')} meets.`,
     `which our ${A('/schengen-travel-insurance', 'Schengen travel insurance')} meets. Article 15 of the ${A(EURLEX, 'EU Visa Code')} sets that threshold.`],
  ],
  'what-documents-are-required-for-a-schengen-visa-from-uae': [
    ['flight itinerary showing your entry and exit dates',
     `${A('/flight-itinerary', 'flight itinerary')} showing your entry and exit dates`],
    ['supporting documents exactly.',
     `supporting documents exactly. Annex II of the ${A(EURLEX, 'EU Visa Code')} is the source list consulates work from.`],
  ],
  'how-long-does-a-schengen-visa-take-from-the-uae': [
    ['flight itinerary requirement', `${A('/flight-itinerary', 'flight itinerary')} requirement`],
  ],
  'how-to-prepare-documents-for-visa-application-uae': [
    ['VFS Global and BLS International follow strict checklists',
     `${A(VFS, 'VFS Global')} and BLS International follow strict checklists`],
  ],
  'how-long-should-a-dummy-ticket-be-valid': [
    ['Air France, Lufthansa, and Emirates are known for longer hold windows',
     `Air France, Lufthansa, and ${A('/emirates-dummy-ticket', 'Emirates')} are known for longer hold windows`],
    [`comes in 2, 7 and 14 day validity periods so you can match your appointment date.`,
     `comes in 2, 7 and 14 day validity periods so you can match your appointment date, which ${A(VFS, 'VFS Global')} publishes for each mission.`],
  ],
  'are-dummy-tickets-accepted-for-evisa-applications': [
    ['Turkey, Egypt, Georgia, and Azerbaijan all process eVisa applications',
     `${A(TURKEY, 'Turkey')}, Egypt, Georgia, and Azerbaijan all process eVisa applications`],
  ],
  'budget-airlines-uae-to-europe-2026-guide': [
    ['Ryanair covers 229 destinations across 37 countries with the lowest base fares in Europe.',
     `Ryanair covers 229 destinations across 37 countries with the lowest base fares in Europe. Check ${A(RYANAIR, "Ryanair's baggage rules")} before booking, because the base fare excludes cabin and checked bags.`],
  ],
};

// Flat section headings rewritten as questions.
const HEADINGS = {
  'budget-airlines-uae-to-europe-2026-guide': [
    ['What to Expect from Budget Airlines on UAE to Europe Routes', 'What Should You Expect from Budget Airlines on UAE to Europe Routes?'],
    ['UAE-Based Budget Airlines Flying to Europe', 'Which UAE-Based Budget Airlines Fly to Europe?'],
    ['Turkish Low-Cost Carriers with UAE to Europe Connections', 'Which Turkish Low-Cost Carriers Connect the UAE to Europe?'],
    ['European Budget Airlines with UAE Connections', 'Which European Budget Airlines Connect to the UAE?'],
    ['Tips for Booking the Best Fares', 'How Do You Book the Cheapest Fare?'],
  ],
  'common-visa-rejection-reasons-for-uae-residents': [
    ['Document Problems That Cause Immediate Refusal', 'Which Document Problems Cause Immediate Refusal?'],
    ['Travel Document Issues That Raise Red Flags', 'Which Travel Document Issues Raise Red Flags?'],
    ['Financial and Employment Concerns', 'How Do Financial and Employment Gaps Affect Your Application?'],
    ['Intent and Travel History Issues', 'Can Your Travel History Cause a Refusal?'],
    ['What to Do If Your Visa Is Rejected', 'What Should You Do If Your Visa Is Rejected?'],
  ],
  'how-to-prepare-documents-for-visa-application-uae': [
    ['Why Document Preparation Can Make or Break Your Application', 'Why Does Document Preparation Make or Break Your Application?'],
    ['Core Documents Every UAE Visa Applicant Needs', 'Which Core Documents Does Every UAE Visa Applicant Need?'],
    ['Travel Documents That Support Your Application', 'Which Travel Documents Support Your Application?'],
    ['Supporting Documents Based on Your Employment Status', 'Which Documents Do You Need for Your Employment Status?'],
    ['How to Organise and Submit Your Documents', 'How Do You Organise and Submit Your Documents?'],
  ],
};

await mongoose.connect(process.env.MONGO_URI);
const Blog = mongoose.connection.collection('blogs');
const posts = await Blog.find({ status: 'published' }).toArray();

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = join(__dirname, `seo-blog-wave2-backup-${stamp}.json`);
writeFileSync(backup, JSON.stringify(posts, null, 2));
console.log(`backed up ${posts.length} posts -> ${backup}\n`);

const slugs = new Set(posts.map((p) => p.slug));
const ROUTES = new Set(['/', '/dummy-ticket-schengen-visa', '/dummy-ticket-us-visa', '/emirates-dummy-ticket',
  '/etihad-dummy-ticket', '/onward-ticket', '/flight-itinerary', '/travel-insurance',
  '/schengen-travel-insurance', '/faq', '/blog', '/blog/tags', '/privacy-policy', '/terms-and-conditions']);

let failures = 0;
const fail = (m) => { console.error('  ' + m); failures++; };
const rows = [];

for (const post of posts) {
  let c = post.content;
  const before = [...c.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  for (const [find, repl] of HEADINGS[post.slug] ?? []) {
    if (!c.includes(`>${find}<`)) fail(`NO H2 [${post.slug}] ${find}`);
    else c = c.replace(`>${find}<`, `>${repl}<`);
  }
  for (const [find, repl] of EDITS[post.slug] ?? []) {
    if (!c.includes(find)) fail(`NO MATCH [${post.slug}] ${find.slice(0, 60)}`);
    else c = c.replace(find, repl);
  }
  post.content = c;

  const after = [...c.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const added = after.filter((h, i) => before[i] !== h || after.length !== before.length);
  const internal = after.filter((h) => h.startsWith('/'));
  const dup = (arr) => new Set(arr.filter((h, i) => arr.indexOf(h) !== i));
  const preExisting = dup(before.filter((h) => h.startsWith('/')));
  const newDupes = [...dup(internal)].filter((h) => !preExisting.has(h));
  if (newDupes.length) fail(`DUPLICATE TARGET [${post.slug}] ${newDupes.join(', ')}`);
  for (const h of internal) {
    const ok = ROUTES.has(h) || (h.startsWith('/blog/') && slugs.has(h.slice(6)));
    if (!ok) fail(`BROKEN INTERNAL [${post.slug}] ${h}`);
  }
  const ext = after.filter((h) => h.startsWith('http'));
  if ((EDITS[post.slug] || HEADINGS[post.slug]) && ext.length === 0) fail(`NO CITATION [${post.slug}]`);
  rows.push({ post: post.slug, links: internal.length, citations: ext.length });
}

if (failures) { console.error(`\n${failures} problem(s). Nothing written.`); await mongoose.disconnect(); process.exit(1); }
console.table(rows);

if (!APPLY) { console.log('\nDRY RUN. Re-run with --apply to write.'); await mongoose.disconnect(); process.exit(0); }
for (const post of posts) await Blog.updateOne({ _id: post._id }, { $set: { content: post.content } });
console.log(`\napplied to ${posts.length} posts`);
await mongoose.disconnect();
