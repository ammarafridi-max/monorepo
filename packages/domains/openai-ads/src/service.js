import { AppError } from '@travel-suite/utils';

const RANGE_DAYS = [7, 14, 30, 90];
const ID_PATTERNS = { campaigns: /^cmpn_[a-z0-9]+$/i, ad_groups: /^adgrp_[a-z0-9]+$/i, ads: /^ad_[a-z0-9]+$/i };
const GOALS = { sales: 'conversions', clicks: 'clicks' };
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const toMicros = (amount) => Math.round(Number(amount) * 1e6);

function text(value, { field, min = 0, max }) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (v.length < min) throw new AppError(min > 1 ? `${field} needs at least ${min} characters` : `${field} is required`, 400);
  if (max && v.length > max) throw new AppError(`${field} can be at most ${max} characters`, 400);
  return v;
}

function amount(value, { field, max }) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new AppError(`${field} must be more than 0`, 400);
  if (max != null && n > max) throw new AppError(`${field} can be at most ${max}`, 400);
  return Math.round(n * 100) / 100;
}

function assertId(kind, id) {
  if (!ID_PATTERNS[kind]?.test(id || '')) throw new AppError('Invalid ID', 400);
}

function datePartsIn(timeZone, date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function zonedMidnightUtc(dateStr, timeZone) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const shown = new Date(new Date(guess).toLocaleString('en-US', { timeZone }));
  const asUtc = new Date(new Date(guess).toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(guess - (shown - asUtc));
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const round2 = (n) => Math.round(n * 100) / 100;

function eventFor(row, name) {
  return (row?.attributed_events ?? []).find((e) => e.event_name === name);
}

export function createOpenAIAdsService({ adsClient, countOwnConversions, maxDailyBudget = 200, logger }) {
  const ensureConfigured = () => {
    if (!adsClient?.isConfigured?.()) throw new AppError('OpenAI Ads is not configured for this brand', 503);
  };

  const callApi = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(`OpenAI Ads API: ${err.message}`, 502);
    }
  };

  const rangeFor = (days, timeZone) => {
    const rangeDays = RANGE_DAYS.includes(Number(days)) ? Number(days) : 30;
    const until = datePartsIn(timeZone, new Date());
    return { rangeDays, since: addDays(until, -(rangeDays - 1)), until };
  };

  const getOverview = async ({ days } = {}) => {
    ensureConfigured();

    const [account, campaigns] = await callApi(() => Promise.all([adsClient.getAccount(), adsClient.listCampaigns()]));
    const timeZone = account?.timezone || 'Asia/Dubai';
    const { rangeDays, since, until } = rangeFor(days, timeZone);
    const campaignIds = campaigns.map((c) => c.id);

    const [delivery, conversions, own] = await Promise.all([
      campaignIds.length ? callApi(() => adsClient.getCampaignDelivery({ since, until })) : { data: [] },
      campaignIds.length ? callApi(() => adsClient.getCampaignConversions({ since, until, campaignIds })) : { data: [] },
      countOwnConversions
        ? countOwnConversions({ from: zonedMidnightUtc(since, timeZone), to: zonedMidnightUtc(addDays(until, 1), timeZone) })
          .catch((err) => {
            logger?.warn('[openai-ads] own conversion count failed', { error: err.message });
            return null;
          })
        : null,
    ]);

    const reviewById = new Map(
      await Promise.all(
        campaigns
          .filter((c) => c.status !== 'archived')
          .map(async (c) => {
            try {
              const groups = (await adsClient.listAdGroups(c.id)).filter((g) => g.status !== 'archived');
              const ads = (await Promise.all(groups.map((g) => adsClient.listAdsInGroup(g.id)))).flat().filter((a) => a.status !== 'archived');
              const review = (a) => a.review?.status ?? a.review_status;
              return [c.id, { ads: ads.length, rejected: ads.filter((a) => review(a) === 'rejected').length, inReview: ads.filter((a) => review(a) === 'in_review').length }];
            } catch {
              return [c.id, null];
            }
          }),
      ),
    );

    const deliveryById = new Map((delivery?.data ?? []).map((r) => [r.campaign_id, r]));
    const conversionsById = new Map((conversions?.data ?? []).map((r) => [r.entity_id, r]));

    const rows = campaigns.map((c) => {
      const d = deliveryById.get(c.id) ?? {};
      const conv = conversionsById.get(c.id);
      const order = eventFor(conv, 'order_created');
      const spend = Number(d.spend ?? 0);
      const orders = Number(order?.click_through_conversions ?? 0);
      const revenue = Number(conv?.order_created_attributed_sales ?? 0);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        goal: c.bidding_type === 'conversions' ? 'sales' : c.bidding_type,
        ads: reviewById.get(c.id) ?? null,
        dailyBudget: c.budget?.daily_spend_limit_micros != null ? c.budget.daily_spend_limit_micros / 1e6 : null,
        lifetimeBudget: c.budget?.lifetime_spend_limit_micros != null ? c.budget.lifetime_spend_limit_micros / 1e6 : null,
        locations: (c.targeting?.locations?.include ?? []).map((l) => l.name).filter(Boolean),
        impressions: Number(d.impressions ?? 0),
        clicks: Number(d.clicks ?? 0),
        spend: round2(spend),
        ctr: d.ctr != null ? Number(d.ctr) : null,
        cpc: d.cpc != null ? Number(d.cpc) : null,
        orders,
        viewThroughOrders: Number(order?.view_through_conversions ?? 0),
        revenue: round2(revenue),
        checkouts: Number(eventFor(conv, 'checkout_started')?.attributed_event_count ?? 0),
        costPerOrder: orders ? round2(spend / orders) : null,
        roas: spend ? round2(revenue / spend) : null,
      };
    });

    const sum = (key) => rows.reduce((acc, r) => acc + (r[key] ?? 0), 0);
    const totals = {
      impressions: sum('impressions'),
      clicks: sum('clicks'),
      spend: round2(sum('spend')),
      orders: sum('orders'),
      viewThroughOrders: sum('viewThroughOrders'),
      revenue: round2(sum('revenue')),
      checkouts: sum('checkouts'),
    };
    totals.costPerOrder = totals.orders ? round2(totals.spend / totals.orders) : null;
    totals.roas = totals.spend ? round2(totals.revenue / totals.spend) : null;

    return {
      account: { name: account?.account_name || account?.name, currency: account?.currency_code, timezone: timeZone, status: account?.status },
      range: { days: rangeDays, since, until },
      campaigns: rows.sort((a, b) => b.spend - a.spend || a.name.localeCompare(b.name)),
      totals,
      own,
    };
  };

  const setStatus = async (kind, id, action, performedBy) => {
    ensureConfigured();
    assertId(kind, id);
    if (!['pause', 'activate', 'archive'].includes(action)) throw new AppError('Invalid action', 400);
    const result = await callApi(() => adsClient.setStatus(kind, id, action));
    logger?.info('[openai-ads] status changed', { kind, id, action, performedBy });
    return { id: result?.id ?? id, status: result?.status };
  };

  const rename = async (kind, id, name, performedBy) => {
    ensureConfigured();
    assertId(kind, id);
    const clean = text(name, { field: 'Name', min: 3, max: 200 });
    const result = await callApi(() => adsClient.rename(kind, id, clean));
    logger?.info('[openai-ads] renamed', { kind, id, performedBy });
    return { id: result?.id ?? id, name: result?.name ?? clean };
  };

  const toDateIn = (unixSeconds, timeZone) => (unixSeconds ? datePartsIn(timeZone, new Date(unixSeconds * 1000)) : '');

  const parseDate = (value, field) => {
    if (value == null || value === '') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) throw new AppError(`${field} must be a date`, 400);
    return String(value);
  };

  const keepTargeting = (targeting = {}) => {
    const kept = {};
    for (const [key, value] of Object.entries(targeting ?? {})) {
      if (key === 'platforms' || value == null) continue;
      if (key === 'locations' || key === 'excluded_locations') {
        kept[key] = {
          ...(value.countries ? { countries: value.countries } : {}),
          ...(value.include ? { include: value.include.map((l) => ({ id: String(l.id) })) } : {}),
        };
      } else {
        kept[key] = value;
      }
    }
    return kept;
  };

  const getCampaignSettings = async (id) => {
    ensureConfigured();
    assertId('campaigns', id);
    const [account, campaign] = await callApi(() => Promise.all([adsClient.getAccount(), adsClient.getCampaign(id)]));
    const timeZone = account?.timezone || 'Asia/Dubai';
    return {
      id: campaign.id,
      name: campaign.name,
      goal: campaign.bidding_type === 'conversions' ? 'sales' : campaign.bidding_type,
      dailyBudget: campaign.budget?.daily_spend_limit_micros != null ? campaign.budget.daily_spend_limit_micros / 1e6 : null,
      locations: (campaign.targeting?.locations?.include ?? []).map((l) => ({
        id: String(l.id),
        name: l.type === 'country' ? l.name : `${l.name}, ${l.country_code ?? ''}`.replace(/, $/, ''),
        type: l.type,
      })),
      startDate: toDateIn(campaign.start_time, timeZone),
      endDate: toDateIn(campaign.end_time, timeZone),
      currency: account?.currency_code,
      maxDailyBudget,
    };
  };

  const updateCampaignSettings = async (id, input, performedBy) => {
    ensureConfigured();
    assertId('campaigns', id);
    const dailyBudget = amount(input?.dailyBudget, { field: 'Daily budget', max: maxDailyBudget });
    const locationIds = (Array.isArray(input?.locationIds) ? input.locationIds : []).filter((x) => /^\d{1,12}$/.test(String(x)));
    if (!locationIds.length) throw new AppError('Choose at least one location', 400);
    if (locationIds.length > 50) throw new AppError('Choose at most 50 locations', 400);
    const startDate = parseDate(input?.startDate, 'Start date');
    const endDate = parseDate(input?.endDate, 'End date');
    if (startDate && endDate && endDate < startDate) throw new AppError('End date must be after the start date', 400);

    const [account, campaign] = await callApi(() => Promise.all([adsClient.getAccount(), adsClient.getCampaign(id)]));
    const timeZone = account?.timezone || 'Asia/Dubai';
    const startTime = startDate ? Math.floor(zonedMidnightUtc(startDate, timeZone).getTime() / 1000) : null;
    const endTime = endDate ? Math.floor(zonedMidnightUtc(addDays(endDate, 1), timeZone).getTime() / 1000) : null;

    const body = {
      budget: { daily_spend_limit_micros: toMicros(dailyBudget) },
      targeting: { ...keepTargeting(campaign.targeting), locations: { include: locationIds.map((x) => ({ id: String(x) })) } },
      end_time: endTime,
      ...(startTime && toDateIn(campaign.start_time, timeZone) !== startDate ? { start_time: startTime } : {}),
    };
    await callApi(() => adsClient.updateCampaign(id, body));
    logger?.info('[openai-ads] campaign settings changed', { campaignId: id, dailyBudget, locations: locationIds.length, startDate, endDate, performedBy });
    return getCampaignSettings(id);
  };

  const getAdGroupSettings = async (id) => {
    ensureConfigured();
    assertId('ad_groups', id);
    const group = await callApi(() => adsClient.getAdGroup(id));
    return {
      id: group.id,
      name: group.name,
      contextHints: group.context_hints ?? [],
      bid: group.bidding_config?.max_bid_micros != null ? group.bidding_config.max_bid_micros / 1e6 : null,
    };
  };

  const updateAdGroupSettings = async (id, input, performedBy) => {
    ensureConfigured();
    assertId('ad_groups', id);
    assertId('campaigns', input?.campaignId);
    const hints = (Array.isArray(input?.contextHints) ? input.contextHints : []).map((h) => (typeof h === 'string' ? h.trim() : '')).filter(Boolean);
    if (hints.length > 20) throw new AppError('Use at most 20 audience hints', 400);
    if (hints.some((h) => h.length > 300)) throw new AppError('Each audience hint can be at most 300 characters', 400);

    const [group, campaign] = await callApi(() => Promise.all([adsClient.getAdGroup(id), adsClient.getCampaign(input.campaignId)]));
    const goal = campaign.bidding_type === 'conversions' ? 'sales' : 'clicks';
    const dailyBudget = campaign.budget?.daily_spend_limit_micros != null ? campaign.budget.daily_spend_limit_micros / 1e6 : maxDailyBudget;
    const hasBid = input?.bid !== '' && input?.bid != null;
    const bid = hasBid ? amount(input.bid, { field: goal === 'sales' ? 'Target cost per order' : 'Max cost per click', max: dailyBudget }) : null;

    const body = {
      context_hints: hints,
      ...(hasBid ? { bidding_config: { billing_event_type: group.bidding_config?.billing_event_type ?? 'click', max_bid_micros: toMicros(bid) } } : {}),
    };
    await callApi(() => adsClient.updateAdGroup(id, body));
    logger?.info('[openai-ads] ad group settings changed', { adGroupId: id, hints: hints.length, bid, performedBy });
    return getAdGroupSettings(id);
  };

  const setCampaignStatus = (id, action, performedBy) => setStatus('campaigns', id, action, performedBy);

  const getSetup = async () => {
    ensureConfigured();
    const [account, settings] = await callApi(() => Promise.all([adsClient.getAccount(), adsClient.listConversionEventSettings()]));
    const purchase = settings.find((s) => !s.archived && s.event_type === 'order_created');
    return {
      currency: account?.currency_code,
      website: account?.url,
      maxDailyBudget,
      salesGoalAvailable: Boolean(purchase),
    };
  };

  const searchLocations = async (q) => {
    ensureConfigured();
    const query = typeof q === 'string' ? q.trim().slice(0, 80) : '';
    if (query.length < 2) return [];
    const res = await callApi(() => adsClient.searchLocations(query));
    return (res?.results ?? []).map((l) => ({
      id: l.id,
      name: l.type === 'country' ? l.name : `${l.name}, ${l.parent_country ?? l.country_code}`,
      type: l.type,
    }));
  };

  const metricsFrom = (delivery, conversion) => {
    const order = eventFor(conversion, 'order_created');
    const spend = Number(delivery?.spend ?? 0);
    const clicks = Number(delivery?.clicks ?? 0);
    const impressions = Number(delivery?.impressions ?? 0);
    const orders = Number(order?.click_through_conversions ?? 0);
    return {
      impressions,
      clicks,
      spend: round2(spend),
      ctr: impressions ? clicks / impressions : null,
      cpc: clicks ? round2(spend / clicks) : null,
      orders,
      revenue: round2(Number(conversion?.order_created_attributed_sales ?? 0)),
      costPerOrder: orders ? round2(spend / orders) : null,
    };
  };

  const sumMetrics = (rows) => {
    const total = rows.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        spend: acc.spend + m.spend,
        orders: acc.orders + m.orders,
        revenue: acc.revenue + m.revenue,
      }),
      { impressions: 0, clicks: 0, spend: 0, orders: 0, revenue: 0 },
    );
    return {
      ...total,
      spend: round2(total.spend),
      revenue: round2(total.revenue),
      ctr: total.impressions ? total.clicks / total.impressions : null,
      cpc: total.clicks ? round2(total.spend / total.clicks) : null,
      costPerOrder: total.orders ? round2(total.spend / total.orders) : null,
    };
  };

  const getCampaignDetail = async (id, { days } = {}) => {
    ensureConfigured();
    assertId('campaigns', id);
    const [account, campaign, adGroups] = await callApi(() =>
      Promise.all([adsClient.getAccount(), adsClient.getCampaign(id), adsClient.listAdGroups(id)]),
    );
    const { rangeDays, since, until } = rangeFor(days, account?.timezone || 'Asia/Dubai');
    const visibleGroups = adGroups.filter((g) => g.status !== 'archived');
    const adsByGroup = await callApi(() => Promise.all(visibleGroups.map((g) => adsClient.listAdsInGroup(g.id))));
    const adIds = adsByGroup.flat().map((a) => a.id);

    const [delivery, conversions] = await Promise.all([
      callApi(() => adsClient.getAdDelivery({ campaignId: id, since, until })).catch((err) => {
        logger?.warn('[openai-ads] ad delivery failed', { campaignId: id, error: err.message });
        return { data: [] };
      }),
      adIds.length
        ? callApi(() => adsClient.getAdConversions({ since, until, adIds })).catch((err) => {
            logger?.warn('[openai-ads] ad conversions failed', { campaignId: id, error: err.message });
            return { data: [] };
          })
        : { data: [] },
    ]);
    const deliveryByAd = new Map((delivery?.data ?? []).map((r) => [r.ad_id, r]));
    const conversionsByAd = new Map((conversions?.data ?? []).map((r) => [r.entity_id, r]));

    const groups = visibleGroups.map((g, i) => {
      const ads = adsByGroup[i]
        .filter((a) => a.status !== 'archived')
        .map((a) => ({
          id: a.id,
          name: a.name,
          status: a.status,
          review: a.review?.status ?? a.review_status ?? null,
          title: a.creative?.title,
          body: a.creative?.body,
          targetUrl: a.creative?.target_url,
          imageFileId: a.creative?.file_id ?? null,
          ...metricsFrom(deliveryByAd.get(a.id), conversionsByAd.get(a.id)),
        }));
      return {
        id: g.id,
        name: g.name,
        status: g.status,
        bid: g.bidding_config?.max_bid_micros != null ? g.bidding_config.max_bid_micros / 1e6 : null,
        contextHints: g.context_hints ?? [],
        ads,
        ...sumMetrics(ads),
      };
    });

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      goal: campaign.bidding_type === 'conversions' ? 'sales' : campaign.bidding_type,
      dailyBudget: campaign.budget?.daily_spend_limit_micros != null ? campaign.budget.daily_spend_limit_micros / 1e6 : null,
      locations: (campaign.targeting?.locations?.include ?? []).map((l) => l.name).filter(Boolean),
      currency: account?.currency_code,
      range: { days: rangeDays, since, until },
      totals: sumMetrics(groups),
      adGroups: groups,
    };
  };

  const assertOwnSite = async (url) => {
    const account = await callApi(() => adsClient.getAccount());
    let target;
    try { target = new URL(url); } catch { throw new AppError('Landing page must be a full URL', 400); }
    if (target.protocol !== 'https:') throw new AppError('Landing page must start with https://', 400);
    const own = account?.url ? new URL(account.url).hostname.replace(/^www\./, '') : null;
    if (own && target.hostname.replace(/^www\./, '') !== own) {
      throw new AppError(`Landing page must be on ${own}`, 400);
    }
    return target.toString();
  };

  const buildAd = async (input) => ({
    name: text(input?.title, { field: 'Ad title', min: 3, max: 50 }),
    creative: {
      type: 'chat_card',
      title: text(input?.title, { field: 'Ad title', min: 3, max: 50 }),
      body: text(input?.body, { field: 'Ad text', min: 1, max: 100 }),
      target_url: await assertOwnSite(text(input?.targetUrl, { field: 'Landing page', min: 1, max: 2000 })),
      file_id: text(input?.imageFileId, { field: 'Image', min: 1, max: 200 }),
    },
  });

  const buildAdGroup = (input, { goal, dailyBudget }) => {
    const hints = Array.isArray(input?.contextHints) ? input.contextHints : [];
    const contextHints = hints.map((h) => (typeof h === 'string' ? h.trim() : '')).filter(Boolean).slice(0, 20);
    if (contextHints.some((h) => h.length > 300)) throw new AppError('Each audience hint can be at most 300 characters', 400);
    const bid = amount(input?.bid, { field: goal === 'sales' ? 'Target cost per order' : 'Max cost per click', max: dailyBudget ?? maxDailyBudget });
    return {
      name: text(input?.name, { field: 'Ad group name', min: 3, max: 200 }),
      context_hints: contextHints,
      bidding_config: { billing_event_type: 'click', max_bid_micros: toMicros(bid) },
    };
  };

  const createAdInGroup = async (adGroupId, input, performedBy) => {
    ensureConfigured();
    assertId('ad_groups', adGroupId);
    const ad = await buildAd(input);
    const created = await callApi(() => adsClient.createAd({ ...ad, ad_group_id: adGroupId, status: 'active' }));
    logger?.info('[openai-ads] ad created', { adId: created?.id, adGroupId, performedBy });
    return { id: created?.id };
  };

  const createAdGroupWithAd = async (campaignId, input, performedBy) => {
    ensureConfigured();
    assertId('campaigns', campaignId);
    const campaign = await callApi(() => adsClient.getCampaign(campaignId));
    const goal = campaign.bidding_type === 'conversions' ? 'sales' : 'clicks';
    const dailyBudget = campaign.budget?.daily_spend_limit_micros != null ? campaign.budget.daily_spend_limit_micros / 1e6 : null;
    const adGroup = buildAdGroup(input?.adGroup, { goal, dailyBudget });
    const ad = await buildAd(input?.ad);
    const createdGroup = await callApi(() => adsClient.createAdGroup({ ...adGroup, campaign_id: campaignId, status: 'active' }));
    logger?.info('[openai-ads] ad group created', { adGroupId: createdGroup?.id, campaignId, performedBy });
    try {
      await callApi(() => adsClient.createAd({ ...ad, ad_group_id: createdGroup.id, status: 'active' }));
    } catch (err) {
      logger?.warn('[openai-ads] ad group created without its ad', { adGroupId: createdGroup.id, error: err.message });
      return { id: createdGroup?.id, warning: `The ad group was created, but its ad was not: ${err.message}` };
    }
    return { id: createdGroup?.id };
  };

  const createCampaignWithAd = async (input, performedBy) => {
    ensureConfigured();
    const goal = Object.keys(GOALS).includes(input?.goal) ? input.goal : null;
    if (!goal) throw new AppError('Choose a goal', 400);
    const name = text(input?.name, { field: 'Campaign name', min: 3, max: 200 });
    const dailyBudget = amount(input?.dailyBudget, { field: 'Daily budget', max: maxDailyBudget });
    const locationIds = (Array.isArray(input?.locationIds) ? input.locationIds : []).filter((id) => /^\d{1,12}$/.test(String(id)));
    if (!locationIds.length) throw new AppError('Choose at least one location', 400);
    if (locationIds.length > 50) throw new AppError('Choose at most 50 locations', 400);
    const adGroup = buildAdGroup(input?.adGroup, { goal, dailyBudget });
    const ad = await buildAd(input?.ad);

    let conversionSettingId;
    if (goal === 'sales') {
      const settings = await callApi(() => adsClient.listConversionEventSettings());
      conversionSettingId = settings.find((s) => !s.archived && s.event_type === 'order_created')?.id;
      if (!conversionSettingId) throw new AppError('No purchase conversion is set up in OpenAI Ads Manager', 400);
    }

    const campaign = await callApi(() =>
      adsClient.createCampaign({
        name,
        status: 'paused',
        bidding_type: GOALS[goal],
        budget: { daily_spend_limit_micros: toMicros(dailyBudget) },
        ...(conversionSettingId ? { conversion_event_setting_ids: [conversionSettingId] } : {}),
        targeting: { locations: { include: locationIds.map((id) => ({ id: String(id) })) } },
      }),
    );
    logger?.info('[openai-ads] campaign created', { campaignId: campaign?.id, dailyBudget, goal, performedBy });

    try {
      const createdGroup = await callApi(() => adsClient.createAdGroup({ ...adGroup, campaign_id: campaign.id, status: 'active' }));
      await callApi(() => adsClient.createAd({ ...ad, ad_group_id: createdGroup.id, status: 'active' }));
    } catch (err) {
      logger?.warn('[openai-ads] campaign created without its ad', { campaignId: campaign.id, error: err.message });
      return { id: campaign.id, warning: `The campaign was created, but its ad was not: ${err.message}` };
    }
    return { id: campaign.id };
  };

  const duplicateCampaign = async (sourceId, input, performedBy) => {
    ensureConfigured();
    assertId('campaigns', sourceId);

    const source = await callApi(() => adsClient.getCampaign(sourceId));
    const sourceBudget = source.budget?.daily_spend_limit_micros != null ? source.budget.daily_spend_limit_micros / 1e6 : null;
    const name = text(input?.name ?? `${source.name} copy`, { field: 'Campaign name', min: 3, max: 200 });
    const dailyBudget = amount(input?.dailyBudget ?? sourceBudget, { field: 'Daily budget', max: maxDailyBudget });

    const goal = input?.goal ?? (source.bidding_type === 'conversions' ? 'sales' : 'clicks');
    if (!Object.keys(GOALS).includes(goal)) throw new AppError('Goal must be sales or clicks', 400);

    let locationIds = null;
    if (input?.locationIds !== undefined) {
      locationIds = (Array.isArray(input.locationIds) ? input.locationIds : []).filter((id) => /^\d{1,12}$/.test(String(id)));
      if (!locationIds.length) throw new AppError('Choose at least one location', 400);
      if (locationIds.length > 50) throw new AppError('Choose at most 50 locations', 400);
    }

    const clearBid = input?.clearBid === true;
    const bid = input?.bid != null && input.bid !== '' ? amount(input.bid, { field: 'Bid', max: dailyBudget }) : null;
    if (clearBid && bid != null) throw new AppError('Either set a bid or clear it, not both', 400);

    const targetUrl = input?.targetUrl ? await assertOwnSite(text(input.targetUrl, { field: 'Landing page', min: 1, max: 2000 })) : null;

    let conversionSettingIds = source.conversion_event_setting_ids ?? [];
    if (goal === 'sales' && !conversionSettingIds.length) {
      const settings = await callApi(() => adsClient.listConversionEventSettings());
      const purchase = settings.find((x) => !x.archived && x.event_type === 'order_created');
      if (!purchase) throw new AppError('No purchase conversion is set up in OpenAI Ads Manager', 400);
      conversionSettingIds = [purchase.id];
    }
    if (goal === 'clicks') conversionSettingIds = [];

    const groups = (await callApi(() => adsClient.listAdGroups(sourceId))).filter((g) => g.status !== 'archived');
    if (!groups.length) throw new AppError('That campaign has no ad groups to copy', 400);

    const adsByGroup = await callApi(() => Promise.all(groups.map((g) => adsClient.listAdsInGroup(g.id))));

    const campaign = await callApi(() =>
      adsClient.createCampaign({
        name,
        status: 'paused',
        bidding_type: GOALS[goal],
        budget: { daily_spend_limit_micros: toMicros(dailyBudget) },
        ...(conversionSettingIds.length ? { conversion_event_setting_ids: conversionSettingIds } : {}),
        targeting: locationIds
          ? { ...keepTargeting(source.targeting), locations: { include: locationIds.map((id) => ({ id: String(id) })) } }
          : keepTargeting(source.targeting),
      }),
    );
    logger?.info('[openai-ads] campaign duplicated', { from: sourceId, campaignId: campaign?.id, performedBy });

    const warnings = [];
    let copiedGroups = 0;
    let copiedAds = 0;

    for (const [i, group] of groups.entries()) {
      try {
        const created = await callApi(() =>
          adsClient.createAdGroup({
            name: group.name,
            context_hints: group.context_hints ?? [],
            bidding_config: {
              billing_event_type: group.bidding_config?.billing_event_type ?? 'click',
              ...(clearBid
                ? {}
                : { max_bid_micros: bid != null ? toMicros(bid) : group.bidding_config?.max_bid_micros }),
            },
            campaign_id: campaign.id,
            status: 'active',
          }),
        );
        copiedGroups += 1;

        for (const ad of adsByGroup[i].filter((a) => a.status !== 'archived')) {
          if (!ad.creative?.file_id) {
            warnings.push(`"${ad.name}" was skipped because its image could not be read`);
            continue;
          }
          await callApi(() =>
            adsClient.createAd({
              name: ad.name,
              creative: {
                type: 'chat_card',
                title: ad.creative.title,
                body: ad.creative.body,
                target_url: targetUrl ?? ad.creative.target_url,
                file_id: ad.creative.file_id,
              },
              ad_group_id: created.id,
              status: 'active',
            }),
          );
          copiedAds += 1;
        }
      } catch (err) {
        warnings.push(`Ad group "${group.name}" was not copied: ${err.message}`);
      }
    }

    return {
      id: campaign.id,
      name,
      goal,
      dailyBudget,
      adGroups: copiedGroups,
      ads: copiedAds,
      status: 'paused',
      ...(locationIds ? { locationsChanged: locationIds.length } : {}),
      ...(targetUrl ? { landingPage: targetUrl } : {}),
      ...(clearBid ? { bids: 'cleared' } : bid != null ? { bids: bid } : {}),
      ...(warnings.length ? { warnings } : {}),
    };
  };

  const uploadImage = async (file) => {
    ensureConfigured();
    if (!file?.buffer) throw new AppError('Choose an image', 400);
    if (!IMAGE_TYPES.includes(file.mimetype)) throw new AppError('Image must be PNG, JPG or WebP', 400);
    if (file.size > MAX_IMAGE_BYTES) throw new AppError('Image must be 5 MB or smaller', 400);
    const res = await callApi(() => adsClient.uploadImage({ buffer: file.buffer, filename: file.originalname || 'ad-image', mimetype: file.mimetype }));
    return { fileId: res?.file_id };
  };

  const previewAd = async (id) => {
    ensureConfigured();
    assertId('ads', id);
    const res = await callApi(() => adsClient.previewAd(id));
    const embed = res?.data?.[0]?.body ?? '';
    const url = embed.match(/src="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? null;
    if (!url?.startsWith('https://ads.openai.com/')) throw new AppError('OpenAI did not return a preview for this ad', 502);
    return { url };
  };

  return {
    getOverview,
    setCampaignStatus,
    setStatus,
    rename,
    getCampaignSettings,
    updateCampaignSettings,
    getAdGroupSettings,
    updateAdGroupSettings,
    getSetup,
    searchLocations,
    getCampaignDetail,
    createCampaignWithAd,
    duplicateCampaign,
    createAdGroupWithAd,
    createAdInGroup,
    uploadImage,
    previewAd,
  };
}
