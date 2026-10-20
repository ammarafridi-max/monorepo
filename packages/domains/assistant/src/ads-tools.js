import { AppError } from '@travel-suite/utils';

export const ADS_READ_TOOLS = ['ads_setup', 'ads_overview', 'ads_campaign', 'ads_find_locations'];
export const ADS_WRITE_TOOLS = [
  'propose_ads_campaign',
  'propose_ads_duplicate',
  'propose_ads_adgroup',
  'propose_ads_ad',
  'propose_ads_replace_ad',
  'propose_ads_adgroup_settings',
  'propose_ads_rename',
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
        'Propose duplicating a campaign with every ad group and ad it contains. Anything you leave out is copied from the original, and what you set is applied to the copy: a new name, budget, goal, locations, landing page, or bid. Use this rather than building a campaign from scratch when the admin asks for a copy with changes, because it keeps every ad group. This does NOT copy anything until the admin approves, and the copy is created paused.',
      input_schema: {
        type: 'object',
        properties: {
          campaignId: { type: 'string', description: 'The campaign to copy' },
          name: { type: 'string', description: 'Name for the copy. Defaults to the original name plus "copy".' },
          dailyBudget: { type: 'number', description: 'Daily budget for the copy. Defaults to the original budget.' },
          goal: {
            type: 'string',
            enum: ['sales', 'clicks'],
            description: 'Goal for the copy. Defaults to the original goal. Sales needs a purchase conversion set up in the ad account.',
          },
          locationIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Replace the targeting with these location ids from ads_find_locations. Omit to keep the original targeting.',
          },
          targetUrl: {
            type: 'string',
            description:
              'Replace the landing page on every copied ad with this https url on the brand own site. Omit to keep each ad original url. Note that replacing it drops any tracking parameters the original urls carried.',
          },
          bid: { type: 'number', description: 'Set this bid on every copied ad group. Omit to keep each group own bid.' },
          clearBid: {
            type: 'boolean',
            description: 'Set true to copy the ad groups with no bid at all, letting OpenAI optimise. Use this when the admin asks for no target cost per order.',
          },
        },
        required: ['campaignId'],
      },
    },
    {
      name: 'propose_ads_adgroup',
      description:
        'Propose adding an ad group with its first ad to a campaign that already exists. Use this to fill an empty campaign or to add another audience to a live one.',
      input_schema: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
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
          imageFileId: {
            type: 'string',
            description:
              'Image id. Use one the admin has just attached in the chat, or one taken from an existing ad via ads_campaign.',
          },
        },
        required: ['title', 'body', 'targetUrl', 'imageFileId'],
      },
        },
        required: ['campaignId', 'adGroup', 'ad'],
      },
    },
    {
      name: 'propose_ads_ad',
      description: 'Propose adding another ad to an ad group that already exists.',
      input_schema: {
        type: 'object',
        properties: { adGroupId: { type: 'string' }, ad: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Headline, 3 to 50 characters' },
          body: { type: 'string', description: 'Ad text, 1 to 100 characters' },
          targetUrl: { type: 'string', description: 'An https landing page on this brand own website' },
          imageFileId: {
            type: 'string',
            description:
              'Image id. Use one the admin has just attached in the chat, or one taken from an existing ad via ads_campaign.',
          },
        },
        required: ['title', 'body', 'targetUrl', 'imageFileId'],
      } },
        required: ['adGroupId', 'ad'],
      },
    },
    {
      name: 'propose_ads_replace_ad',
      description:
        'Propose rewriting an ad. Ads cannot be edited in place, so this creates a replacement in the same ad group with the new wording and archives the old one. Use it to fix ad text, a landing page or an image.',
      input_schema: {
        type: 'object',
        properties: {
          adId: { type: 'string', description: 'The ad to replace' },
          adGroupId: { type: 'string', description: 'The ad group it belongs to' },
          ad: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Headline, 3 to 50 characters' },
          body: { type: 'string', description: 'Ad text, 1 to 100 characters' },
          targetUrl: { type: 'string', description: 'An https landing page on this brand own website' },
          imageFileId: {
            type: 'string',
            description:
              'Image id. Use one the admin has just attached in the chat, or one taken from an existing ad via ads_campaign.',
          },
        },
        required: ['title', 'body', 'targetUrl', 'imageFileId'],
      },
        },
        required: ['adId', 'adGroupId', 'ad'],
      },
    },
    {
      name: 'propose_ads_adgroup_settings',
      description: 'Propose changing an ad group audience hints, its bid, or both.',
      input_schema: {
        type: 'object',
        properties: {
          adGroupId: { type: 'string' },
          campaignId: { type: 'string', description: 'The campaign the ad group belongs to' },
          contextHints: { type: 'array', items: { type: 'string' }, description: 'Replaces the existing hints' },
          bid: { type: 'number', description: 'Leave out to keep the current bid' },
        },
        required: ['adGroupId', 'campaignId'],
      },
    },
    {
      name: 'propose_ads_rename',
      description: 'Propose renaming a campaign, ad group or ad.',
      input_schema: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['campaigns', 'ad_groups', 'ads'] },
          id: { type: 'string' },
          name: { type: 'string', description: '3 to 200 characters' },
        },
        required: ['kind', 'id', 'name'],
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
      description:
        'Propose pausing, activating or archiving a campaign, ad group or ad. Archiving is the closest thing to deleting. Needs the admin approval before it takes effect.',
      input_schema: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['campaigns', 'ad_groups', 'ads'] },
          id: { type: 'string' },
          action: {
            type: 'string',
            enum: ['pause', 'activate', 'archive'],
            description: 'Archiving is how something is removed. It cannot be undone from here.',
          },
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
    `Goal: ${input.goal ?? campaign.goal}${input.goal && input.goal !== campaign.goal ? ` (was ${campaign.goal})` : ''}`,
    `Daily budget: ${money(input.dailyBudget ?? campaign.dailyBudget, setup.currency)}`,
    input.locationIds
      ? `Locations: replaced with ${input.locationIds.length} new one${input.locationIds.length === 1 ? '' : 's'}`
      : `Locations: kept from the original (${campaign.locations.map((l) => l.name).join(', ') || 'none'})`,
    input.targetUrl
      ? `Landing page: every ad repointed to ${input.targetUrl}, dropping the original tracking parameters`
      : 'Landing page: each ad keeps its own',
    input.clearBid
      ? 'Bids: cleared, so OpenAI optimises instead of a target cost'
      : input.bid != null
        ? `Bids: ${money(input.bid, setup.currency)} on every ad group`
        : 'Bids: kept from the original',
    'Every ad group and ad in the original is copied',
    'The copy is created paused, so nothing spends until you activate it',
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

