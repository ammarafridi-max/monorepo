import { fileURLToPath } from 'node:url'; import { dirname, resolve } from 'node:path'; import dotenv from 'dotenv';
import { connectMongo, Order, QUEUE_NAMES, createRedisConnection } from '@picturesk/shared';
import { Queue } from 'bullmq';
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), `../../../.env.${process.env.NODE_ENV || 'development'}`) });
await connectMongo(process.env.MONGODB_URI);
const id = process.argv[2];
const o = await Order.findById(id).lean();
console.log('candidates:', (o.resultImageUrls||[]).length, 'candidateScores:', (o.candidateScores||[]).length, 'delivered:', (o.deliveredImageUrls||[]).length, 'computeCostCents:', o.computeCostCents);
console.log('FACE_EMBED set (culling on)?', Boolean(process.env.REPLICATE_FACE_EMBED_MODEL));
const conn = createRedisConnection(process.env.REDIS_URL);
const q = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection: conn });
console.log('queue counts:', JSON.stringify(await q.getJobCounts('active','waiting','delayed','failed','completed')));
for (const s of ['active','failed']) {
  const jobs = await q.getJobs([s]);
  for (const j of jobs.filter(j=>j.data?.orderId===id||j.id===id))
    console.log(`${s}: attemptsMade=${j.attemptsMade} processedOn=${j.processedOn?new Date(j.processedOn).toISOString():null} failedReason=${(j.failedReason||'').slice(0,140)}`);
}
await q.close(); conn.disconnect(); process.exit(0);
