import 'server-only';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';

// Per-visitor counters for the free tools, in Mongo with a TTL so they expire on
// their own. Keyed by a hash of the IP so no raw address is stored.
const schema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { collection: 'tool_usage' }
);
const ToolUsage = mongoose.models.ToolUsage || mongoose.model('ToolUsage', schema);

export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Count one use against `scope` for `who` and say whether it is still within
 * `limit` for `windowMs`. The first call in a window starts the clock.
 */
export async function consume({ scope, who, limit, windowMs }) {
  const key = `${scope}:${createHash('sha256').update(String(who)).digest('hex').slice(0, 32)}`;
  const now = new Date();
  const doc = await ToolUsage.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now.getTime() + windowMs) } },
    { upsert: true, new: true }
  ).lean();
  if (doc.expiresAt < now) {
    await ToolUsage.updateOne({ key }, { $set: { count: 1, expiresAt: new Date(now.getTime() + windowMs) } });
    return { ok: true, remaining: limit - 1 };
  }
  return { ok: doc.count <= limit, remaining: Math.max(0, limit - doc.count) };
}
