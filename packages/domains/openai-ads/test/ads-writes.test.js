import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { createOpenAIAdsService } from '../src/service.js';

const AD = {
  title: 'Dummy ticket for your visa',
  body: 'Verifiable booking, delivered in minutes.',
  targetUrl: 'https://www.dummyticket365.com/ae',
  imageFileId: 'file_1',
};

function stub({ archiveFails = false, editFails = false, editLands = false, editStatus = 400, hints = [], biddingType = 'conversions' } = {}) {
  const calls = [];
  let stored = null;

  const adsClient = {
    isConfigured: () => true,
    getAccount: async () => ({ currency_code: 'AED', timezone: 'Asia/Dubai', url: 'https://www.dummyticket365.com' }),
    createAd: async (body) => { calls.push(['createAd', body.ad_group_id, body.creative.title]); return { id: 'ad_new' }; },
    updateAd: async (id, body) => {
      calls.push(['updateAd', id, body.creative]);
      if (editFails) {
        if (editLands) stored = body.creative;
        const err = new Error('ad update refused');
        err.httpStatus = editStatus;
        throw err;
      }
      stored = body.creative;
      return { id };
    },
    getAdGroup: async (id) => ({
      id,
      name: 'Schengen',
      context_hints: hints,
      bidding_config: { billing_event_type: 'click', strategy: 'fixed_bid', max_bid_micros: 15000000 },
    }),
    getCampaign: async (id) => ({
      id,
      name: 'DT365_UAE',
      bidding_type: biddingType,
      budget: { daily_spend_limit_micros: 150000000 },
    }),
    updateAdGroup: async (id, body) => { calls.push(['updateAdGroup', id, body]); return { id }; },
    setStatus: async (kind, id, action) => {
      calls.push(['setStatus', kind, id, action]);
      if (archiveFails) throw new Error('ad is already archived');
      return { id, status: 'archived' };
    },
    getAd: async (id) => (stored ? { id, creative: stored } : {
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

describe('editing an ad', () => {
  it('edits the ad in place, leaving its id and its stats alone', async () => {
    const { service, calls } = stub();
    const result = await service.updateAd('ad_old', 'adgrp_1', AD, 'Ammar');

    assert.equal(result.edited, true);
    assert.equal(result.id, 'ad_old');
    assert.deepEqual(calls.map((c) => c[0]), ['updateAd']);
  });

  it('keeps the image crop so a reworded ad does not reframe its picture', async () => {
    const { service, calls } = stub();
    const crop = { x: 0, y: 0.167, width: 1, height: 0.666 };
    await service.updateAd('ad_old', 'adgrp_1', { ...AD, imageCrop: crop }, 'Ammar');

    assert.deepEqual(calls[0][2].image_crop, crop);
  });

  it('drops a crop that is not four fractions rather than sending something OpenAI will reject', async () => {
    const { service, calls } = stub();
    await service.updateAd('ad_old', 'adgrp_1', { ...AD, imageCrop: { x: 0, y: 0, width: 4, height: 1 } }, 'Ammar');

    assert.equal(calls[0][2].image_crop, undefined);
  });

  it('falls back to a replacement when OpenAI refuses the edit, and says so', async () => {
    const { service, calls } = stub({ editFails: true });
    const result = await service.updateAd('ad_old', 'adgrp_1', AD, 'Ammar');

    assert.equal(result.edited, false);
    assert.equal(result.replaced, 'ad_old');
    assert.deepEqual(calls.map((c) => c[0]), ['updateAd', 'createAd', 'setStatus']);
    assert.match(result.warning, /replacement ad was created/);
  });

  it('propagates a transient failure instead of archiving a live ad', async () => {
    const { service, calls } = stub({ editFails: true, editStatus: 503 });

    await assert.rejects(service.updateAd('ad_old', 'adgrp_1', AD, 'Ammar'), /OpenAI Ads API/);
    assert.deepEqual(calls.map((c) => c[0]), ['updateAd']);
  });

  it('does not create a second ad when the edit landed but the response was lost', async () => {
    const { service, calls } = stub({ editFails: true, editLands: true });
    const result = await service.updateAd('ad_old', 'adgrp_1', AD, 'Ammar');

    assert.equal(result.edited, true);
    assert.deepEqual(calls.map((c) => c[0]), ['updateAd']);
  });

  it('refuses a landing page off the brand domain before touching the API', async () => {
    const { service, calls } = stub();
    await assert.rejects(
      service.updateAd('ad_old', 'adgrp_1', { ...AD, targetUrl: 'https://evil.example.com' }, 'Ammar'),
      /Landing page must be on dummyticket365.com/,
    );
    assert.equal(calls.length, 0);
  });
});

const GROUP_SETTINGS = { campaignId: 'cmpn_1', bid: 15 };

describe('audience hints', () => {
  const save = async (contextHints, options) => {
    const { service, calls } = stub(options);
    await service.updateAdGroupSettings('adgrp_1', { ...GROUP_SETTINGS, contextHints }, 'Ammar');
    return calls.find((c) => c[0] === 'updateAdGroup')[2].context_hints;
  };

  it('puts a list that was split at its commas back into one hint', async () => {
    const saved = await save([
      'UAE-based travelers applying for a Schengen visa who need a flight itinerary. Conversations about document checklists',
      'VFS/BLS/TLS',
      'contact appointments',
      'and visa applications for France',
      'Italy',
      'or the Netherlands.',
    ]);

    assert.equal(saved.length, 1);
    assert.match(saved[0], /checklists, VFS\/BLS\/TLS, contact appointments, and visa applications for France, Italy, or the Netherlands\.$/);
  });

  it('leaves whole ideas alone when each one ends in a full stop', async () => {
    const hints = [
      'Travel documentation shoppers looking for a verifiable flight reservation.',
      'Users who need an emailed itinerary with a PNR.',
      'Travelers comparing quick reservation options online.',
    ];

    assert.deepEqual(await save(hints), hints);
  });

  it('does not glue two short hints together, because neither is a trailing fragment', async () => {
    const hints = ['Business travellers', 'Students'];

    assert.deepEqual(await save(hints), hints);
  });

  it('stops merging rather than pushing a hint past the 300 character limit', async () => {
    const long = `${'a'.repeat(280)} tail`;
    const saved = await save([long, 'and more detail here']);

    assert.equal(saved.length, 2);
  });
});

describe('reading audience hints back', () => {
  it('shows a list that OpenAI stores split at its commas as the one idea it is', async () => {
    const { service } = stub({
      hints: ['UAE residents applying for a UK visa', 'Canada', 'or Japan who need a flight reservation.'],
    });
    const settings = await service.getAdGroupSettings('adgrp_1');

    assert.deepEqual(settings.contextHints, [
      'UAE residents applying for a UK visa, Canada, or Japan who need a flight reservation.',
    ]);
  });
});

describe('resetting a bid', () => {
  const biddingFor = async (input, options) => {
    const { service, calls } = stub(options);
    await service.updateAdGroupSettings('adgrp_1', { ...GROUP_SETTINGS, ...input }, 'Ammar');
    return calls.find((c) => c[0] === 'updateAdGroup')[2].bidding_config;
  };

  it('hands bidding back to OpenAI for a conversions campaign', async () => {
    const config = await biddingFor({ bid: undefined, clearBid: true });

    assert.equal(config.strategy, 'maximize_conversions');
    assert.equal(config.max_bid_micros, undefined);
    assert.deepEqual(config.custom_audience_bid_multipliers, []);
  });

  it('hands bidding back to OpenAI for a clicks campaign', async () => {
    const config = await biddingFor({ bid: undefined, clearBid: true }, { biddingType: 'clicks' });

    assert.equal(config.strategy, 'maximize_clicks');
  });

  it('sets a fixed bid in micros when one is given', async () => {
    const config = await biddingFor({ bid: 12.5 });

    assert.equal(config.strategy, 'fixed_bid');
    assert.equal(config.max_bid_micros, 12500000);
  });

  it('refuses a bid and a reset in the same save', async () => {
    const { service } = stub();
    await assert.rejects(
      service.updateAdGroupSettings('adgrp_1', { ...GROUP_SETTINGS, bid: 12, clearBid: true }, 'Ammar'),
      /Either set a bid or reset it/,
    );
  });

  it('leaves bidding untouched when neither a bid nor a reset is asked for', async () => {
    const config = await biddingFor({ bid: '' });

    assert.equal(config, undefined);
  });
});
