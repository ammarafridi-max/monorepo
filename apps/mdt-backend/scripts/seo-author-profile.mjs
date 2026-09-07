// Usage: node --env-file=.env.production scripts/seo-author-profile.mjs [--apply]
//
// Gives the blog byline something to resolve to. Without a slug the author is
// an inline name string in BlogPosting schema, which is not an E-E-A-T signal.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');
const AUTHOR_ID = '69ccdc3192e3beae8d59804f';

const PROFILE = {
  slug: 'ammar-afridi',
  jobTitle: 'Marketing Executive',
  bio: [
    'Ammar Afridi has spent four years preparing travel and visa documentation for UAE residents, working on Schengen, UK, US and Canada files and handling more than 2,000 applications.',
    'Most of the problems he sees are avoidable: a reservation that expires before the consulate opens the file, a PNR that was never in a GDS, travel dates that do not match the rest of the application. He writes about what embassies, airlines and immigration officers actually check, in the order they check it.',
    'He is based in Dubai and reviews the reservations My Dummy Ticket issues.',
  ].join('\n\n'),
  credentials: [
    'Marketing Executive at My Dummy Ticket, Dubai',
    'Four years preparing visa and travel documentation for UAE residents',
    'More than 2,000 visa applications handled',
    'Schengen, UK, US and Canada files, plus Schengen travel insurance',
  ],
  expertise: [
    'Dummy tickets and flight reservations',
    'Proof of onward travel',
    'GDS and PNR verification',
    'Schengen visas',
    'Schengen travel insurance',
    'Visa refusals',
  ],
  sameAs: [
    'https://www.instagram.com/a.afridi56',
    'https://www.linkedin.com/in/ammar-afridi',
  ],
  avatarUrl: '',
};

await mongoose.connect(process.env.MONGO_URI);
const users = mongoose.connection.collection('admin-users');
const _id = new mongoose.Types.ObjectId(AUTHOR_ID);

const before = await users.findOne({ _id }, { projection: { password: 0 } });
if (!before) { console.error('author not found'); await mongoose.disconnect(); process.exit(1); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = join(__dirname, `seo-author-backup-${stamp}.json`);
writeFileSync(backup, JSON.stringify(before, null, 2));

const clash = await users.countDocuments({ 'authorProfile.slug': PROFILE.slug, _id: { $ne: _id } });
console.log(`target      : ${before.name} (${before.role})`);
console.log(`before      : ${JSON.stringify(before.authorProfile ?? '(absent)')}`);
console.log(`slug unique : ${clash === 0 ? 'yes' : `NO (${clash} clashes)`}`);
console.log(`backup      : ${backup}`);
if (clash > 0) { console.error('slug not unique, aborting'); await mongoose.disconnect(); process.exit(1); }

if (!APPLY) { console.log('\nDRY RUN. Re-run with --apply to write.'); await mongoose.disconnect(); process.exit(0); }

const r = await users.updateOne({ _id }, { $set: { authorProfile: PROFILE, updatedAt: new Date() } });
console.log(`\nwritten: matched ${r.matchedCount}, modified ${r.modifiedCount}`);
await mongoose.disconnect();
