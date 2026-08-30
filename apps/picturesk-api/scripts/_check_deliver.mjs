import { connectMongo, Order, QUEUE_NAMES, createRedisConnection } from '@travel-suite/picturesk-shared';
import { Queue } from 'bullmq';
const id = process.argv[2];
await connectMongo(process.env.MONGODB_URI);
const o = await Order.findById(id).lean();
console.log('=== delivery-stage progress ===');
console.log(JSON.stringify({
  status:o.status,
  candidates:(o.resultImageUrls||[]).length,
  candidateScores:(o.candidateScores||[]).length,
  swapped:(o.swappedImageUrls||[]).length,
  enhanced:(o.enhancedImageUrls||[]).length,
  persisted:(o.persistedImageUrls||[]).length,
  delivered:(o.deliveredImageUrls||[]).length,
  computeCostCents:o.computeCostCents,
  PERSIST_DELIVERED: process.env.PERSIST_DELIVERED ?? '(unset->on)',
  REDIS_URL: (process.env.REDIS_URL||'').replace(/:[^:@/]*@/,':***@'),
},null,2));
console.log('=== local BullMQ queue state ===');
try {
  const connection = createRedisConnection(process.env.REDIS_URL, process.env.REDIS_URL?.startsWith('rediss')?{tls:{}}:{});
  const q = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection });
  const counts = await q.getJobCounts('active','waiting','delayed','failed','completed');
  console.log('counts:', JSON.stringify(counts));
  for (const s of ['active','failed','waiting']) {
    const jobs = await q.getJobs([s]);
    const mine = jobs.filter(j=>j.data?.orderId===id || j.id===id);
    for (const j of mine) console.log(`${s}: id=${j.id} attemptsMade=${j.attemptsMade} processedOn=${j.processedOn?new Date(j.processedOn).toISOString():null} failedReason=${(j.failedReason||'').slice(0,160)}`);
  }
  await q.close(); connection.disconnect();
} catch(e){ console.log('queue check error:', e.message); }
process.exit(0);
