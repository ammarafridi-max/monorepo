import mongoose from 'mongoose';

/**
 * Connect Mongoose to MongoDB.
 *
 * This is the only runnable thing in Phase 0, and it does nothing but connect.
 * No models are registered here (importing orderModel.js registers the Order
 * model as a side effect) and no queries are run.
 *
 * @param {string} uri - the MongoDB connection string
 * @returns {Promise<typeof mongoose>} the connected mongoose instance
 */
export async function connectMongo(uri) {
  if (!uri) throw new Error('connectMongo: a MongoDB URI is required');
  return mongoose.connect(uri);
}
