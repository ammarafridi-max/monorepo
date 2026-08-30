import { connectMongo, Order } from '@travel-suite/picturesk-shared';
await connectMongo(process.env.MONGODB_URI);
const id = process.argv[2];
const o = await Order.findById(id).lean();
console.log('=== target order', id, '===');
console.log(JSON.stringify({
  status:o.status, tier:o.tier,
  deliverCount:o.deliverCount, generateCount:o.generateCount,   // <-- the stored tier snapshot
  candidates:(o.resultImageUrls||[]).length,
  candidateScores:(o.candidateScores||[]).length,
  delivered:(o.deliveredImageUrls||[]).length,
  createdAt:o.createdAt, updatedAt:o.updatedAt,
},null,2));
console.log('\n=== 6 most recent orders (tier snapshot vs actual counts) ===');
const recent = await Order.find({}).sort({createdAt:-1}).limit(6).lean();
for (const r of recent) {
  console.log(`${r._id}  ${String(r.status).padEnd(12)} tier=${r.tier||'-'} snap(gen/del)=${r.generateCount ?? '·'}/${r.deliverCount ?? '·'}  actual(cand/scored/deliv)=${(r.resultImageUrls||[]).length}/${(r.candidateScores||[]).length}/${(r.deliveredImageUrls||[]).length}  created=${r.createdAt?.toISOString?.().slice(5,16)}`);
}
process.exit(0);
