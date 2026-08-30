import { fileURLToPath } from 'node:url'; import { dirname, resolve } from 'node:path'; import dotenv from 'dotenv';
import { connectMongo, Order, QUEUE_NAMES, createRedisConnection, createStorage } from '@picturesk/shared';
import { Queue } from 'bullmq';
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), `../../../.env.${process.env.NODE_ENV || 'development'}`) });

const IDS = ['6a58ceb170e7e5def57be254', '6a58ce9870e7e5def57be24b'];

await connectMongo(process.env.MONGODB_URI);
const connection = createRedisConnection(process.env.REDIS_URL);
const orderPipeline = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection });
const storage = createStorage(); // reads R2_* from env (loaded above)

for (const orderId of IDS) {
  const order = await Order.findById(orderId).lean();
  if (!order) { console.log(`${orderId}  NOT FOUND (already gone)`); continue; }
  if (order.customerEmail !== 'ammar.afridi95@gmail.com') {
    console.log(`${orderId}  SKIPPED — not your test order (email=${order.customerEmail})`); continue;
  }
  // 1) remove any queued/active job so the worker never touches a deleted order
  await orderPipeline.remove(orderId).catch(() => {});
  // 2) delete the R2 objects WE own (Replicate-hosted generations -> keyForUrl null -> skipped)
  const urls = [
    ...(order.uploadedImageUrls ?? []),
    ...(order.resultImageUrls ?? []),
    ...(order.deliveredImageUrls ?? []),
    ...(order.swappedImageUrls ?? []),
    ...(order.enhancedImageUrls ?? []),
  ];
  const keys = urls.map((u) => storage.keyForUrl(u)).filter(Boolean);
  keys.push(`training/${orderId}.zip`);
  const r2 = await storage.deleteObjects(keys);
  // 3) hard-delete the order doc
  await Order.deleteOne({ _id: orderId });
  console.log(`${orderId}  DELETED  status=${order.status} tier=${order.tier}  r2Deleted=${r2.deleted} r2Failed=${r2.failed}`);
}

// confirm none remain ongoing
const { ORDER_STATES } = await import('@picturesk/shared');
const stillOngoing = await Order.countDocuments({ status: { $in: [ORDER_STATES.AWAITING_PAYMENT, ORDER_STATES.PAID, ORDER_STATES.TRAINING, ORDER_STATES.GENERATING] } });
console.log(`\nremaining ongoing orders in DB: ${stillOngoing}`);
await orderPipeline.close(); connection.disconnect(); process.exit(0);
