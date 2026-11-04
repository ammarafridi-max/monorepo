import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

import { compositeBlur } from '../src/pipeline/blurBackground.js';

const SIZE = 440;
const CHECK = 22;
const SUBJECT = { left: 140, top: 140, width: 160, height: 160 };

async function scene() {
  const checks = Buffer.alloc(SIZE * SIZE * 3);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const on = (Math.floor(x / CHECK) + Math.floor(y / CHECK)) % 2 === 0;
      const i = (y * SIZE + x) * 3;
      checks[i] = checks[i + 1] = checks[i + 2] = on ? 255 : 0;
    }
  }
  return sharp(checks, { raw: { width: SIZE, height: SIZE, channels: 3 } }).jpeg().toBuffer();
}

async function cutout() {
  return sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: SUBJECT.width,
            height: SUBJECT.height,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 1 },
          },
        })
          .png()
          .toBuffer(),
        left: SUBJECT.left,
        top: SUBJECT.top,
      },
    ])
    .png()
    .toBuffer();
}

const varianceAt = async (buf, region) => {
  const { data } = await sharp(buf).extract(region).greyscale().raw().toBuffer({ resolveWithObject: true });
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  return data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
};

test('compositeBlur flattens the background and leaves the subject sharp', async () => {
  const out = await compositeBlur(await scene(), await cutout());

  const background = await varianceAt(out, { left: 8, top: 8, width: 100, height: 100 });
  const subject = await varianceAt(out, { left: 180, top: 180, width: 80, height: 80 });

  assert.ok(subject > background * 4, `subject ${subject} should stay sharper than background ${background}`);
});

test('compositeBlur honours the strength multiplier', async () => {
  const [img, cut] = [await scene(), await cutout()];
  const soft = await compositeBlur(img, cut, { strength: 0.25 });
  const hard = await compositeBlur(img, cut, { strength: 2 });

  const region = { left: 8, top: 8, width: 100, height: 100 };
  assert.ok(
    (await varianceAt(hard, region)) < (await varianceAt(soft, region)),
    'a higher strength should flatten the background further'
  );
});

test('compositeBlur returns a jpeg the same size as the source', async () => {
  const out = await compositeBlur(await scene(), await cutout());
  const meta = await sharp(out).metadata();

  assert.equal(meta.format, 'jpeg');
  assert.equal(meta.width, SIZE);
  assert.equal(meta.height, SIZE);
});
