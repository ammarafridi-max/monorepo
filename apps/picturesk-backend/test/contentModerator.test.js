import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nsfwScoreFrom, MODERATION_REASON } from '../src/contentModerator.js';

// The network call (runModeration) needs a real REPLICATE_API_TOKEN + model, so it
// is not exercised here. What we CAN test without creds is the piece that decides
// safe vs unsafe: reducing a classifier's output to an NSFW score. This is the
// swappable boundary's core, and covers the shapes NSFW models return.

test('nsfwScoreFrom: bare label strings', () => {
  assert.equal(nsfwScoreFrom('nsfw'), 1);
  assert.equal(nsfwScoreFrom('NSFW'), 1);
  assert.equal(nsfwScoreFrom('normal'), 0);
  assert.equal(nsfwScoreFrom('sfw'), 0);
});

test('nsfwScoreFrom: array of { label, score }', () => {
  assert.equal(
    nsfwScoreFrom([
      { label: 'nsfw', score: 0.97 },
      { label: 'normal', score: 0.03 },
    ]),
    0.97
  );
  // A clean image: only the safe label present.
  assert.equal(nsfwScoreFrom([{ label: 'normal', score: 0.99 }]), 0);
  // confidence is accepted as an alias for score.
  assert.equal(nsfwScoreFrom([{ label: 'explicit', confidence: 0.4 }]), 0.4);
});

test('nsfwScoreFrom: label -> score object', () => {
  assert.equal(nsfwScoreFrom({ nsfw: 0.9, normal: 0.1 }), 0.9);
  assert.equal(nsfwScoreFrom({ sfw: 0.99 }), 0);
});

test('nsfwScoreFrom: unrecognised shape returns null (treated as infra error)', () => {
  assert.equal(nsfwScoreFrom([]), null);
  assert.equal(nsfwScoreFrom([{ label: 'cat', score: 0.9 }]), null);
  assert.equal(nsfwScoreFrom(42), null);
  assert.equal(nsfwScoreFrom(null), null);
});

test('threshold decision: explicit is rejected, normal passes (default 0.85)', () => {
  const threshold = 0.85;
  const explicit = nsfwScoreFrom([{ label: 'nsfw', score: 0.97 }]);
  const normal = nsfwScoreFrom([{ label: 'nsfw', score: 0.02 }, { label: 'normal', score: 0.98 }]);
  assert.equal(explicit >= threshold, true, 'explicit should be blocked');
  assert.equal(normal < threshold, true, 'normal selfie should pass');
});

test('the rejection reason is branded and non-graphic', () => {
  assert.equal(MODERATION_REASON, 'This photo cannot be used');
  assert.doesNotMatch(MODERATION_REASON.toLowerCase(), /nsfw|nude|sexual|explicit|porn/);
});
