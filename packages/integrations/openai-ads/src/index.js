const BASE_URL = 'https://api.ads.openai.com/v1';
const TIMEOUT_MS = 20000;

export function createOpenAIAdsClient({ apiKey, logger } = {}) {
  const isConfigured = () => Boolean(apiKey);

  const request = async (method, path, { query, body, form } = {}) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query || {})) {
      if (value == null) continue;
      if (Array.isArray(value)) value.forEach((v) => qs.append(`${key}[]`, v));
      else qs.append(key, String(value));
    }
    const url = `${BASE_URL}${path}${qs.toString() ? `?${qs}` : ''}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: form ?? (body ? JSON.stringify(body) : undefined),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    if (!res.ok) {
      const detail = json?.error?.message ?? `HTTP ${res.status}`;
      logger?.warn('[openai-ads] request failed', { method, path, status: res.status, detail });
      const error = new Error(detail);
      error.httpStatus = res.status;
      throw error;
    }
    return json;
  };

  const listAll = async (path, query = {}) => {
    const items = [];
    let after;
    do {
      const page = await request('GET', path, { query: { ...query, limit: 100, after } });
      items.push(...(page?.data ?? []));
      after = page?.has_more ? page.data.at(-1)?.id : undefined;
    } while (after);
    return items;
  };

  const dateRange = (since, until) => JSON.stringify({ type: 'date_range', since, until });

  return {
    isConfigured,
    getAccount: () => request('GET', '/ad_account'),
    listCampaigns: () => listAll('/campaigns'),
    listAds: () => listAll('/ads'),
    getCampaignDelivery: ({ since, until }) =>
      request('GET', '/ad_account/insights', {
        query: {
          aggregation_level: 'campaign',
          time_granularity: 'none',
          time_ranges: [dateRange(since, until)],
          fields: ['campaign.id', 'campaign.impressions', 'campaign.clicks', 'campaign.spend', 'campaign.ctr', 'campaign.cpc'],
        },
      }),
    getCampaignConversions: ({ since, until, campaignIds }) =>
      request('POST', '/conversions/insights', {
        body: {
          aggregation_level: 'campaign',
          time_ranges: [dateRange(since, until)],
          entity_ids: campaignIds,
          include: ['attributed_events'],
        },
      }),
    getAdDelivery: ({ campaignId, since, until }) =>
      request('GET', `/campaigns/${encodeURIComponent(campaignId)}/insights`, {
        query: {
          aggregation_level: 'ad',
          time_granularity: 'none',
          time_ranges: [dateRange(since, until)],
          fields: ['ad.id', 'ad_group.id', 'ad.impressions', 'ad.clicks', 'ad.spend', 'ad.ctr', 'ad.cpc'],
        },
      }),
    getAdConversions: ({ since, until, adIds }) =>
      request('POST', '/conversions/insights', {
        body: {
          aggregation_level: 'ad',
          time_ranges: [dateRange(since, until)],
          entity_ids: adIds,
          include: ['attributed_events'],
        },
      }),
    getCampaign: (id) => request('GET', `/campaigns/${encodeURIComponent(id)}`),
    listAdGroups: (campaignId) => listAll('/ad_groups', { campaign_id: campaignId }),
    listAdsInGroup: (adGroupId) => listAll('/ads', { ad_group_id: adGroupId }),
    listConversionEventSettings: () => listAll('/conversions/event_settings'),
    searchLocations: (q) => request('GET', '/geo_lookup/search', { query: { q, limit: 10 } }),
    createCampaign: (body) => request('POST', '/campaigns', { body }),
    createAdGroup: (body) => request('POST', '/ad_groups', { body }),
    createAd: (body) => request('POST', '/ads', { body }),
    previewAd: (id) => request('POST', `/ads/${encodeURIComponent(id)}/preview`),
    uploadImage: ({ buffer, filename, mimetype }) => {
      const form = new FormData();
      form.append('file', new Blob([buffer], { type: mimetype }), filename);
      return request('POST', '/upload', { form });
    },
    getAdGroup: (id) => request('GET', `/ad_groups/${encodeURIComponent(id)}`),
    updateCampaign: (id, body) => request('POST', `/campaigns/${encodeURIComponent(id)}`, { body }),
    updateAdGroup: (id, body) => request('POST', `/ad_groups/${encodeURIComponent(id)}`, { body }),
    rename: (kind, id, name) => request('POST', `/${kind}/${encodeURIComponent(id)}`, { body: { name } }),
    setStatus: (kind, id, action) => request('POST', `/${kind}/${encodeURIComponent(id)}/${action}`),
    pauseCampaign: (id) => request('POST', `/campaigns/${encodeURIComponent(id)}/pause`),
    activateCampaign: (id) => request('POST', `/campaigns/${encodeURIComponent(id)}/activate`),
  };
}
