import { fileURLToPath } from 'node:url'; import { dirname, resolve } from 'node:path'; import dotenv from 'dotenv';
import { connectMongo, Order } from '@picturesk/shared';
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), `../../../.env.${process.env.NODE_ENV || 'development'}`) });
await connectMongo(process.env.MONGODB_URI);
const id = process.argv[2];
// EXACTLY how the worker loads it: a Mongoose doc, NOT .lean()
const order = await Order.findById(id);
console.log('via findById (Mongoose doc, like the worker sees):');
console.log('  order.tier          =', order.tier);
console.log('  order.deliverCount  =', order.deliverCount);
console.log('  order.generateCount =', order.generateCount);
// replicate the current genCountFor logic
const cullingEnabled = Boolean(process.env.REPLICATE_FACE_EMBED_MODEL);
const factor = Number(process.env.OVERGENERATE_FACTOR) || 1.5;
const deliverCountFor = (o) => o?.deliverCount ?? 14;
const genCount = cullingEnabled ? Math.ceil(deliverCountFor(order) * factor) : (order?.generateCount ?? 14);
console.log('  REPLICATE_FACE_EMBED_MODEL set? =', cullingEnabled);
console.log('  => genCount the CURRENT code computes =', genCount, '(expect 38 for starter+culling)');
console.log('schema paths include tier fields? =', ['tier','deliverCount','generateCount'].filter(p=>Order.schema.paths[p]).join(','));
process.exit(0);
