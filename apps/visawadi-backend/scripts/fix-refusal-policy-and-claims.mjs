/**
 * Three content corrections across the visa pages, from the 12/09/2026 UX audit:
 *
 * 1. Refusal policy. Pages promised a free resubmission on Concierge. The real
 *    policy: the service fee covers the work, approval is never guaranteed, and
 *    we help dispute a refusal only where the embassy offers that route. Saudi
 *    is the one exception (full refund on rejection) and is left untouched.
 * 2. VFS/BLS fee. One page said AED 95, another AED 146.74. The real charge is
 *    AED 110 to 150 depending on the country and centre, so show the range.
 * 3. Unsourced trust claims in whyUs ("3-minute response time", "Licensed Dubai
 *    office") replaced or removed, plus the Schengen hero sub-line rewrite.
 *
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/fix-refusal-policy-and-claims.mjs          # dry run
 *   node --env-file=.env.production scripts/fix-refusal-policy-and-claims.mjs --apply
 */

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const SCHENGEN = ['schengen', 'france-visa', 'germany-visa', 'italy-visa', 'spain-visa', 'greece-visa'];
const NO_GUARANTEE = [...SCHENGEN, 'united-kingdom', 'usa', 'canada'];

const centreFor = (slug) => (slug === 'spain-visa' ? 'BLS' : 'VFS');
const centreName = (c) => (c === 'BLS' ? 'BLS International' : 'VFS Global');

const RESUBMISSION_RE = /Concierge package includes a free resubmission[^.]*\.\s*(Basic and Standard clients[^.]*\.)?/i;

function refusalAnswer(slug, existing) {
  const feesSentence = existing.split(/(?<=\.)\s/)[0];
  const isSchengen = SCHENGEN.includes(slug);
  const dispute = isSchengen
    ? 'Every Schengen refusal comes with a written notice and a right to appeal or remonstrate with the consulate. If that route is open we prepare the appeal for you.'
    : slug === 'united-kingdom'
      ? 'Standard Visitor refusals carry no right of appeal, so the route back is a fresh application.'
      : slug === 'usa'
        ? 'There is no appeal against a 214(b) refusal, so the route back is a fresh application and interview.'
        : 'Visitor visa refusals cannot be appealed, though a reconsideration request is sometimes possible and we file it where it is.';
  return `${feesSentence} Our fee covers the work of preparing and filing your application, and no provider can guarantee the decision. ${dispute} Whatever the route, you get a written analysis of the refusal grounds and the specific changes the next file has to make.`;
}

const UK_APPEAL_ANSWER =
  'In most cases, Standard Visitor Visa refusals carry no formal right of appeal. You can reapply immediately with a stronger file that directly addresses the stated refusal reasons. That is why a professional analysis of the refusal notice matters: we review the grounds with you and rebuild the file before it goes back in.';

const SCHENGEN_HERO =
  'Most Schengen refusals are preventable document errors. We build your file, check every page against current embassy requirements, and book your VFS appointment. Packages from AED 299, with embassy and VFS fees shown separately and never marked up.';

const GERMANY_HERO_FROM = 'VFS Global charges AED 146.74 on top in Dubai and Abu Dhabi';
const GERMANY_HERO_TO = 'VFS Global charges AED 110 to 150 on top depending on the centre';

const WHYUS_RESPONSE = {
  title: 'Average response time 10 minutes',
  description: 'Send us a WhatsApp or email and you will hear back in about ten minutes on average during business hours, and within an hour outside them.',
};

await mongoose.connect(process.env.MONGO_URI);
const conn = mongoose.connection;
if (conn.db.databaseName !== 'visawadi') {
  await mongoose.disconnect();
  throw new Error(`Expected the visawadi database, got "${conn.db.databaseName}"`);
}

console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');

