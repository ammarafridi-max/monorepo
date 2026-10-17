import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


function requireEnv(env, keys) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`[storage] missing required env: ${missing.join(', ')}`);
  }
}

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
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });

  const publicUrl = (key) => `${publicBase}/${key.replace(/^\/+/, '')}`;

  return {
    bucket,
    publicUrl,

    async presignPut(key, contentType, expiresIn = 900) {
      const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
      return getSignedUrl(client, command, { expiresIn });
    },

    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
      );
      return publicUrl(key);
    },

    keyForUrl(url) {
      const prefix = `${publicBase}/`;
      if (typeof url === 'string' && url.startsWith(prefix)) {
        return url.slice(prefix.length);
      }
      return null;
    },

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
