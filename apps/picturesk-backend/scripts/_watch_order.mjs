import { connectMongo, Order } from '@travel-suite/picturesk-shared';

await connectMongo(process.env.MONGODB_URI);
const ID = process.argv[2] || '6a6a2a0850ccf43b0c7b9227';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const start = Date.now();
const MAX = 45 * 60 * 1000; // stop watching after 45 min no matter what
let last = '';

while (true) {
  const o = await Order.findById(ID).lean();
  const st = o?.status || 'NOT_FOUND';
  const stamp = new Date().toISOString().slice(11, 19);
  if (st !== last) {
    console.log(`[${stamp}] ${ID} -> ${st}  cand=${(o?.resultImageUrls || []).length} deliv=${(o?.deliveredImageUrls || []).length}`);
    last = st;
  }
  if (st === 'DELIVERED' || st === 'FAILED' || st === 'NOT_FOUND') {
    console.log(`TERMINAL ${st}${o?.error ? ' error=' + JSON.stringify(o.error) : ''}`);
    process.exit(0);
  }
  if (Date.now() - start > MAX) {
    console.log(`WATCH_TIMEOUT still ${st} after 45m`);
    process.exit(0);
  }
  await sleep(120000); // poll every 2 min
}
