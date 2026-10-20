import { AppError } from '@travel-suite/utils';

export const ADS_READ_TOOLS = ['ads_setup', 'ads_overview', 'ads_campaign', 'ads_find_locations'];
export const ADS_WRITE_TOOLS = [
  'propose_ads_campaign',
  'propose_ads_duplicate',
  'propose_ads_budget',
  'propose_ads_status',
];

const MAX_DAYS = 90;

function clampDays(days) {
  const parsed = Number(days);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return Math.min(Math.trunc(parsed), MAX_DAYS);
}

function requireId(kind, value) {
  const id = String(value ?? '').trim();
  if (!id) throw new AppError(`A ${kind} id is required`, 400);
  return id;
}

export function buildAdsToolDefinitions({ canWrite }) {
  const read = [
    {
      name: 'ads_setup',
      description:
        'The OpenAI Ads account for this brand: currency, the website ads must point at, the daily budget ceiling, and whether the sales goal is available. Read this before proposing anything.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'ads_overview',
      description: 'Every campaign with its spend, impressions, clicks, CTR, CPC and attributed orders over a window.',
      input_schema: {
        type: 'object',
        properties: { days: { type: 'integer', description: `Days to look back, max ${MAX_DAYS}, default 30` } },
      },
    },
    {
      name: 'ads_campaign',
      description:
        'One campaign broken down by ad group and ad, each with its own metrics, review status, headline, body text and the id of the image it uses. Use it to analyse what is working and to copy creative into a new campaign.',
      input_schema: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
          days: { type: 'integer', description: `Days to look back, max ${MAX_DAYS}, default 30` },
        },
        required: ['campaignId'],
      },
    },
    {
      name: 'ads_find_locations',
      description: 'Look up targetable locations by name. You need the ids before proposing a campaign.',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'A city or country name, at least 2 characters' } },
        required: ['query'],
      },
    },
  ];

  if (!canWrite) return read;

  return [
    ...read,
    {
      name: 'propose_ads_campaign',
      description:
        'Propose a new campaign with one ad group and one ad. This does NOT create anything: it puts the proposal in front of the admin to approve or reject. Campaigns are always created paused. The ad needs the id of an image already uploaded to this ad account, so reuse one from an existing ad via ads_campaign.',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Campaign name, 3 to 200 characters' },
          goal: { type: 'string', enum: ['sales', 'clicks'] },
          dailyBudget: { type: 'number', description: 'Daily budget in the account currency, within the account ceiling' },
          locationIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Location ids from ads_find_locations, at least one and at most 50',
          },
          adGroup: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '3 to 200 characters' },
              bid: { type: 'number', description: 'Target cost per order for the sales goal, or max cost per click' },
              contextHints: {
                type: 'array',
                items: { type: 'string' },
                description: 'Up to 20 audience hints, each at most 300 characters',
              },
            },
            required: ['name', 'bid'],
          },
          ad: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Headline, 3 to 50 characters' },
              body: { type: 'string', description: 'Ad text, 1 to 100 characters' },
              targetUrl: { type: 'string', description: 'An https landing page on this brand own website' },
              imageFileId: { type: 'string', description: 'Image id taken from an existing ad' },
            },
            required: ['title', 'body', 'targetUrl', 'imageFileId'],
          },
        },
        required: ['name', 'goal', 'dailyBudget', 'locationIds', 'adGroup', 'ad'],
      },
    },
    {
      name: 'propose_ads_duplicate',
      description:
        'Propose duplicating a campaign with every ad group and ad it contains, optionally under a new name or budget. This does NOT copy anything until the admin approves. The copy is created paused.',
      input_schema: {
        type: 'object',
        properties: {
          campaignId: { type: 'string', description: 'The campaign to copy' },
          name: { type: 'string', description: 'Name for the copy. Defaults to the original name plus "copy".' },
          dailyBudget: { type: 'number', description: 'Daily budget for the copy. Defaults to the original budget.' },
        },
        required: ['campaignId'],
      },
    },
    {
      name: 'propose_ads_budget',
      description: 'Propose changing a campaign daily budget. Needs the admin approval before it takes effect.',
      input_schema: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
          dailyBudget: { type: 'number', description: 'New daily budget in the account currency' },
        },
        required: ['campaignId', 'dailyBudget'],
      },
    },
    {
      name: 'propose_ads_status',
      description: 'Propose pausing or activating a campaign, ad group or ad. Needs the admin approval before it takes effect.',
      input_schema: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['campaigns', 'ad_groups', 'ads'] },
          id: { type: 'string' },
          action: { type: 'string', enum: ['pause', 'activate'] },
        },
        required: ['kind', 'id', 'action'],
      },
    },
  ];
}

const money = (value, currency) => `${currency ?? ''} ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`.trim();

