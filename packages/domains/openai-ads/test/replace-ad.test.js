import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { createOpenAIAdsService } from '../src/service.js';

const AD = {
  title: 'Dummy ticket for your visa',
  body: 'Verifiable booking, delivered in minutes.',
  targetUrl: 'https://www.dummyticket365.com/ae',
  imageFileId: 'file_1',
};

function stub({ archiveFails = false } = {}) {
  const calls = [];

  const adsClient = {
    isConfigured: () => true,
    getAccount: async () => ({ currency_code: 'AED', timezone: 'Asia/Dubai', url: 'https://www.dummyticket365.com' }),
    createAd: async (body) => { calls.push(['createAd', body.ad_group_id, body.creative.title]); return { id: 'ad_new' }; },
    setStatus: async (kind, id, action) => {
      calls.push(['setStatus', kind, id, action]);
      if (archiveFails) throw new Error('ad is already archived');
      return { id, status: 'archived' };
    },
    getAd: async (id) => ({
      id,
      name: 'Need Dummy Ticket Urgently?',
      status: 'active',
      review: { status: 'rejected', reason: 'We rejected your ad because it violates our Ads Policies.' },
      advertiser_reasoning_summary: 'We rejected your ad because it violates our Ads Policies.',
      appeal: null,
      submitted_version_id: 'v1',
      creative: { title: 'Need Dummy Ticket Urgently?', body: 'Book now', target_url: 'https://www.dummyticket365.com/ae', file_id: 'file_1' },
    }),
    listAds: async () => [
      { id: 'ad_1', status: 'active', review: { status: 'rejected', reason: 'We rejected your ad because it violates our Ads Policies.' }, creative: { title: 'A' } },
      { id: 'ad_2', status: 'active', review: { status: 'in_review' }, creative: { title: 'B' } },
      { id: 'ad_3', status: 'active', review: { status: 'approved' }, creative: { title: 'C' } },
      { id: 'ad_4', status: 'archived', review: { status: 'rejected', reason: 'old' }, creative: { title: 'D' } },
    ],
  };

  return { service: createOpenAIAdsService({ adsClient, maxDailyBudget: 200, logger: { info() {}, warn() {} } }), calls };
}

describe('replacing an ad', () => {
  it('creates the replacement before archiving the original', async () => {
    const { service, calls } = stub();
    const result = await service.replaceAd('ad_old', 'adgrp_1', AD, 'Ammar');

    assert.deepEqual(calls[0], ['createAd', 'adgrp_1', AD.title]);
    assert.deepEqual(calls[1], ['setStatus', 'ads', 'ad_old', 'archive']);
    assert.equal(result.replaced, 'ad_old');
    assert.equal(result.warnings, undefined);
  });

  it('warns that both ads are live when archiving fails', async () => {
    const { service } = stub({ archiveFails: true });
    const result = await service.replaceAd('ad_old', 'adgrp_1', AD, 'Ammar');

    assert.equal(result.replaced, undefined);
    assert.match(result.warnings[0], /archiving the old ad failed/);
    assert.match(result.warnings[0], /Both are live/);
  });

  it('refuses a landing page off the brand domain, so a rewrite cannot redirect traffic', async () => {
    const { service } = stub();
    await assert.rejects(
      service.replaceAd('ad_old', 'adgrp_1', { ...AD, targetUrl: 'https://evil.example.com' }, 'Ammar'),
      /Landing page must be on dummyticket365.com/,
    );
  });

  it('refuses malformed ids before calling the API', async () => {
    const { service, calls } = stub();
    await assert.rejects(service.replaceAd('nope', 'adgrp_1', AD, 'Ammar'), /Invalid ID/);
    assert.equal(calls.length, 0);
  });
});

describe('review status', () => {
  it('reads the rejection reason off one ad', async () => {
    const { service } = stub();
    const ad = await service.getAdDetail('ad_6ad75e7d5fd08199baf75ff956350b6e');

    assert.equal(ad.review, 'rejected');
    assert.match(ad.reviewReason, /violates our Ads Policies/);
    assert.equal(ad.appealed, false);
    assert.equal(ad.title, 'Need Dummy Ticket Urgently?');
  });

  it('lists what is rejected and what is merely waiting, ignoring archived ads', async () => {
    const { service } = stub();
    const issues = await service.listReviewIssues();

    assert.deepEqual(issues.rejected.map((a) => a.id), ['ad_1']);
    assert.deepEqual(issues.inReview.map((a) => a.id), ['ad_2']);
    assert.equal(issues.inReview[0].reviewReason, null);
    assert.match(issues.note, /does not say which policy/);
  });
});
