import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIERS, DEFAULT_TIER, getTier, isValidTier } from '@travel-suite/picturesk-shared/pricing';

test('TIERS is the three one-time tiers, priced low to high', () => {
  assert.deepEqual(
    TIERS.map((t) => t.id),
    ['starter', 'pro', 'premium']
  );
  assert.deepEqual(
    TIERS.map((t) => t.priceCents),
    [900, 2900, 4900]
  );
  // Asserted as an invariant too, so reordering the catalog fails here rather
  // than only tripping the magic array above.
  const prices = TIERS.map((t) => t.priceCents);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), 'tiers ascend by price');
  // Every tier must be internally coherent: integer cents, deliver <= generate,
  // a valid BullMQ priority, exactly one "popular" flag.
  for (const t of TIERS) {
    assert.ok(Number.isInteger(t.priceCents) && t.priceCents > 0, `${t.id} priceCents`);
    assert.ok(t.deliverCount > 0 && t.deliverCount <= t.generateCount, `${t.id} deliver<=generate`);
    assert.ok(Number.isInteger(t.priority) && t.priority >= 1, `${t.id} priority`);
  }
  assert.equal(TIERS.filter((t) => t.popular).length, 1, 'exactly one popular tier');
});

test('higher tiers deliver more and get higher queue priority (lower number)', () => {
  const [starter, pro, premium] = TIERS;
  assert.ok(starter.deliverCount < pro.deliverCount && pro.deliverCount < premium.deliverCount);
  // Lower priority number = pulled off the queue first.
  assert.ok(premium.priority < pro.priority && pro.priority < starter.priority);
});

test('isValidTier accepts real ids and rejects junk', () => {
  assert.equal(isValidTier('pro'), true);
  assert.equal(isValidTier('premium'), true);
  assert.equal(isValidTier('enterprise'), false);
  assert.equal(isValidTier(''), false);
  assert.equal(isValidTier(undefined), false);
});

test('getTier resolves ids and falls back to the default for unknown/missing', () => {
  assert.equal(getTier('pro').id, 'pro');
  assert.equal(getTier('nope').id, DEFAULT_TIER);
  assert.equal(getTier(undefined).id, DEFAULT_TIER);
  assert.equal(DEFAULT_TIER, 'starter');
});