async function describeCampaignProposal(ads, input) {
  const setup = await ads.getSetup();

  const details = [
    `Goal: ${input.goal === 'sales' ? 'sales' : 'clicks'}`,
    `Daily budget: ${money(input.dailyBudget, setup.currency)}`,
    `Locations: ${input.locationIds.length} selected`,
    `Ad group: ${input.adGroup?.name}, bid ${money(input.adGroup?.bid, setup.currency)}`,
    `Headline: ${input.ad?.title}`,
    `Body: ${input.ad?.body}`,
    `Landing page: ${input.ad?.targetUrl}`,
    'Created paused, so nothing spends until you activate it',
  ];

  return { summary: `Create the campaign "${input.name}"`, details };
}

async function describeDuplicateProposal(ads, input) {
  const [setup, campaign] = await Promise.all([ads.getSetup(), ads.getCampaignSettings(requireId('campaign', input.campaignId))]);

  const details = [
    `Copying: ${campaign.name}`,
    `Goal: ${campaign.goal}`,
    `Daily budget: ${money(input.dailyBudget ?? campaign.dailyBudget, setup.currency)}`,
    'Every ad group and ad in the original is copied',
    'The copy is created paused',
  ];

  return { summary: `Duplicate "${campaign.name}" as "${input.name ?? `${campaign.name} copy`}"`, details };
}

async function describeBudgetProposal(ads, input) {
  const [setup, campaign] = await Promise.all([ads.getSetup(), ads.getCampaignSettings(requireId('campaign', input.campaignId))]);

  return {
    summary: `Change the daily budget on "${campaign.name}"`,
    details: [
      `Now: ${money(campaign.dailyBudget, setup.currency)}`,
      `After: ${money(input.dailyBudget, setup.currency)}`,
      `Account ceiling: ${money(setup.maxDailyBudget, setup.currency)}`,
    ],
  };
}

const KIND_LABELS = { campaigns: 'campaign', ad_groups: 'ad group', ads: 'ad' };

async function describeStatusProposal(ads, input) {
  const kind = KIND_LABELS[input.kind];
  if (!kind) throw new AppError('kind must be campaigns, ad_groups or ads', 400);

  let name = requireId(kind, input.id);
  if (input.kind === 'campaigns') {
    name = (await ads.getCampaignSettings(input.id)).name;
  } else if (input.kind === 'ad_groups') {
    name = (await ads.getAdGroupSettings(input.id)).name;
  }

  return {
    summary: `${input.action === 'pause' ? 'Pause' : 'Activate'} the ${kind} "${name}"`,
    details: [input.action === 'activate' ? 'Activating lets it start spending again' : 'Pausing stops its spend'],
  };
}

export async function describeAdsProposal({ name, input, ads }) {
  if (name === 'propose_ads_campaign') return describeCampaignProposal(ads, input);
  if (name === 'propose_ads_duplicate') return describeDuplicateProposal(ads, input);
  if (name === 'propose_ads_budget') return describeBudgetProposal(ads, input);
  if (name === 'propose_ads_status') return describeStatusProposal(ads, input);
  throw new AppError(`Unknown proposal "${name}"`, 400);
}

export async function executeAdsAction({ kind, params, ads, performedBy }) {
  if (kind === 'propose_ads_campaign') return ads.createCampaignWithAd(params, performedBy);

  if (kind === 'propose_ads_duplicate') {
    return ads.duplicateCampaign(params.campaignId, { name: params.name, dailyBudget: params.dailyBudget }, performedBy);
  }

  if (kind === 'propose_ads_budget') {
    const current = await ads.getCampaignSettings(params.campaignId);
    return ads.updateCampaignSettings(
      params.campaignId,
      {
        dailyBudget: params.dailyBudget,
        locationIds: current.locations.map((location) => location.id),
        startDate: current.startDate,
        endDate: current.endDate,
      },
      performedBy,
    );
  }

  if (kind === 'propose_ads_status') {
    return ads.setStatus(params.kind, params.id, params.action, performedBy);
  }

  throw new AppError(`Unknown action "${kind}"`, 400);
}

export async function executeAdsRead({ name, input, ads }) {
  if (name === 'ads_setup') {
    const setup = await ads.getSetup();
    return { result: { source: 'openai-ads', ...setup }, rowCount: 1 };
  }

  if (name === 'ads_overview') {
    const overview = await ads.getOverview({ days: clampDays(input?.days) });
    return { result: { source: 'openai-ads', ...overview }, rowCount: overview?.campaigns?.length ?? 0 };
  }

  if (name === 'ads_campaign') {
    const detail = await ads.getCampaignDetail(requireId('campaign', input?.campaignId), { days: clampDays(input?.days) });
    return { result: { source: 'openai-ads', ...detail }, rowCount: detail?.adGroups?.length ?? 0 };
  }

  if (name === 'ads_find_locations') {
    const locations = await ads.searchLocations(input?.query);
    return { result: { source: 'openai-ads', locations }, rowCount: locations.length };
  }

  throw new AppError(`Unknown ads tool "${name}"`, 400);
}
