import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIERS, DEFAULT_TIER, getTier, isValidTier, isFreeTier, tiersFor, paidTiersFor, fromPriceFor } from '@travel-suite/picturesk-shared/pricing';

test('TIERS holds a free tier plus three paid tiers per product, priced low to high', () => {
  assert.deepEqual(
    tiersFor('headshots').map((t) => [t.id, t.priceCents]),
    [['free', 0], ['starter', 900], ['pro', 2900], ['premium', 4900]]
  );
  assert.deepEqual(
    tiersFor('dating').map((t) => [t.id, t.priceCents]),
    [['dating_free', 0], ['dating_starter', 1900], ['dating_pro', 3900], ['dating_premium', 5900]]
  );
  assert.deepEqual(paidTiersFor('headshots').map((t) => t.id), ['starter', 'pro', 'premium']);
  assert.equal(fromPriceFor('headshots'), 9);
  assert.equal(fromPriceFor('dating'), 19);
  assert.ok(isFreeTier(getTier('free')) && isFreeTier(getTier('dating_free')));
  assert.ok(!isFreeTier(getTier('starter')));
  for (const product of ['headshots', 'dating']) {
    const tiers = tiersFor(product);
    const prices = tiers.map((t) => t.priceCents);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b), `${product} tiers ascend by price`);
    assert.equal(tiers.filter((t) => t.popular).length, 1, `${product}: exactly one popular tier`);
  }
  // Every tier must be internally coherent: integer cents, deliver <= generate,
  // a valid BullMQ priority, a known product.
  for (const t of TIERS) {
    assert.ok(Number.isInteger(t.priceCents) && t.priceCents >= 0, `${t.id} priceCents`);
    assert.ok(t.deliverCount > 0 && t.deliverCount <= t.generateCount, `${t.id} deliver<=generate`);
    assert.ok(Number.isInteger(t.priority) && t.priority >= 1, `${t.id} priority`);
    assert.ok(['headshots', 'dating'].includes(t.product), `${t.id} product`);
  }
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
