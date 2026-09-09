/**
 * Adds a Sources block to the 32 published posts that cite no official
 * authority. Visa content is judged on provenance, and these state fees,
 * processing times and document rules flatly with nothing behind them.
 *
 * What this block does NOT claim: that every sentence in the post has been
 * verified against the source on a given date. It names the authority that
 * governs the subject and tells the reader to confirm before applying. A
 * "last checked" stamp belongs only on posts a human has actually re-checked,
 * which so far is the three rewritten on 2026-09-08.
 *
 * Every URL below returned 200 on 2026-09-08, except france-visas.gouv.fr,
 * mfa.gr and travel.state.gov, which return 403 to automated requests and
 * resolve normally in a browser.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/add-post-sources.mjs           # dry run
 *   node --env-file=.env.production scripts/add-post-sources.mjs --apply
 *   node --env-file=.env.production scripts/add-post-sources.mjs --remove --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const REMOVE = process.argv.includes('--remove');
const MARKER = 'data-block="sources"';

const A = {
  ec: ['European Commission, Schengen visa policy', 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en'],
  code: ['EU Visa Code, Regulation (EC) No 810/2009', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02009R0810-20200202'],
  fee: ['European Commission, Schengen visa fee increased as of 11 June 2024', 'https://home-affairs.ec.europa.eu/news/schengen-visa-fee-increased-11-june-2024-2024-06-13_en'],
  france: ['France-Visas, the official French visa portal', 'https://france-visas.gouv.fr/en/web/france-visas/'],
  germany: ['German Missions in the UAE', 'https://uae.diplo.de/ae-en'],
  videx: ['VIDEX, the German visa application form', 'https://videx.diplo.de/'],
  italy: ['Visto per Italia, Italian Ministry of Foreign Affairs', 'https://vistoperitalia.esteri.it/home.aspx'],
  greece: ['Greek Ministry of Foreign Affairs, visas', 'https://www.mfa.gr/en/visas/'],
  nl: ['Netherlands Worldwide, visa for the Netherlands', 'https://www.netherlandsworldwide.nl/visa-the-netherlands'],
  swiss: ['Swiss State Secretariat for Migration, entry', 'https://www.sem.admin.ch/sem/en/home/themen/einreise.html'],
  bls: ['BLS International Spain, UAE', 'https://uae.blsspainvisa.com/'],
  uk: ['UK Government, Standard Visitor visa', 'https://www.gov.uk/standard-visitor'],
  us: ['US Department of State, visitor visas', 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html'],
  au: ['Australian Department of Home Affairs, Visitor visa subclass 600', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600'],
  cn: ['Chinese Visa Application Service Centre', 'https://www.visaforchina.cn/'],
  in: ['Indian e-Visa, Government of India', 'https://indianvisaonline.gov.in/evisa/tvoa.html'],
  my: ['Malaysia eVISA, Immigration Department', 'https://malaysiavisa.imi.gov.my/evisa/evisa.jsp'],
  kr: ['Korea Visa Portal, Republic of Korea', 'https://www.visa.go.kr/'],
  vn: ['Vietnam National e-Visa Portal', 'https://evisa.gov.vn/'],
};

const SCHENGEN = ['ec', 'code'];
const MAP = {
  'are-dummy-tickets-legal-what-uae-visa-applicants-should-know': ['code', 'ec'],
  'australia-visitor-visa-from-uae-subclass-600-explained': ['au'],
  'bls-international-uae-schengen-visa-application-guide': ['bls', 'ec'],
  'china-visa-from-uae-tourist-visa-application-process': ['cn'],
  'dummy-ticket-providers-compared-what-to-look-for-before-you-buy': ['code'],
  'dummy-ticket-vs-real-flight-booking-which-one-does-your-visa-need': ['code'],
  'france-visa-from-uae-application-process-documents-and-tips': ['france', 'ec'],
  'germany-visa-from-uae-step-by-step-application-guide': ['germany', 'videx'],
  'greece-visa-from-uae-how-to-apply-and-what-to-expect': ['greece', 'ec'],
  'how-long-does-a-schengen-visa-take-to-process-from-dubai': ['code', 'ec'],
  'how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide': ['ec', 'fee'],
  'india-visa-from-uae-e-visa-vs-sticker-visa-explained': ['in'],
  'italy-visa-from-uae-requirements-and-application-process': ['italy', 'ec'],
  'malaysia-visa-from-uae-requirements-for-uae-residents': ['my'],
  'netherlands-visa-from-uae-documents-and-process-explained': ['nl', 'ec'],
  'pnr-codes-explained-what-they-are-and-how-visa-officers-verify-them': ['code'],
  'proof-of-accommodation-for-schengen-visa-what-uae-applicants-need': ['code', 'ec'],
  'proof-of-onward-travel-for-schengen-visa-why-dummy-tickets-work': ['code'],
  'schengen-visa-documents-checklist-for-uae-residents': SCHENGEN,
  'schengen-visa-for-first-time-applicants-how-to-prove-strong-ties-to-the-uae': SCHENGEN,
  'schengen-visa-interview-questions-how-to-prepare-from-the-uae': SCHENGEN,
  'schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them': SCHENGEN,
  'single-entry-vs-multiple-entry-schengen-visa-which-one-should-you-get': SCHENGEN,
  'south-korea-visa-from-uae-documents-and-application-tips': ['kr'],
  'switzerland-visa-from-uae-requirements-for-schengen-applicants': ['swiss', 'ec'],
  'uk-visa-from-uae-standard-visitor-visa-application-guide': ['uk'],
  'usa-b1b2-visa-from-uae-complete-application-guide': ['us'],
  'usa-visa-interview-at-the-dubai-embassy-questions-and-tips': ['us'],
  'vietnam-visa-from-uae-e-visa-and-visa-on-arrival-guide': ['vn'],
  'what-is-a-dummy-ticket-and-when-do-you-need-one': ['code'],
  'what-to-do-if-your-schengen-visa-is-delayed-past-your-travel-date': ['code', 'ec'],
  'why-buying-a-real-ticket-before-your-visa-is-approved-is-a-risky-move': ['code'],
};

const block = (keys) => {
  const items = keys.map((k) => {
    const [label, href] = A[k];
    return `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
  }).join('\n');
  return `\n<div ${MARKER}>\n<h2>Sources</h2>\n<p>The rules described here are set by the authorities below. Fees, processing times and document requirements change without much notice, so confirm the detail that matters to you on the official page before you apply.</p>\n<ul>\n${items}\n</ul>\n</div>`;
};

const strip = (html) => String(html).replace(new RegExp(`\\n?<div ${MARKER}>[\\s\\S]*?<\\/div>`, 'g'), '');

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') { await mongoose.disconnect(); throw new Error(`Expected visawadi, got "${conn.db.databaseName}"`); }
const blogs = conn.db.collection('blogs');

console.log(`=== ${REMOVE ? 'REMOVE' : 'ADD'} ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
let n = 0, missing = 0;
for (const [slug, keys] of Object.entries(MAP)) {
  const b = await blogs.findOne({ slug });
  if (!b) { console.log(`  ${slug}: NOT FOUND`); missing++; continue; }
  const base = strip(b.content);
  const next = REMOVE ? base : base + block(keys);
  if (next === String(b.content)) { console.log(`  ${slug.slice(0, 58).padEnd(58)} unchanged`); continue; }
  n++;
  console.log(`  ${slug.slice(0, 58).padEnd(58)} ${keys.join(' + ')}`);
  if (APPLY) await blogs.updateOne({ _id: b._id }, { $set: { content: next } });
}

console.log(`\n  posts ${REMOVE ? 'stripped' : 'updated'}: ${n}  | not found: ${missing}`);
const all = await blogs.find({ status: 'published' }).toArray();
const cited = all.filter((b) => [...String(b.content).matchAll(/href="(https?:\/\/[^"]+)"/g)]
  .some((m) => /\.gov|\.gouv|europa\.eu|gov\.uk|vfsglobal|blsinternational|diplo\.de|mfa\.|blsspainvisa|esteri\.it|sem\.admin\.ch|netherlandsworldwide|homeaffairs|visaforchina|indianvisaonline|imi\.gov\.my|visa\.go\.kr|evisa\.gov\.vn/.test(m[1]))).length;
console.log(`  published posts citing an official authority: ${cited} / ${all.length}`);
console.log(APPLY ? '\napplied.' : '\nnothing written.');
await mongoose.disconnect();
