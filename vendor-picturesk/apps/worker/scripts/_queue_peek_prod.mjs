import { QUEUE_NAMES, createRedisConnection } from '@picturesk/shared';
import { Queue } from 'bullmq';
const connection = createRedisConnection(process.env.PROD_REDIS_URL, { tls: {} });
const q = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection });
const counts = await q.getJobCounts('active','waiting','delayed','failed','completed','paused');
console.log('PROD job counts:', JSON.stringify(counts));
for (const s of ['active','waiting','delayed','failed','completed']) {
  const jobs = await q.getJobs([s]);
  const rows = jobs.map(j=>({id:j.id, orderId:j.data?.orderId, attemptsMade:j.attemptsMade, processedOn:j.processedOn?new Date(j.processedOn).toISOString():null, reason:(j.failedReason||'').slice(0,140)}));
  if (rows.length) console.log(s.toUpperCase()+':', JSON.stringify(rows));
}
await q.close(); connection.disconnect(); process.exit(0);
