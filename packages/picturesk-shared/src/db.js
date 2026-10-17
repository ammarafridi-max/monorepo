import mongoose from 'mongoose';

export async function connectMongo(uri) {
  if (!uri) throw new Error('connectMongo: a MongoDB URI is required');
  return mongoose.connect(uri);
}
