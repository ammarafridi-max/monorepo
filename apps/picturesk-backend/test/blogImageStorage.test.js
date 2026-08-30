import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBlogImageStorage } from '../src/blogImageStorage.js';

/** A stand-in for the R2 client, recording what it was asked to do. */
function stubStorage() {
  const calls = { put: [], deleted: [] };
  return {
    calls,
    async putObject(key, body, contentType) {
      calls.put.push({ key, body, contentType });
      return `https://cdn.example/${key}`;
    },
    keyForUrl(url) {
      const prefix = 'https://cdn.example/';
      return url?.startsWith(prefix) ? url.slice(prefix.length) : null;
    },
    async deleteObjects(keys) {
      calls.deleted.push(...keys);
      return { deleted: keys.length, failed: 0 };
    },
  };
}

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(20),
]);

test('returns null when no storage is configured, so the domain reports it', () => {
  assert.equal(createBlogImageStorage({ storage: null }), null);
});

test('stores under blog/<id>/ with the content type sniffed from the bytes', async () => {
  const storage = stubStorage();
  const s = createBlogImageStorage({ storage });

  const url = await s.saveImage(JPEG, 'abc123');
  const [put] = storage.calls.put;
  assert.match(put.key, /^blog\/abc123\/[0-9a-f-]{36}\.jpg$/);
  assert.equal(put.contentType, 'image/jpeg');
  assert.equal(url, `https://cdn.example/${put.key}`);

  await s.saveImage(PNG, 'abc123');
  assert.equal(storage.calls.put[1].contentType, 'image/png');
  assert.match(storage.calls.put[1].key, /\.png$/);

  await s.saveImage(WEBP, 'abc123');
  assert.equal(storage.calls.put[2].contentType, 'image/webp');
});

test('two uploads for one post never collide', async () => {
  const storage = stubStorage();
  const s = createBlogImageStorage({ storage });
  await s.saveImage(JPEG, 'same-post');
  await s.saveImage(JPEG, 'same-post');
  assert.notEqual(storage.calls.put[0].key, storage.calls.put[1].key);
});

test('rejects a non-image rather than storing it mislabelled', async () => {
  const s = createBlogImageStorage({ storage: stubStorage() });
  await assert.rejects(() => s.saveImage(Buffer.from('#!/bin/sh\necho hi\n'), 'x'), /JPEG, PNG, WebP, or GIF/);
  await assert.rejects(() => s.saveImage(Buffer.alloc(3), 'x'), /not a readable image/);
});

test('delete only touches our own bucket', async () => {
  const storage = stubStorage();
  const s = createBlogImageStorage({ storage });

  await s.deleteImage('https://cdn.example/blog/abc/one.jpg');
  assert.deepEqual(storage.calls.deleted, ['blog/abc/one.jpg']);

  // A cover image hosted somewhere else must not be turned into a key and deleted.
  await s.deleteImage('https://images.unsplash.com/photo-123.jpg');
  await s.deleteImage(undefined);
  assert.equal(storage.calls.deleted.length, 1);
});
