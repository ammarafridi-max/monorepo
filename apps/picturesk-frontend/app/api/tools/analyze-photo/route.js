import { User } from '@travel-suite/picturesk-shared';
import { dbConnect } from '../../../../lib/db';
import { getSession } from '../../../../lib/session';
import { analyzeLinkedInPhoto } from '../../../../lib/photoAnalysis';
import { consume, clientIp } from '../../../../lib/toolLimits';

const MAX_BYTES = 5 * 1024 * 1024;
const ANON_PER_DAY = 3;
const ANY_PER_HOUR = 10;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * POST /api/tools/analyze-photo  { image: { data, mediaType }, metrics }
 * The judgment half of the LinkedIn photo analyzer. The photo is forwarded to
 * Claude and never stored. Anonymous visitors get three a day; everyone gets
 * ten an hour; signed-in accounts keep their last score.
 */
export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'Analysis is not configured' }, { status: 500 });
  const body = await req.json().catch(() => null);
  const image = body?.image;
  const metrics = body?.metrics || {};
  if (!image?.data || !TYPES.has(image.mediaType)) {
    return Response.json({ error: 'Send a JPEG, PNG or WebP photo' }, { status: 400 });
  }
  if (image.data.length * 0.75 > MAX_BYTES) return Response.json({ error: 'Keep the photo under 5 MB' }, { status: 413 });
  if (metrics.faceCount != null && metrics.faceCount !== 1) {
    return Response.json({ error: 'We need a photo with exactly one face' }, { status: 422 });
  }

  await dbConnect();
  const session = await getSession();
  const ip = clientIp(req);
  const hourly = await consume({ scope: 'analyze:h', who: ip, limit: ANY_PER_HOUR, windowMs: 60 * 60 * 1000 });
  if (!hourly.ok) return Response.json({ error: 'Too many analyses this hour. Try again later.' }, { status: 429 });
  if (!session) {
    const daily = await consume({ scope: 'analyze:d', who: ip, limit: ANON_PER_DAY, windowMs: 24 * 60 * 60 * 1000 });
    if (!daily.ok) return Response.json({ error: 'signin_required' }, { status: 429 });
  }

  const result = await analyzeLinkedInPhoto(image, metrics).catch((err) => {
    console.error('[web] analyze-photo failed:', err.message);
    return undefined;
  });
  if (result === undefined) return Response.json({ error: 'Analysis failed. Please try again.' }, { status: 502 });
  if (result === null) return Response.json({ error: 'We could not analyse this photo.' }, { status: 422 });

  if (session) {
    User.updateOne(
      { _id: session.userId },
      { $set: { lastAnalysis: { tool: 'linkedin', score: result.score, at: new Date() } } }
    ).catch(() => {});
  }
  return Response.json({ ok: true, result, anonymous: !session });
}
