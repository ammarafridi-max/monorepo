import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
  };
}
