

import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set. Did you run with --env-file?');
  process.exit(1);
}

const TESTIMONIALS = [
  {
    name:        'Anjali R.',
    nationality: 'Indian',
    visaType:    'Schengen visa',
    quote:       'I was so worried after reading horror stories about Schengen rejections. Travl reviewed every single document and caught two errors in my bank statements before submission. Approved in 9 days for our Italy trip.',
    rating:      5,
    initials:    'AR',
    imageUrl:    '',
    isFeatured:  true,
  },
  {
    name:        'Mohammed Al-Farsi',
    nationality: 'Emirati',
    visaType:    'Schengen visa',
    quote:       'Second application — first one was rejected by another agent. Travl identified the exact problem with my previous file and fixed it. Got a 2-year multiple-entry Schengen on the reapplication.',
    rating:      5,
    initials:    'MA',
    imageUrl:    '',
    isFeatured:  true,
  },
  {
    name:        'Maria Santos',
    nationality: 'Filipino',
    visaType:    'Schengen visa',
    quote:       'As an OFW I was nervous about the financials. The team explained everything clearly, helped me structure the bank statement letter, and handled the VFS appointment booking. Spain trip was a dream.',
    rating:      5,
    initials:    'MS',
    imageUrl:    '',
    isFeatured:  true,
  },
  {
    name:        'Tariq Mahmoud',
    nationality: 'Egyptian',
    visaType:    'Schengen Express',
    quote:       'Used the Express service — needed the visa in under a week. Travl delivered. The WhatsApp support was genuinely real-time. Will use again for my next trip.',
    rating:      5,
    initials:    'TM',
    imageUrl:    '',
    isFeatured:  false,
  },
];

async function patch() {
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const redactedUri = MONGO_URI.replace(/:\/\/[^@]+@/, '://***@');
  console.log(`\n✅  Connected → ${redactedUri}`);

  const Visa = conn.model('Visa', VisaSchema);

  const result = await Visa.findOneAndUpdate(
    { slug: 'schengen' },
    { $set: { testimonials: TESTIMONIALS } },
    { new: true },
  );

  if (!result) {
    console.error('❌  Schengen visa not found (slug: "schengen"). Run seed:visas first.');
    await conn.close();
    process.exit(1);
  }

  console.log(`\n✅  Updated: "${result.countryName}" (${result.slug})`);
  console.log(`   Testimonials: ${result.testimonials.length} total`);
  console.log(`   Featured:     ${result.testimonials.filter((t) => t.isFeatured).length} (first 3 shown on page)\n`);

  await conn.close();
}

patch().catch((err) => {
  console.error('❌  Patch failed:', err.message);
  process.exit(1);
});