function adDetails(ad, label = 'Ad') {
  return [`${label} headline: ${ad?.title}`, `${label} body: ${ad?.body}`, `${label} landing page: ${ad?.targetUrl}`, `${label} image: ${ad?.imageFileId}`];
}

async function describeAdGroupProposal(ads, input) {
  const [setup, campaign] = await Promise.all([ads.getSetup(), ads.getCampaignSettings(requireId('campaign', input.campaignId))]);
  const hints = input.adGroup?.contextHints ?? [];

  return {
    summary: `Add the ad group "${input.adGroup?.name}" to "${campaign.name}"`,
    details: [
      `Bid: ${money(input.adGroup?.bid, setup.currency)}`,
      `Audience hints: ${hints.length ? hints.length : 'none'}`,
      ...adDetails(input.ad),
      'The ad group and its ad start active, inside whatever state the campaign is in',
    ],
  };
}

async function describeAdProposal(ads, input) {
  const group = await ads.getAdGroupSettings(requireId('ad group', input.adGroupId));

  return {
    summary: `Add an ad to the ad group "${group.name}"`,
    details: [...adDetails(input.ad), 'The new ad starts active and goes to OpenAI for review'],
  };
}

async function describeReplaceAdProposal(ads, input) {
  const group = await ads.getAdGroupSettings(requireId('ad group', input.adGroupId));
  requireId('ad', input.adId);

  return {
    summary: `Replace an ad in "${group.name}"`,
    details: [
      'Ads cannot be edited, so this creates the replacement first and archives the old ad after',
      ...adDetails(input.ad, 'New'),
      'If the new ad is created but archiving the old one fails, both will be live until you archive it yourself',
    ],
  };
}

async function describeAdGroupSettingsProposal(ads, input) {
  const [setup, group] = await Promise.all([ads.getSetup(), ads.getAdGroupSettings(requireId('ad group', input.adGroupId))]);
  requireId('campaign', input.campaignId);

  const details = [];
  if (input.contextHints) {
    details.push(`Audience hints: replaced with ${input.contextHints.length}, was ${group.contextHints.length}`);
  } else {
    details.push('Audience hints: unchanged');
  }
  details.push(
    input.bid != null
      ? `Bid: ${money(group.bid, setup.currency)} to ${money(input.bid, setup.currency)}`
      : `Bid: unchanged at ${money(group.bid, setup.currency)}`,
  );

  return { summary: `Change the ad group "${group.name}"`, details };
}

