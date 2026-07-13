import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3-compatible object storage (Cloudflare R2).
 *
 * A connection helper in the same spirit as db.js / redis.js: it centralises the
 * bucket + public-URL scheme so the api (presigned uploads) and the worker
 * (training zip) can never disagree about where objects live. No import-time
 * side effects; env is read when createStorage() is called.
 *
 * The browser uploads selfies DIRECTLY to R2 via a presigned PUT; bytes never
 * flow through the api. The worker later reads those objects to build the
 * training zip and writes the zip back to the same bucket.
 */

function requireEnv(env, keys) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`[storage] missing required env: ${missing.join(', ')}`);
  }
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{
 *   bucket: string,
 *   publicUrl: (key: string) => string,
 *   presignPut: (key: string, contentType: string, expiresIn?: number) => Promise<string>,
 *   putObject: (key: string, body: Buffer|Uint8Array|string, contentType: string) => Promise<string>,
 * }}
 */
export function createStorage(env = process.env) {
  requireEnv(env, [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
    'R2_PUBLIC_BASE_URL',
  ]);

  const bucket = env.R2_BUCKET;
  const publicBase = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '');

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    // Recent AWS SDK versions add a default CRC32 checksum to every request. For
    // a presigned PUT that bakes the checksum of an EMPTY body into the URL, so
    // when the browser uploads the real bytes R2 rejects the mismatch. R2 does
    // not need it; only add checksums when an operation actually requires one.
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });

  const publicUrl = (key) => `${publicBase}/${key.replace(/^\/+/, '')}`;

  return {
    bucket,
    publicUrl,

    /**
     * Presigned PUT the browser uploads to directly. The client MUST send the
     * same Content-Type it was signed with, or R2 rejects the signature.
     */
    async presignPut(key, contentType, expiresIn = 900) {
      const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
      return getSignedUrl(client, command, { expiresIn });
    },

    /** Server-side upload (used by the worker for the training zip). */
    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
      );
      return publicUrl(key);
    },

    /**
     * The storage key for a public URL, or null if the URL is not in OUR bucket.
     * Lets a caller (the admin delete) turn stored image URLs back into keys and
     * safely skip foreign URLs (e.g. replicate.delivery outputs we do not own).
     */
    keyForUrl(url) {
      const prefix = `${publicBase}/`;
      if (typeof url === 'string' && url.startsWith(prefix)) {
        return url.slice(prefix.length);
      }
      return null;
    },

    /**
     * Delete objects by key. Best-effort and per-key (a missing key is a no-op
     * success in S3/R2), returning how many succeeded/failed so the caller can
     * report without aborting the whole operation on one failure.
     */
    async deleteObjects(keys) {
      const list = [...new Set((keys || []).filter(Boolean))];
      if (!list.length) return { deleted: 0, failed: 0 };
      const results = await Promise.allSettled(
        list.map((Key) => client.send(new DeleteObjectCommand({ Bucket: bucket, Key })))
      );
      const deleted = results.filter((r) => r.status === 'fulfilled').length;
      return { deleted, failed: results.length - deleted };
    },
  };
}
