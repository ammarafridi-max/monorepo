/**
 * Usage, from apps/visawadi-backend:
 *   node --env-file=.env.production scripts/migrate-blog-from-travl.mjs          # dry run + diff report
 *   node --env-file=.env.production scripts/migrate-blog-from-travl.mjs --apply
 *
 * Cover images are copied, never renamed: a Cloudinary rename would 404 Travl's
 * own posts. Rollback is deleting these _ids from the visawadi database.
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

const APPLY = process.argv.includes('--apply');
const TRAVL_API = 'https://api.travl.ae';
const TRAVL_SITE = 'https://www.travl.ae';
const VISAWADI_ADMIN_ID = '6a78c1d960de0e013f68b097';
const OUT_DIR = path.join(process.cwd(), 'migration-output');

const MOVING_UNPUBLISHED = [
  'what-is-a-dummy-ticket-and-when-do-you-need-one',
  'dummy-ticket-vs-real-flight-booking-which-one-does-your-visa-need',
  'are-dummy-tickets-legal-what-uae-visa-applicants-should-know',
  'what-to-do-if-your-schengen-visa-is-delayed-past-your-travel-date',
  'dummy-ticket-providers-compared-what-to-look-for-before-you-buy',
];

const EXTRA_SOURCE = path.join(process.cwd(), 'migration-output', 'travl-unpublished-export.json');

const MOVING = [
  'schengen-visa-fees-in-2026-complete-cost-breakdown-for-uae-applicants',
  'how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide',
  'how-long-does-a-schengen-visa-take-to-process-from-dubai',
  'schengen-visa-documents-checklist-for-uae-residents',
  'schengen-visa-rejection-top-10-reasons-and-how-to-avoid-them',
  'schengen-visa-bank-statement-requirements-for-uae-residents',
  'schengen-visa-interview-questions-how-to-prepare-from-the-uae',
  'single-entry-vs-multiple-entry-schengen-visa-which-one-should-you-get',
  'schengen-visa-for-first-time-applicants-how-to-prove-strong-ties-to-the-uae',
  'proof-of-accommodation-for-schengen-visa-what-uae-applicants-need',
  'proof-of-onward-travel-for-schengen-visa-why-dummy-tickets-work',
  'vfs-global-dubai-booking-appointments-and-what-to-expect',
  'bls-international-uae-schengen-visa-application-guide',
  'france-visa-from-uae-application-process-documents-and-tips',
  'germany-visa-from-uae-step-by-step-application-guide',
  'italy-visa-from-uae-requirements-and-application-process',
  'netherlands-visa-from-uae-documents-and-process-explained',
  'switzerland-visa-from-uae-requirements-for-schengen-applicants',
  'greece-visa-from-uae-how-to-apply-and-what-to-expect',
  'uk-visa-from-uae-standard-visitor-visa-application-guide',
  'usa-b1b2-visa-from-uae-complete-application-guide',
  'usa-visa-interview-at-the-dubai-embassy-questions-and-tips',
  'australia-visitor-visa-from-uae-subclass-600-explained',
  'china-visa-from-uae-tourist-visa-application-process',
  'india-visa-from-uae-e-visa-vs-sticker-visa-explained',
  'vietnam-visa-from-uae-e-visa-and-visa-on-arrival-guide',
  'malaysia-visa-from-uae-requirements-for-uae-residents',
  'south-korea-visa-from-uae-documents-and-application-tips',
  'why-buying-a-real-ticket-before-your-visa-is-approved-is-a-risky-move',
  'pnr-codes-explained-what-they-are-and-how-visa-officers-verify-them',
];
const MOVING_SET = new Set([...MOVING, ...MOVING_UNPUBLISHED]);

const INSURANCE_NOTE =
  '<p><em>Travel insurance through Travl is available to UAE residents and citizens.</em></p>';

const required = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(', ')}. Run with --env-file=.env.production`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});


async function apiGet(pathname) {
  const res = await fetch(`${TRAVL_API}${pathname}`);
  if (!res.ok) throw new Error(`GET ${pathname} -> ${res.status}`);
  return res.json();
}

function unwrap(payload, key) {
  return payload?.data?.[key] ?? payload?.data ?? payload;
}

function publicIdFromUrl(url) {
  const m = String(url).match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return m ? m[1].replace(/\.[a-z0-9]+$/i, '') : null;
}

async function resourceExists(publicId) {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch (err) {
    if (err?.error?.http_code === 404 || err?.http_code === 404) return false;
    throw err;
  }
}

function splitBlocks(html) {
  return String(html).split(/(<\/(?:p|li|h[1-6]|td|th|blockquote|div)>)/i).filter((s) => s !== '');
}

function sentenceAround(text, idx) {
  const before = text.slice(0, idx);
  const after = text.slice(idx);
  let start = 0;
  for (const m of before.matchAll(/[.!?]\s|[<>]/g)) start = m.index + m[0].length;
  const endM = after.match(/[.!?]\s|[<>]/);
  const end = idx + (endM ? endM.index + endM[0].length : after.length);
  return text.slice(start, end);
}

function rewriteBrand(s, stats) {
  s = s.replace(/\bTravl(?='s)?(?=\s+(?:FAQ|blog)\b)/g, () => { stats.brand++; return 'VisaWadi'; });

  return s.replace(/\bTravl\b/g, (m, idx) => {
    if (/insuranc/i.test(sentenceAround(s, idx))) { stats.brandKept++; return m; }
    stats.brand++;
    return 'VisaWadi';
  });
}

function rewriteField(value, { isHtml }) {
  if (typeof value !== 'string' || !value) return { value, stats: {} };

  const stats = { blogRel: 0, visaRel: 0, faqRel: 0, insuranceKept: 0, blogKept: 0, brand: 0, brandKept: 0, unhandled: [] };

  const rewriteLinks = (s) => {
    s = s.replace(/href="(?:\.\.\/)+([^"]*)"/g, (_m, rest) => {
      stats.relNormalised = (stats.relNormalised || 0) + 1;
      return `href="${TRAVL_SITE}/${rest}"`;
    });
    s = s.replace(new RegExp(`${TRAVL_SITE}/travel-itinerary`, 'gi'), () => {
      stats.itineraryKept = (stats.itineraryKept || 0) + 1;
      return `${TRAVL_SITE}/travel-itinerary`;
    });
    s = s.replace(new RegExp(`${TRAVL_SITE}/blog/([a-z0-9-]+)`, 'gi'), (full, slug) => {
      if (MOVING_SET.has(slug)) { stats.blogRel++; return `/blog/${slug}`; }
      stats.blogKept++; return full;
    });
    s = s.replace(new RegExp(`${TRAVL_SITE}/visa(/[a-z0-9-]+)?`, 'gi'), (_full, rest) => {
      stats.visaRel++; return `/visa${rest || ''}`;
    });
    s = s.replace(new RegExp(`${TRAVL_SITE}/faq`, 'gi'), () => { stats.faqRel++; return '/faq'; });
    s = s.replace(new RegExp(`${TRAVL_SITE}/contact`, 'gi'), () => {
      stats.contactRel = (stats.contactRel || 0) + 1;
      return '/contact';
    });
    const claims = s.match(new RegExp(`${TRAVL_SITE}/claims`, 'gi'));
    if (claims) stats.claimsKept = (stats.claimsKept || 0) + claims.length;
    s = s.replace(/info@travl\.ae/gi, () => {
      stats.emailSwapped = (stats.emailSwapped || 0) + 1;
      return 'info@visawadi.com';
    });
    const insuranceHits = s.match(new RegExp(`${TRAVL_SITE}/travel-insurance`, 'gi'));
    if (insuranceHits) stats.insuranceKept += insuranceHits.length;
    for (const m of s.matchAll(new RegExp(`${TRAVL_SITE}(/[^"'\\s)<]*)?`, 'gi'))) {
      const p = m[1] || '/';
      if (!/^\/(travel-insurance|travel-itinerary|claims|blog)/i.test(p)) stats.unhandled.push(p);
    }
    return s;
  };

  const applyBrand = (s) => rewriteBrand(s, stats);

  let out;
  if (isHtml) {
    out = splitBlocks(value).map((chunk) => applyBrand(rewriteLinks(chunk))).join('');
    if (stats.insuranceKept > 0 && !/UAE residents and citizens/i.test(out)) {
      const blocks = splitBlocks(out);
      let injected = false;
      out = blocks
        .map((chunk, i) => {
          if (injected || !/travl\.ae\/travel-insurance/i.test(chunk)) return chunk;
          injected = true;
          const closer = blocks[i + 1] && /^<\//.test(blocks[i + 1]) ? '' : '';
          return chunk + closer;
        })
        .join('');
      const at = out.search(/<\/(p|li|ul|ol|blockquote)>/i);
      const anchor = out.toLowerCase().indexOf('travl.ae/travel-insurance');
      const closeAfter = out.indexOf('</p>', anchor);
      if (closeAfter !== -1) out = out.slice(0, closeAfter + 4) + INSURANCE_NOTE + out.slice(closeAfter + 4);
      else if (at !== -1) out = out + INSURANCE_NOTE;
    }
  } else {
    out = applyBrand(rewriteLinks(value));
  }

  return { value: out, stats };
}

function mergeStats(target, add) {
  for (const [k, v] of Object.entries(add || {})) {
    if (Array.isArray(v)) target[k] = (target[k] || []).concat(v);
    else target[k] = (target[k] || 0) + v;
  }
}

function transformPost(src) {
  const stats = {};
  const out = { ...src };

  for (const field of ['title', 'excerpt', 'quickAnswer', 'metaTitle', 'metaDescription']) {
    const r = rewriteField(src[field], { isHtml: false });
    out[field] = r.value;
    mergeStats(stats, r.stats);
  }
  const c = rewriteField(src.content, { isHtml: true });
  out.content = c.value;
  mergeStats(stats, c.stats);

  out.faqs = (src.faqs || []).map((f) => {
    const q = rewriteField(f.question, { isHtml: false });
    const a = rewriteField(f.answer, { isHtml: false });
    mergeStats(stats, q.stats);
    mergeStats(stats, a.stats);
    return { ...f, question: q.value, answer: a.value };
  });

  out.author = new mongoose.Types.ObjectId(VISAWADI_ADMIN_ID);
  out.publisher = new mongoose.Types.ObjectId(VISAWADI_ADMIN_ID);
  out.status = 'draft';
  delete out.id;
  delete out.__v;
  out._id = new mongoose.Types.ObjectId(String(src._id));
  for (const d of ['publishedAt', 'createdAt', 'updatedAt']) {
    if (src[d]) out[d] = new Date(src[d]);
  }
  delete out.scheduledAt;

  return { doc: out, stats };
}


async function main() {
  console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to execute) ===');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('\nreading source from Travl public API…');
  const blogPayload = await apiGet('/api/blogs?page=1&limit=200&status=published');
  const allPosts = unwrap(blogPayload, 'blogs');
  const source = allPosts.filter((b) => MOVING_SET.has(b.slug));

  const notFound = MOVING.filter((s) => !allPosts.some((b) => b.slug === s));
  if (notFound.length) throw new Error(`Not found on Travl: ${notFound.join(', ')}`);
  if (source.length !== MOVING.length) throw new Error(`Expected ${MOVING.length}, matched ${source.length}`);
  console.log(`  matched ${source.length}/${MOVING.length} posts`);

  if (fs.existsSync(EXTRA_SOURCE)) {
    const extra = JSON.parse(fs.readFileSync(EXTRA_SOURCE, 'utf8'));
    const wanted = extra.filter((p) => MOVING_UNPUBLISHED.includes(p.slug));
    const absent = MOVING_UNPUBLISHED.filter((s2) => !wanted.some((p) => p.slug === s2));
    if (absent.length) throw new Error(`Missing from export file: ${absent.join(', ')}`);
    source.push(...wanted);
    console.log(`  + ${wanted.length} unpublished posts from the Travl export`);
  } else if (MOVING_UNPUBLISHED.length) {
    throw new Error(`Export file not found: ${EXTRA_SOURCE}\n  Run apps/travl-backend/scripts/export-posts-for-visawadi.mjs first.`);
  }

  const tags = unwrap(await apiGet('/api/blog-tags'), 'tags');
  console.log(`  ${tags.length} blog tags`);

  const snapshotPath = path.join(OUT_DIR, 'source-snapshot.json');
  fs.writeFileSync(snapshotPath, JSON.stringify({ posts: source, tags }, null, 2));
  console.log(`  snapshot -> ${path.relative(process.cwd(), snapshotPath)}`);

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  if (db.databaseName !== 'visawadi') throw new Error(`Refusing to write to "${db.databaseName}"`);
  console.log(`  target database: ${db.databaseName}`);

  const tagCol = db.collection('blog-tags');
  let tagsWritten = 0;
  for (const t of tags) {
    const exists = await tagCol.findOne({ slug: t.slug });
    if (exists) continue;
    if (APPLY) {
      const doc = { ...t, _id: new mongoose.Types.ObjectId(String(t._id)) };
      delete doc.id; delete doc.__v;
      for (const d of ['createdAt', 'updatedAt']) if (doc[d]) doc[d] = new Date(doc[d]);
      await tagCol.insertOne(doc);
    }
    tagsWritten++;
  }
  console.log(`\ntags: ${tagsWritten} to create, ${tags.length - tagsWritten} already present`);

  const blogCol = db.collection('blogs');
  const report = [];
  const totals = {};
  let covers = 0, inserted = 0, skipped = 0;

  for (const src of source) {
    const { doc, stats } = transformPost(src);
    mergeStats(totals, stats);

    const already = await blogCol.findOne({ _id: doc._id });
    if (already) { skipped++; console.log(`  ${src.slug}: already migrated, skipping`); continue; }

    const oldId = publicIdFromUrl(src.coverImageUrl);
    if (oldId && oldId.startsWith('travl/')) {
      const newId = 'visawadi/' + oldId.slice('travl/'.length);
      if (await resourceExists(newId)) {
        doc.coverImageUrl = (await cloudinary.api.resource(newId)).secure_url;
      } else if (APPLY) {
        const up = await cloudinary.uploader.upload(src.coverImageUrl, {
          public_id: newId, overwrite: false, resource_type: 'image',
        });
        doc.coverImageUrl = up.secure_url;
        covers++;
      } else {
        doc.coverImageUrl = `[would copy] ${newId}`;
      }
    }

    if (APPLY) {
      if (!(await fetch(doc.coverImageUrl, { method: 'HEAD' })).ok) {
        throw new Error(`Cover image for ${src.slug} not fetchable; aborting before insert.`);
      }
      await blogCol.insertOne(doc);
      inserted++;
    }

    report.push({
      slug: src.slug,
      title: doc.title,
      stats,
      before: { content: src.content, title: src.title, metaDescription: src.metaDescription },
      after: { content: doc.content, title: doc.title, metaDescription: doc.metaDescription },
    });
    console.log(`  ${src.slug}: brand ${stats.brand || 0} replaced / ${stats.brandKept || 0} kept, links ${(stats.blogRel||0)+(stats.visaRel||0)+(stats.faqRel||0)} rewritten`);
  }

  const reportPath = path.join(OUT_DIR, 'diff-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n---- totals ----');
  console.log(`  brand mentions replaced (-> VisaWadi): ${totals.brand || 0}`);
  console.log(`  brand mentions kept (insurance context): ${totals.brandKept || 0}`);
  console.log(`  /blog links made relative:  ${totals.blogRel || 0}`);
  console.log(`  /visa links made relative:  ${totals.visaRel || 0}`);
  console.log(`  /faq links made relative:   ${totals.faqRel || 0}`);
  console.log(`  insurance links kept absolute: ${totals.insuranceKept || 0}`);
  console.log(`  /contact links made relative: ${totals.contactRel || 0}`);
  console.log(`  /claims links kept absolute:  ${totals.claimsKept || 0}`);
  console.log(`  travl.ae emails swapped:      ${totals.emailSwapped || 0}`);
  console.log(`  blog links kept absolute (staying on Travl): ${totals.blogKept || 0}`);
  const unhandled = [...new Set(totals.unhandled || [])];
  console.log(`  UNHANDLED travl.ae paths: ${unhandled.length}${unhandled.length ? ' -> ' + unhandled.slice(0, 10).join(', ') : ''}`);
  console.log(`\n  covers copied: ${covers} | posts inserted: ${inserted} | already present: ${skipped}`);
  console.log(`  diff report -> ${path.relative(process.cwd(), reportPath)}`);
  if (!APPLY) console.log('\nNothing was written. Review the diff, then re-run with --apply.');
  else console.log('\nPosts are drafts. Nothing is public until you flip status to published.');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\nFAILED:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
