// Usage: node --env-file=.env.production scripts/seo-blog-content-fixes.mjs [--apply]
//
// SEO audit batch 1. Normalises in-article links to root-relative paths, fixes
// two slugs that 404, replaces cross-brand outbound links, resolves the "#"
// placeholders, adds the missing money-page links, corrects the two airline
// website PNR verification overclaims, and strips em dashes from tag metaTitles.
// Writes straight to the collections: the blog service regenerates slug and
// readingTime on save, which would churn published URLs.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

await mongoose.connect(process.env.MONGO_URI);
const Blog = mongoose.connection.collection('blogs');
const BlogTag = mongoose.connection.collection('blog-tags');

const posts = await Blog.find({ status: 'published' }).toArray();
const tags = await BlogTag.find({}).toArray();

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = join(__dirname, `seo-blog-content-backup-${stamp}.json`);
writeFileSync(backup, JSON.stringify({ posts, tags }, null, 2));
console.log(`backed up ${posts.length} posts and ${tags.length} tags -> ${backup}`);

const bySlug = Object.fromEntries(posts.map((p) => [p.slug, p]));
let failures = 0;
const fail = (m) => { console.error(m); failures++; };

// 1. Slugs that currently 404.
const BAD_SLUGS = {
  'what-documents-are-required-for-schengen-visa-from-uae': 'what-documents-are-required-for-a-schengen-visa-from-uae',
  'how-long-does-schengen-visa-take-from-uae': 'how-long-does-a-schengen-visa-take-from-the-uae',
};

// 2. "#" placeholders and cross-brand links, resolved by their anchor text.
const BY_ANCHOR = {
  'how long a dummy ticket should be valid for': '/blog/how-long-should-a-dummy-ticket-be-valid',
  'whether dummy tickets are legal for visa applications': '/blog/are-dummy-tickets-legal-for-visa-application',
  'how dummy tickets work': '/blog/how-do-dummy-tickets-work',
  'whether embassies accept dummy tickets in 2026': '/blog/do-embassies-accept-dummy-tickets-in-2026',
  'how to prepare documents for a visa application in the UAE': '/blog/how-to-prepare-documents-for-visa-application-uae',
  'verifiable Schengen dummy ticket': '/dummy-ticket-schengen-visa',
  'dummy tickets are legal for visa applications': '/blog/are-dummy-tickets-legal-for-visa-application',
};

// 3. Airline-website verification overclaims.
const VERIFICATION = {
  'how-long-should-a-dummy-ticket-be-valid': [
    ["verified on the airline's website, but you do not pay full airfare",
     'verified through the global distribution systems (Amadeus, Sabre, Travelport) that embassies use, but you do not pay full airfare'],
  ],
  'are-dummy-tickets-legal-for-visa-application': [
    ["verifiable on the airline's own website for a short period, usually one to two weeks",
     'verifiable through the global distribution systems (Amadeus, Sabre, Travelport) for a short period, usually one to two weeks, and with selected airlines such as Emirates and Etihad you can also check it directly under Manage Booking'],
  ],
};

// 4. Money-page and cluster links still missing after the steps above.
const A = (href, text) => `<a href="${href}">${text}</a>`;
const ADDITIONS = {
  'how-do-dummy-tickets-work': [
    ['verify the reservation independently.',
     `verify the reservation independently. The same reservation also works as an ${A('/onward-ticket', 'onward ticket')} when an airline or immigration officer asks for proof of departure.`],
  ],
  'are-dummy-tickets-legal-for-visa-application': [
    ['You have two main options.',
     `You have two main options. For airport and border checks the equivalent document is an ${A('/onward-ticket', 'onward ticket')}.`],
  ],
  'do-embassies-accept-dummy-tickets-in-2026': [
    ['proof of onward travel requirements. They work because',
     `proof of onward travel requirements. For European applications specifically, a ${A('/dummy-ticket-schengen-visa', 'dummy ticket for a Schengen visa')} is formatted to VFS and BLS expectations. They work because`],
  ],
  'how-long-should-a-dummy-ticket-be-valid': [
    ['Most dummy tickets are valid for 24 to 72 hours.',
     `Most dummy tickets are valid for 24 to 72 hours. Our ${A('/dummy-ticket-schengen-visa', 'dummy ticket for a Schengen visa')} comes in 2, 7 and 14 day validity periods so you can match your appointment date.`],
  ],
  'is-travel-insurance-mandatory-for-schengen-visa-from-uae': [
    ['A minimum of EUR 30,000 in emergency medical coverage.',
     `A minimum of EUR 30,000 in emergency medical coverage, which our ${A('/schengen-travel-insurance', 'Schengen travel insurance')} meets.`],
    ['you can get a verified dummy ticket for your chosen airline alongside your insurance.',
     `you can get a verified dummy ticket for your chosen airline alongside your insurance. ${A('/blog/how-much-does-travel-insurance-cost-in-the-uae', 'How much travel insurance costs in the UAE')} breaks down the price by destination.`],
  ],
  'how-much-does-travel-insurance-cost-in-the-uae': [
    ['with single trip policies starting from around AED 30.',
     `with single trip policies starting from around AED 30. For European trips our ${A('/schengen-travel-insurance', 'Schengen travel insurance')} starts at the same price.`],
    ['without paying full airfare before your visa is approved.',
     `without paying full airfare before your visa is approved. Cover itself is compulsory: see ${A('/blog/is-travel-insurance-mandatory-for-schengen-visa-from-uae', 'is travel insurance mandatory for a Schengen visa')}.`],
  ],
  'what-documents-are-required-for-a-schengen-visa-from-uae': [
    ['matching accommodation, and compliant insurance.',
     `matching accommodation, and compliant ${A('/schengen-travel-insurance', 'Schengen travel insurance')}.`],
  ],
  'budget-airlines-uae-to-europe-2026-guide': [
    ['so you only buy the real ticket once your visa is con',
     `so you only buy the real ticket once your visa is con`],
  ],
};
// budget-airlines also needs a /flight-itinerary link.
ADDITIONS['budget-airlines-uae-to-europe-2026-guide'] = [
  ['Never buy a non-refundable budget fare before your Schengen visa is approved.',
   `Never buy a non-refundable budget fare before your Schengen visa is approved. A ${A('/flight-itinerary', 'flight itinerary')} with a live PNR covers the booking-proof requirement in the meantime.`],
];