async function describeRenameProposal(ads, input) {
  const kind = KIND_LABELS[input.kind];
  if (!kind) throw new AppError('kind must be campaigns, ad_groups or ads', 400);

  let current = requireId(kind, input.id);
  if (input.kind === 'campaigns') current = (await ads.getCampaignSettings(input.id)).name;
  else if (input.kind === 'ad_groups') current = (await ads.getAdGroupSettings(input.id)).name;

  return { summary: `Rename the ${kind} "${current}" to "${input.name}"`, details: ['Only the name changes'] };
}


async function describeStatusProposal(ads, input) {
  const kind = KIND_LABELS[input.kind];
  if (!kind) throw new AppError('kind must be campaigns, ad_groups or ads', 400);

  let name = requireId(kind, input.id);
  if (input.kind === 'campaigns') {
    name = (await ads.getCampaignSettings(input.id)).name;
  } else if (input.kind === 'ad_groups') {
    name = (await ads.getAdGroupSettings(input.id)).name;
  }

  const verb = { pause: 'Pause', activate: 'Activate', archive: 'Archive' }[input.action];
  if (!verb) throw new AppError('action must be pause, activate or archive', 400);

  const note = {
    pause: 'Pausing stops its spend',
    activate: 'Activating lets it start spending again',
    archive: 'Archiving removes it from the account. This cannot be undone from here.',
  }[input.action];

  return { summary: `${verb} the ${kind} "${name}"`, details: [note] };
}

export async function describeAdsProposal({ name, input, ads }) {
  if (name === 'propose_ads_campaign') return describeCampaignProposal(ads, input);
  if (name === 'propose_ads_duplicate') return describeDuplicateProposal(ads, input);
  if (name === 'propose_ads_adgroup') return describeAdGroupProposal(ads, input);
  if (name === 'propose_ads_ad') return describeAdProposal(ads, input);
  if (name === 'propose_ads_replace_ad') return describeReplaceAdProposal(ads, input);
  if (name === 'propose_ads_adgroup_settings') return describeAdGroupSettingsProposal(ads, input);
  if (name === 'propose_ads_rename') return describeRenameProposal(ads, input);
  if (name === 'propose_ads_budget') return describeBudgetProposal(ads, input);
  if (name === 'propose_ads_status') return describeStatusProposal(ads, input);
  throw new AppError(`Unknown proposal "${name}"`, 400);
}

export async function executeAdsAction({ kind, params, ads, performedBy }) {
  if (kind === 'propose_ads_campaign') return ads.createCampaignWithAd(params, performedBy);

  if (kind === 'propose_ads_duplicate') {
    return ads.duplicateCampaign(
      params.campaignId,
      {
        name: params.name,
        dailyBudget: params.dailyBudget,
        goal: params.goal,
        locationIds: params.locationIds,
        targetUrl: params.targetUrl,
        bid: params.bid,
        clearBid: params.clearBid,
      },
      performedBy,
    );
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

  if (kind === 'propose_ads_adgroup') {
    return ads.createAdGroupWithAd(params.campaignId, { adGroup: params.adGroup, ad: params.ad }, performedBy);
  }

  if (kind === 'propose_ads_ad') {
    return ads.createAdInGroup(params.adGroupId, params.ad, performedBy);
  }

  if (kind === 'propose_ads_replace_ad') {
    const created = await ads.createAdInGroup(params.adGroupId, params.ad, performedBy);

    try {
      await ads.setStatus('ads', params.adId, 'archive', performedBy);
    } catch (err) {
      return {
        ...created,
        warnings: [`The replacement ad was created, but archiving the old one failed: ${err.message}. Both are live until you archive it.`],
      };
    }

    return { ...created, replaced: params.adId };
  }

  if (kind === 'propose_ads_adgroup_settings') {
    const current = await ads.getAdGroupSettings(params.adGroupId);
    return ads.updateAdGroupSettings(
      params.adGroupId,
      {
        campaignId: params.campaignId,
        contextHints: params.contextHints ?? current.contextHints,
        bid: params.bid ?? current.bid,
      },
      performedBy,
    );
  }

  if (kind === 'propose_ads_rename') {
    return ads.rename(params.kind, params.id, params.name, performedBy);
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
