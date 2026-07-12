import 'server-only';
import mongoose from 'mongoose';
import { connectMongo } from '@picturesk/shared';

/**
 * Cached Mongoose connection for the Next server. connectMongo() from
 * @picturesk/shared does the actual connect; we cache the promise on globalThis so
 * dev HMR (which re-imports modules) reuses one connection instead of opening a
 * new one every reload.
 */
let cached = globalThis.__pictureskMongoose;
if (!cached) cached = globalThis.__pictureskMongoose = { promise: null };

export async function dbConnect() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('[web] MONGODB_URI is required');
    cached.promise = connectMongo(uri);
  }
  return cached.promise;
}