const MONEY = ['/', '/dummy-ticket-schengen-visa', '/dummy-ticket-us-visa', '/emirates-dummy-ticket',
  '/etihad-dummy-ticket', '/onward-ticket', '/flight-itinerary', '/travel-insurance', '/schengen-travel-insurance'];

const report = [];

for (const post of posts) {
  let c = post.content;

  for (const [find, repl] of VERIFICATION[post.slug] ?? []) {
    if (!c.includes(find)) fail(`NO MATCH [verification] ${post.slug}: ${find.slice(0, 55)}`);
    else c = c.replace(find, repl);
  }

  // Resolve "#" and cross-brand hrefs from their anchor text.
  c = c.replace(/href="(?:#|https:\/\/dummyticket365\.com[^"]*)"([^>]*)>([\s\S]*?)<\/a>/g,
    (m, attrs, text) => {
      const key = text.replace(/<[^>]+>/g, '').trim();
      const target = BY_ANCHOR[key];
      if (!target) { fail(`UNMAPPED ANCHOR in ${post.slug}: ${JSON.stringify(key)}`); return m; }
      return `href="${target}"${attrs}>${text}</a>`;
    });

  // Normalise every internal href to a root-relative path.
  c = c.replace(/href="((?:\.\.\/)+|https:\/\/www\.mydummyticket\.ae\/?)([^"]*)"/g,
    (m, _prefix, rest) => `href="/${rest}"`);

  // Fix the two slugs that 404.
  for (const [bad, good] of Object.entries(BAD_SLUGS)) c = c.split(bad).join(good);

  for (const [find, repl] of ADDITIONS[post.slug] ?? []) {
    if (!c.includes(find)) fail(`NO MATCH [addition] ${post.slug}: ${find.slice(0, 55)}`);
    else c = c.replace(find, repl);
  }

  post.content = c;

  const hrefs = [...c.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const internal = hrefs.filter((h) => h.startsWith('/'));
  const money = internal.filter((h) => MONEY.includes(h));
  if (!money.length) fail(`NO MONEY LINK: ${post.slug}`);
  for (const h of hrefs) {
    if (h.includes('dummyticket365')) fail(`CROSS-BRAND LINK remains in ${post.slug}`);
    if (h === '#') fail(`PLACEHOLDER href remains in ${post.slug}`);
    if (h.startsWith('..')) fail(`RELATIVE href remains in ${post.slug}: ${h}`);
  }
  for (const h of internal) {
    if (h.startsWith('/blog/') && !bySlug[h.slice(6)]) fail(`BROKEN POST LINK in ${post.slug}: ${h}`);
  }
  report.push({ post: post.slug, money: [...new Set(money)].join(' '), posts: [...new Set(internal.filter((h) => h.startsWith('/blog/')))].length });
}

const TAG_TITLES = {
  'dummy-tickets': 'Dummy Tickets | Guides, Tips and Visa Advice',
  'visa-application': 'Visa Application | Guides and Tips',
  'travel-insurance': 'Travel Insurance | Guides and Tips',
  'schengen-visa': 'Schengen Visa | Application Guides for UAE Residents',
};

if (failures) { console.error(`\n${failures} problem(s). Nothing written.`); await mongoose.disconnect(); process.exit(1); }
console.table(report);

if (!APPLY) { console.log('\nDRY RUN. Re-run with --apply to write.'); await mongoose.disconnect(); process.exit(0); }

for (const post of posts) await Blog.updateOne({ _id: post._id }, { $set: { content: post.content } });
for (const tag of tags) {
  const t = TAG_TITLES[tag.slug];
  if (t && tag.metaTitle !== t) {
    await BlogTag.updateOne({ _id: tag._id }, { $set: { metaTitle: t } });
    console.log(`tag metaTitle -> ${tag.slug}: ${t}`);
  }
}
console.log(`\napplied to ${posts.length} posts and ${tags.length} tags`);
await mongoose.disconnect();
