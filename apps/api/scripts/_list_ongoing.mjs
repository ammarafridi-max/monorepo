import { fileURLToPath } from 'node:url'; import { dirname, resolve } from 'node:path'; import dotenv from 'dotenv';
import { connectMongo, Order, ORDER_STATES } from '@picturesk/shared';
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), `../../../.env.${process.env.NODE_ENV || 'development'}`) });
await connectMongo(process.env.MONGODB_URI);
const ongoing = [ORDER_STATES.AWAITING_PAYMENT, ORDER_STATES.PAID, ORDER_STATES.TRAINING, ORDER_STATES.GENERATING];
const orders = await Order.find({ status: { $in: ongoing } }).sort({ createdAt: -1 }).lean();
const now = Date.now();
const mins = (d) => d ? Math.round((now - new Date(d))/60000) : null;
console.log(`ONGOING orders (non-terminal): ${orders.length}\n`);
const byStatus = {};
for (const o of orders) byStatus[o.status] = (byStatus[o.status]||0)+1;
console.log('by status:', JSON.stringify(byStatus), '\n');
for (const o of orders) {
  console.log(`${o._id}  ${o.status.padEnd(16)} age=${mins(o.createdAt)}m  paid=${o.paidAt?'yes':'no'}  tier=${o.tier||'-'}  email=${o.customerEmail}  trainingId=${o.replicate?.trainingId||'-'}`);
}
process.exit(0);
