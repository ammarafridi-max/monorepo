import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  ADS_READ_TOOLS,
  ADS_WRITE_TOOLS,
  buildAdsToolDefinitions,
  describeAdsProposal,
  executeAdsAction,
  executeAdsRead,
} from '../src/ads-tools.js';
import { executeTool } from '../src/tools.js';

function adsStub(calls = []) {
  return {
    calls,
    getSetup: async () => ({ currency: 'AED', website: 'https://dummyticket365.com', maxDailyBudget: 200, salesGoalAvailable: true }),
    getOverview: async ({ days }) => ({ range: { days }, campaigns: [{ id: 'c_1', name: 'Visa traffic', spend: 120 }] }),
    getCampaignDetail: async (id, { days }) => ({
      id,
      name: 'Visa traffic',
      range: { days },
      adGroups: [{ id: 'g_1', name: 'Schengen', ads: [{ id: 'a_1', title: 'Dummy ticket', imageFileId: 'file_9' }] }],
    }),
    getCampaignSettings: async (id) => ({
      id,
      name: 'Visa traffic',
      goal: 'sales',
      dailyBudget: 50,
      locations: [{ id: '1001' }, { id: '1002' }],
      startDate: '2026-10-01',
      endDate: '',
    }),
    getAdGroupSettings: async (id) => ({ id, name: 'Schengen', bid: 12 }),
    searchLocations: async (q) => (q === 'dubai' ? [{ id: '1001', name: 'Dubai, AE', type: 'city' }] : []),
    createCampaignWithAd: async (input, by) => { calls.push(['create', input, by]); return { id: 'c_new' }; },
    duplicateCampaign: async (id, input, by) => { calls.push(['duplicate', id, input, by]); return { id: 'c_copy', adGroups: 1, ads: 1 }; },
    updateCampaignSettings: async (id, input, by) => { calls.push(['budget', id, input, by]); return { id, dailyBudget: input.dailyBudget }; },
    setStatus: async (kind, id, action, by) => { calls.push(['status', kind, id, action, by]); return { id, status: 'paused' }; },
  };
}

const CAMPAIGN_INPUT = {
  name: 'Schengen October',
  goal: 'sales',
  dailyBudget: 60,
  locationIds: ['1001'],
  adGroup: { name: 'Schengen visa', bid: 15, contextHints: ['applying for a schengen visa'] },
  ad: { title: 'Verifiable dummy ticket', body: 'Instant delivery for your visa file.', targetUrl: 'https://dummyticket365.com/', imageFileId: 'file_9' },
};

describe('ads tool surface', () => {
  it('offers only read tools when the role cannot write', () => {
    const names = buildAdsToolDefinitions({ canWrite: false }).map((tool) => tool.name);
    assert.deepEqual(names, ADS_READ_TOOLS);
  });

  it('adds the proposal tools when it can', () => {
    const names = buildAdsToolDefinitions({ canWrite: true }).map((tool) => tool.name);
    assert.deepEqual(names, [...ADS_READ_TOOLS, ...ADS_WRITE_TOOLS]);
  });

  it('requires an image id on a proposed ad, since it cannot upload one', () => {
    const tool = buildAdsToolDefinitions({ canWrite: true }).find((t) => t.name === 'propose_ads_campaign');
    assert.ok(tool.input_schema.properties.ad.required.includes('imageFileId'));
  });
});

describe('ads reads', () => {
  it('caps the look-back window at 90 days', async () => {
    const { result } = await executeAdsRead({ name: 'ads_overview', input: { days: 9000 }, ads: adsStub() });
    assert.equal(result.range.days, 90);
  });

  it('defaults the window to 30 days', async () => {
    const { result } = await executeAdsRead({ name: 'ads_campaign', input: { campaignId: 'c_1' }, ads: adsStub() });
    assert.equal(result.range.days, 30);
  });

  it('exposes the image id so creative can be reused', async () => {
    const { result } = await executeAdsRead({ name: 'ads_campaign', input: { campaignId: 'c_1' }, ads: adsStub() });
    assert.equal(result.adGroups[0].ads[0].imageFileId, 'file_9');
  });

  it('refuses a campaign read with no id', async () => {
    await assert.rejects(executeAdsRead({ name: 'ads_campaign', input: {}, ads: adsStub() }), /campaign id is required/);
  });
});

