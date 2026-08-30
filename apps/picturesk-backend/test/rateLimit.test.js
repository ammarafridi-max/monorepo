import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createRateLimiters } from '../src/rateLimit.js';

/**
 * Verify the rate-limit tiers and, crucially, that the Stripe webhook is exempt.
 * We build a throwaway app with tiny limits (so a handful of requests trips them)
 * mounted in the SAME ORDER as server.js: webhook first (before the global
 * limiter), then the limited routes.
 */
function buildApp() {
  const { globalLimiter, presignLimiter, checkoutLimiter } = createRateLimiters({
    windowMs: 60_000,
    globalMax: 1000, // high: not what we are testing here
    presignMax: 3,
    checkoutMax: 2,
  });

  const app = express();
  // Webhook is registered BEFORE the global limiter, exactly like server.js, so
  // it is never rate limited.
  app.post('/webhooks/stripe', (req, res) => res.json({ received: true }));
  app.use(globalLimiter);
  app.post('/uploads/presign', presignLimiter, (req, res) => res.json({ ok: true }));
  app.post('/checkout', checkoutLimiter, (req, res) => res.json({ ok: true }));
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, port: server.address().port }));
  });
}

async function hammer(url, n) {
  const codes = [];
  for (let i = 0; i < n; i++) {
    const res = await fetch(url, { method: 'POST' });
    codes.push(res.status);
  }
  return codes;
}

test('presign: allowed up to the limit, then 429 with a clean JSON body', async () => {
  const { server, port } = await listen(buildApp());
  try {
    const url = `http://127.0.0.1:${port}/uploads/presign`;
    const codes = await hammer(url, 5); // presignMax = 3
    assert.deepEqual(codes.slice(0, 3), [200, 200, 200], `first three should pass: ${codes}`);
    assert.equal(codes[3], 429, 'fourth should be limited');
    assert.equal(codes[4], 429);

    const res = await fetch(url, { method: 'POST' });
    const body = await res.json();
    assert.equal(res.status, 429);
    assert.equal(body.error, 'too_many_requests');
    assert.ok(typeof body.message === 'string' && body.message.length > 0);
    // No internals leaked.
    assert.equal(body.stack, undefined);
  } finally {
    server.close();
  }
});

test('checkout: tighter limit trips sooner', async () => {
  const { server, port } = await listen(buildApp());
  try {
    const codes = await hammer(`http://127.0.0.1:${port}/checkout`, 4); // checkoutMax = 2
    assert.deepEqual(codes, [200, 200, 429, 429], `got ${codes}`);
  } finally {
    server.close();
  }
});

test('webhook: exempt from rate limiting (Stripe may burst retries)', async () => {
  const { server, port } = await listen(buildApp());
  try {
    const codes = await hammer(`http://127.0.0.1:${port}/webhooks/stripe`, 25);
    assert.ok(
      codes.every((c) => c === 200),
      `webhook must never be limited, got: ${[...new Set(codes)].join(',')}`
    );
  } finally {
    server.close();
  }
});