for (const coll of ['visas', 'visa-overlays']) {
  const c = conn.db.collection(coll);
  for (const d of await c.find({}).toArray()) {
    const slug = d.slug || d.visaSlug;
    if (!NO_GUARANTEE.includes(slug)) continue;
    const centre = centreFor(slug);
    const $set = {};
    const changes = [];

    if (Array.isArray(d.faqs)) {
      const faqs = d.faqs.map((f) => {
        if (RESUBMISSION_RE.test(f.answer || '')) {
          changes.push(`faq: ${f.question}`);
          return { ...f, answer: refusalAnswer(slug, f.answer) };
        }
        if (slug === 'united-kingdom' && /free resubmission/i.test(f.answer || '')) {
          changes.push(`faq: ${f.question}`);
          return { ...f, answer: UK_APPEAL_ANSWER };
        }
        return f;
      });
      if (changes.some((x) => x.startsWith('faq'))) $set.faqs = faqs;
    }

    if (Array.isArray(d.packages)) {
      let touched = false;
      const packages = d.packages.map((p) => {
        const features = (p.features || []).filter((x) => !/free resubmission/i.test(x));
        const exclusions = (p.exclusions || []).map((x) =>
          x.replace(/\((AED\s*)?~?\s*95\)/i, '(AED 110 to 150)'),
        );
        if (features.length !== (p.features || []).length) { touched = true; changes.push(`package ${p.name}: dropped resubmission feature`); }
        if (exclusions.some((x, i) => x !== (p.exclusions || [])[i])) { touched = true; changes.push(`package ${p.name}: fee range`); }
        return { ...p, features, exclusions };
      });
      if (touched) $set.packages = packages;
    }

    if (Array.isArray(d.pricingBreakdown) && SCHENGEN.includes(slug)) {
      let touched = false;
      const pricingBreakdown = d.pricingBreakdown.map((r) => {
        if (!new RegExp(`\\b${centre}\\b`, 'i').test(r.item || '')) return r;
        const note = `AED 110 to 150 depending on the country and centre; the low end is shown. Included in the Standard and Concierge packages, payable on top of Basic only. Set by ${centreName(centre)} and can change without notice.`;
        if (r.amount === 110 && r.note === note) return r;
        touched = true;
        return { ...r, amount: 110, note };
      });
      if (touched) { $set.pricingBreakdown = pricingBreakdown; changes.push('pricing: centre fee range'); }
    }

    if (typeof d.heroSubheadline === 'string') {
      if (slug === 'schengen' && d.heroSubheadline !== SCHENGEN_HERO) {
        $set.heroSubheadline = SCHENGEN_HERO; changes.push('hero sub-line');
      }
      if (slug === 'germany-visa' && d.heroSubheadline.includes(GERMANY_HERO_FROM)) {
        $set.heroSubheadline = d.heroSubheadline.replace(GERMANY_HERO_FROM, GERMANY_HERO_TO); changes.push('hero sub-line');
      }
    }

    if (Array.isArray(d.whyUs)) {
      let touched = false;
      const whyUs = d.whyUs
        .filter((w) => { const drop = /licensed dubai office/i.test(w.title || ''); if (drop) touched = true; return !drop; })
        .map((w) => {
          if (!/3[- ]minute response/i.test(w.title || '')) return w;
          touched = true;
          return { ...w, ...WHYUS_RESPONSE };
        });
      if (touched) { $set.whyUs = whyUs; changes.push('whyUs claims'); }
    }

    if (!changes.length) continue;
    console.log(`  ${coll}/${slug}`);
    for (const ch of changes) console.log(`    - ${ch}`);
    if (APPLY) await c.updateOne({ _id: d._id }, { $set });
  }
}

console.log('\n=== verification ===');
for (const d of await conn.db.collection('visas').find({ slug: { $in: NO_GUARANTEE } }).sort({ slug: 1 }).toArray()) {
  const resub = JSON.stringify(d).match(/free resubmission/gi)?.length || 0;
  const bad = JSON.stringify(d.whyUs || []).match(/3-minute|licensed dubai/gi)?.length || 0;
  const vfs = (d.pricingBreakdown || []).find((r) => /vfs|bls/i.test(r.item))?.amount;
  console.log(`  ${d.slug.padEnd(15)} resubmission=${resub} badClaims=${bad} centreFee=${vfs ?? '-'}`);
}

await mongoose.disconnect();
