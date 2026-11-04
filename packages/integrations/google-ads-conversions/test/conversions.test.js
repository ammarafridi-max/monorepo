import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createGoogleAdsConversionsClient, googleClickIdsFrom } from '../src/index.js';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const CREDENTIALS = {
  customerId: '123-456-7890',
  developerToken: 'dev-token',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  refreshToken: 'refresh-token',
  timezoneOffset: '+04:00',
};

function stubFetch(responses = {}) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : null;
    calls.push({ url: String(url), body, headers: options.headers });
    if (String(url).includes('oauth2')) {
      return { ok: true, json: async () => ({ access_token: 'token', expires_in: 3600 }) };
    }
    return { ok: true, json: async () => responses.upload ?? {} };
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

test('does not upload until credentials and a conversion action are present', async () => {
  const unconfigured = createGoogleAdsConversionsClient({});
  assert.equal(unconfigured.isConfigured(), false);
  assert.equal(unconfigured.forAction({ conversionAction: 'a' }).isConfigured(), false);

  const client = createGoogleAdsConversionsClient(CREDENTIALS);
  assert.equal(client.isConfigured(), true);
  assert.equal(client.forAction({}).isConfigured(), false);
  assert.equal(await client.forAction({}).uploadConversion({ gclid: 'g' }), null);
});

test('uploads commission rather than gross when a value rate is set', async () => {
  const stub = stubFetch();
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS)
      .forAction({ conversionAction: 'customers/1/conversionActions/9', valueRate: 0.3 });
    await action.uploadConversion({
      gclid: 'abc',
      email: 'Lead@Example.com',
      orderId: 'session-1',
      value: 130,
      currency: 'AED',
      conversionTime: new Date('2026-10-15T08:30:00.000Z'),
    });
    const upload = stub.calls.at(-1);
    const [conversion] = upload.body.conversions;
    assert.equal(upload.url, 'https://googleads.googleapis.com/v26/customers/1234567890:uploadClickConversions');
    assert.equal(upload.body.partialFailure, true);
    assert.equal(conversion.conversionValue, 39);
    assert.equal(conversion.currencyCode, 'AED');
    assert.equal(conversion.orderId, 'session-1');
    assert.equal(conversion.conversionDateTime, '2026-10-15 12:30:00+04:00');
    assert.equal(conversion.userIdentifiers[0].hashedEmail, sha256('lead@example.com'));
  } finally {
    stub.restore();
  }
});

test('normalizes gmail addresses and phone numbers before hashing', async () => {
  const stub = stubFetch();
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS)
      .forAction({ conversionAction: 'action' });
    await action.uploadConversion({ email: ' First.Last+travel@GMail.com ', phone: '+971 50 123 4567' });
    const [conversion] = stub.calls.at(-1).body.conversions;
    assert.equal(conversion.userIdentifiers[0].hashedEmail, sha256('firstlast@gmail.com'));
    assert.equal(conversion.userIdentifiers[1].hashedPhoneNumber, sha256('+971501234567'));
    assert.equal(conversion.gclid, undefined);
  } finally {
    stub.restore();
  }
});

test('skips uploads with nothing to identify the click by', async () => {
  const stub = stubFetch();
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS).forAction({ conversionAction: 'action' });
    assert.equal(await action.uploadConversion({ value: 100, currency: 'AED' }), null);
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test('omits a value when the amount is missing or not positive', async () => {
  const stub = stubFetch();
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS)
      .forAction({ conversionAction: 'action', valueRate: 0.3 });
    await action.uploadConversion({ gclid: 'abc', value: 0, currency: 'AED' });
    const [conversion] = stub.calls.at(-1).body.conversions;
    assert.equal('conversionValue' in conversion, false);
    assert.equal('currencyCode' in conversion, false);
  } finally {
    stub.restore();
  }
});

test('retracts a refunded conversion by order id', async () => {
  const stub = stubFetch();
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS).forAction({ conversionAction: 'action' });
    await action.uploadAdjustment({ orderId: 'session-1', adjustmentTime: new Date('2026-11-01T00:00:00.000Z') });
    const upload = stub.calls.at(-1);
    const [adjustment] = upload.body.conversionAdjustments;
    assert.ok(upload.url.endsWith(':uploadConversionAdjustments'));
    assert.equal(adjustment.adjustmentType, 'RETRACTION');
    assert.equal(adjustment.orderId, 'session-1');
    assert.equal(adjustment.adjustmentDateTime, '2026-11-01 04:00:00+04:00');
  } finally {
    stub.restore();
  }
});

test('restates a partial refund at the adjusted commission', async () => {
  const stub = stubFetch();
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS)
      .forAction({ conversionAction: 'action', valueRate: 0.3 });
    await action.uploadAdjustment({ orderId: 'session-1', adjustmentType: 'RESTATEMENT', value: 50, currency: 'AED' });
    const [adjustment] = stub.calls.at(-1).body.conversionAdjustments;
    assert.deepEqual(adjustment.restatementValue, { adjustedValue: 15, currencyCode: 'AED' });
  } finally {
    stub.restore();
  }
});

test('an adjustment with no order id and no click pair is not sent', async () => {
  const stub = stubFetch();
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS).forAction({ conversionAction: 'action' });
    assert.equal(await action.uploadAdjustment({}), null);
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test('treats a partial failure as a failed upload', async () => {
  const stub = stubFetch({ upload: { partialFailureError: { message: 'conversion action not found' } } });
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS).forAction({ conversionAction: 'action' });
    await assert.rejects(
      () => action.uploadConversion({ gclid: 'abc', value: 10, currency: 'AED' }),
      /conversion action not found/,
    );
  } finally {
    stub.restore();
  }
});

test('reuses one access token across uploads', async () => {
  const stub = stubFetch();
  try {
    const action = createGoogleAdsConversionsClient(CREDENTIALS).forAction({ conversionAction: 'action' });
    await action.uploadConversion({ gclid: 'a' });
    await action.uploadConversion({ gclid: 'b' });
    assert.equal(stub.calls.filter((c) => c.url.includes('oauth2')).length, 1);
  } finally {
    stub.restore();
  }
});

test('prefers the last touch click id and falls back to the first', () => {
  assert.deepEqual(
    googleClickIdsFrom({ first: { gclid: 'first' }, last: { gclid: 'last', gbraid: 'braid' } }),
    { gclid: 'last', gbraid: 'braid', wbraid: undefined },
  );
  assert.deepEqual(
    googleClickIdsFrom({ first: { gclid: 'first' }, last: {} }),
    { gclid: 'first', gbraid: undefined, wbraid: undefined },
  );
  assert.deepEqual(googleClickIdsFrom(undefined), { gclid: undefined, gbraid: undefined, wbraid: undefined });
});
