import { test } from 'node:test';
import assert from 'node:assert/strict';

import { QUALITY, REASONS, reasonForImage, evaluateImages, countError } from '../src/uploadGate.js';


test('reasonForImage: one clear, large-enough face passes', () => {
  assert.equal(reasonForImage({ faceCount: 1, maxFaceBoxRatio: 0.4 }), null);
});

test('reasonForImage: zero faces is rejected', () => {
  assert.equal(reasonForImage({ faceCount: 0, maxFaceBoxRatio: 0 }), REASONS.noFace);
});

test('reasonForImage: multiple faces is rejected', () => {
  assert.equal(reasonForImage({ faceCount: 2, maxFaceBoxRatio: 0.5 }), REASONS.multipleFaces);
});

test('reasonForImage: a solo photo with a small bystander passes (subject-size aware)', () => {
  assert.equal(reasonForImage({ faceCount: 2, subjectCount: 1, maxFaceBoxRatio: 0.5 }), null);
});

test('reasonForImage: two comparably-sized people is still rejected', () => {
  assert.equal(reasonForImage({ faceCount: 2, subjectCount: 2, maxFaceBoxRatio: 0.5 }), REASONS.multipleFaces);
});

test('reasonForImage: a lone but tiny face is rejected', () => {
  const tiny = QUALITY.minFaceBoxRatio - 0.01;
  assert.equal(reasonForImage({ faceCount: 1, maxFaceBoxRatio: tiny }), REASONS.faceTooSmall);
});

test('reasonForImage: an unreadable image is rejected', () => {
  assert.equal(reasonForImage({ faceCount: 0, maxFaceBoxRatio: 0, error: true }), REASONS.unreadable);
});

test('evaluateImages: returns only the failing images, with index + reason', () => {
  const images = [
    { index: 0, url: 'a', faceCount: 1, maxFaceBoxRatio: 0.4 }, 
    { index: 1, url: 'b', faceCount: 0, maxFaceBoxRatio: 0 }, 
    { index: 2, url: 'c', faceCount: 3, maxFaceBoxRatio: 0.6 }, 
    { index: 3, url: 'd', faceCount: 1, maxFaceBoxRatio: 0.02 }, 
  ];
  const failures = evaluateImages(images);
  assert.deepEqual(
    failures,
    [
      { index: 1, url: 'b', reason: REASONS.noFace },
      { index: 2, url: 'c', reason: REASONS.multipleFaces },
      { index: 3, url: 'd', reason: REASONS.faceTooSmall },
    ],
    'exactly the 3 bad images are reported'
  );
});

test('evaluateImages: all-good returns no failures', () => {
  const images = Array.from({ length: 6 }, (_, i) => ({
    index: i,
    faceCount: 1,
    maxFaceBoxRatio: 0.35,
  }));
  assert.deepEqual(evaluateImages(images), []);
});

test('countError: enforces the min/max range', () => {
  assert.ok(countError(QUALITY.minPhotos - 1), 'too few is rejected');
  assert.ok(countError(QUALITY.maxPhotos + 1), 'too many is rejected');
  assert.equal(countError(QUALITY.minPhotos), null, 'min is allowed');
  assert.equal(countError(QUALITY.maxPhotos), null, 'max is allowed');
});