describe('proposals do not execute', () => {
  it('describes a new campaign without touching the account', async () => {
    const ads = adsStub();
    const { summary, details } = await describeAdsProposal({ name: 'propose_ads_campaign', input: CAMPAIGN_INPUT, ads });
    assert.match(summary, /Create the campaign "Schengen October"/);
    assert.ok(details.some((line) => line.includes('AED 60')));
    assert.ok(details.some((line) => line.includes('paused')));
    assert.equal(ads.calls.length, 0);
  });

  it('describes a duplicate against the real source campaign', async () => {
    const ads = adsStub();
    const { summary, details } = await describeAdsProposal({
      name: 'propose_ads_duplicate',
      input: { campaignId: 'c_1', name: 'Visa traffic November' },
      ads,
    });
    assert.match(summary, /Duplicate "Visa traffic" as "Visa traffic November"/);
    assert.ok(details.some((line) => line.includes('AED 50')));
    assert.equal(ads.calls.length, 0);
  });

  it('shows the before and after on a budget change', async () => {
    const { details } = await describeAdsProposal({ name: 'propose_ads_budget', input: { campaignId: 'c_1', dailyBudget: 90 }, ads: adsStub() });
    assert.ok(details.some((line) => line.includes('Now: AED 50')));
    assert.ok(details.some((line) => line.includes('After: AED 90')));
    assert.ok(details.some((line) => line.includes('ceiling: AED 200')));
  });

  it('names the thing being paused', async () => {
    const { summary } = await describeAdsProposal({ name: 'propose_ads_status', input: { kind: 'ad_groups', id: 'g_1', action: 'pause' }, ads: adsStub() });
    assert.equal(summary, 'Pause the ad group "Schengen"');
  });

  it('refuses an unknown entity kind', async () => {
    await assert.rejects(
      describeAdsProposal({ name: 'propose_ads_status', input: { kind: 'wallets', id: 'x', action: 'pause' }, ads: adsStub() }),
      /must be campaigns, ad_groups or ads/,
    );
  });
});

describe('the write gate', () => {
  it('stores a proposal and executes nothing when a write tool is called', async () => {
    const ads = adsStub();
    const proposed = [];

    const outcome = await executeTool({
      name: 'propose_ads_campaign',
      input: CAMPAIGN_INPUT,
      datasets: [],
      ads,
      propose: async (action) => {
        proposed.push(action);
        return { id: 'act_1', kind: action.kind };
      },
      role: 'admin',
    });

    assert.equal(outcome.result.proposed, true);
    assert.equal(outcome.result.actionId, 'act_1');
    assert.match(outcome.result.awaiting, /Nothing has changed yet/);
    assert.equal(proposed.length, 1);
    assert.equal(ads.calls.length, 0);
  });

  it('refuses a write tool when the role may not propose', async () => {
    await assert.rejects(
      executeTool({ name: 'propose_ads_duplicate', input: { campaignId: 'c_1' }, datasets: [], ads: adsStub(), propose: null, role: 'agent' }),
      /not allowed to change the ad account/,
    );
  });

  it('refuses any ads tool when the brand has no ad account', async () => {
    await assert.rejects(
      executeTool({ name: 'ads_overview', input: {}, datasets: [], ads: null, role: 'admin' }),
      /OpenAI Ads is not configured/,
    );
  });
});

describe('approved actions reach the ads service', () => {
  it('creates a campaign with the frozen params', async () => {
    const ads = adsStub();
    const result = await executeAdsAction({ kind: 'propose_ads_campaign', params: CAMPAIGN_INPUT, ads, performedBy: 'Ammar' });
    assert.equal(result.id, 'c_new');
    assert.deepEqual(ads.calls[0], ['create', CAMPAIGN_INPUT, 'Ammar']);
  });

  it('duplicates with the chosen name and budget', async () => {
    const ads = adsStub();
    await executeAdsAction({ kind: 'propose_ads_duplicate', params: { campaignId: 'c_1', name: 'Copy', dailyBudget: 25 }, ads, performedBy: 'Ammar' });
    assert.deepEqual(ads.calls[0], ['duplicate', 'c_1', { name: 'Copy', dailyBudget: 25 }, 'Ammar']);
  });

  it('keeps the existing locations and dates when only the budget changes', async () => {
    const ads = adsStub();
    await executeAdsAction({ kind: 'propose_ads_budget', params: { campaignId: 'c_1', dailyBudget: 90 }, ads, performedBy: 'Ammar' });
    const [, , input] = ads.calls[0];
    assert.deepEqual(input.locationIds, ['1001', '1002']);
    assert.equal(input.startDate, '2026-10-01');
    assert.equal(input.dailyBudget, 90);
  });

  it('passes a status change straight through', async () => {
    const ads = adsStub();
    await executeAdsAction({ kind: 'propose_ads_status', params: { kind: 'campaigns', id: 'c_1', action: 'pause' }, ads, performedBy: 'Ammar' });
    assert.deepEqual(ads.calls[0], ['status', 'campaigns', 'c_1', 'pause', 'Ammar']);
  });

  it('refuses an unknown action kind', async () => {
    await assert.rejects(executeAdsAction({ kind: 'propose_refund', params: {}, ads: adsStub() }), /Unknown action/);
  });
});
