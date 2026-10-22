// Usage: node --env-file=../../apps/<brand>-backend/.env.production scripts/migrate-reservation-files.mjs [--apply] [--folder mdt/dummy-tickets]
// Dry run by default. Re-uploads publicly readable reservation PDFs as authenticated assets,
// points the ticket at the new private file, and deletes the public copy.

import mongoose from 'mongoose';
import { createCloudinaryStorage } from '@travel-suite/cloudinary';

const APPLY = process.argv.includes('--apply');
const folderArg = process.argv.indexOf('--folder');
const FOLDER_OVERRIDE = folderArg !== -1 ? process.argv[folderArg + 1] : null;

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is not set; pass --env-file=<backend>/.env.production');
  process.exit(1);
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary credentials are missing from the env file');
  process.exit(1);
}

function publicIdFromUrl(url) {
  const match = String(url).match(/upload\/(?:v\d+\/)?(.+?)(\.[a-zA-Z0-9]+)?$/);
  return match?.[1] ?? null;
}

function folderFor(publicId, sessionId) {
  if (FOLDER_OVERRIDE) return FOLDER_OVERRIDE;
  const marker = `/${sessionId}/`;
  const at = publicId.indexOf(marker);
  return at === -1 ? null : publicId.slice(0, at);
}

const conn = await mongoose.createConnection(uri).asPromise();
const tickets = conn.db.collection('dummy-tickets');

const pending = await tickets
  .find({
    reservationUrl: { $ne: null },
    $or: [{ 'reservationFile.publicId': null }, { 'reservationFile.publicId': { $exists: false } }],
  })
  .project({ sessionId: 1, reservationUrl: 1 })
  .toArray();

console.log(`${conn.db.databaseName}: ${pending.length} public reservation file(s)${APPLY ? '' : '  (dry run)'}`);

let migrated = 0;
let failed = 0;

for (const ticket of pending) {
  const publicId = publicIdFromUrl(ticket.reservationUrl);
  const folder = publicId ? folderFor(publicId, ticket.sessionId) : null;

  if (!publicId || !folder) {
    console.log(`  SKIP  ${ticket.sessionId}  (cannot read a public id or folder from the url)`);
    failed++;
    continue;
  }

  if (!APPLY) {
    console.log(`  would move ${publicId}  ->  ${folder}/${ticket.sessionId}/reservation-file (authenticated)`);
    continue;
  }

  const storage = createCloudinaryStorage({ cloudName, apiKey, apiSecret, folder });

  try {
    const response = await fetch(ticket.reservationUrl);
    if (!response.ok) throw new Error(`download failed with ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    const saved = await storage.saveAuthenticatedFile(buffer, `${ticket.sessionId}/reservation-file`, {
      resourceType: 'image',
    });

    await tickets.updateOne(
      { _id: ticket._id },
      {
        $set: {
          reservationFile: {
            publicId: saved.publicId,
            format: saved.format || 'pdf',
            resourceType: saved.resourceType || 'image',
          },
          reservationUrl: null,
        },
      },
    );

    const removed = await storage.deleteImage(ticket.reservationUrl);
    console.log(`  ok    ${ticket.sessionId}${removed ? '' : '  (public copy left behind, delete it by hand)'}`);
    migrated++;
  } catch (err) {
    console.log(`  FAIL  ${ticket.sessionId}  ${err.message}`);
    failed++;
  }
}

if (APPLY) console.log(`\n${migrated} migrated, ${failed} failed.`);
else console.log(`\nRe-run with --apply to migrate. ${failed} would be skipped.`);

await conn.close();
