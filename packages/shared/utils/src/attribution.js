const TOUCH_KEYS = [
  'source', 'medium', 'campaign', 'term', 'content',
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid', 'oppref',
  'landingPage', 'referrer',
];

export const ATTRIBUTION_CHANNELS = [
  'google_ads', 'meta_ads', 'chatgpt_ads', 'microsoft_ads', 'tiktok_ads', 'other_paid',
  'organic_search', 'ai_assistant', 'social', 'email', 'referral', 'other_campaign', 'direct',
];

const PAID_MEDIUM = /^(cpc|ppc|paid|paidsearch|paid_search|paid-search|paidsocial|paid_social|paid-social|cpm|display|ads?)$/i;
const AI_HOSTS = ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'gemini.google.com', 'copilot.microsoft.com', 'claude.ai'];
const SEARCH_ENGINES = ['google', 'bing', 'yahoo', 'duckduckgo', 'yandex', 'ecosia', 'baidu'];
const SOCIAL = ['facebook', 'instagram', 'linkedin', 'lnkd', 'twitter', 'tiktok', 'youtube', 'reddit', 'whatsapp', 'snapchat', 'pinterest', 'threads'];
const SOCIAL_HOSTS = ['t.co', 'x.com'];

function paidChannelFor(source) {
  const s = source.toLowerCase();
  if (/google|adwords/.test(s)) return 'google_ads';
  if (/facebook|instagram|meta|^fb$|^ig$/.test(s)) return 'meta_ads';
  if (/chatgpt|openai/.test(s)) return 'chatgpt_ads';
  if (/bing|microsoft/.test(s)) return 'microsoft_ads';
  if (/tiktok/.test(s)) return 'tiktok_ads';
  return 'other_paid';
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

export function classifyChannel(touch) {
  if (!touch) return 'direct';
  if (touch.gclid || touch.gbraid || touch.wbraid) return 'google_ads';
  if (touch.oppref) return 'chatgpt_ads';
  if (touch.msclkid) return 'microsoft_ads';
  if (touch.ttclid) return 'tiktok_ads';
  if (touch.fbclid && PAID_MEDIUM.test(touch.medium || '')) return 'meta_ads';
  if (touch.source) {
    const medium = touch.medium || '';
    if (PAID_MEDIUM.test(medium)) return paidChannelFor(touch.source);
    if (/e-?mail|newsletter/i.test(medium) || /e-?mail|newsletter|brevo/i.test(touch.source)) return 'email';
    if (/social/i.test(medium) || SOCIAL.some((n) => touch.source.toLowerCase().includes(n))) return 'social';
    if (/chatgpt|openai|perplexity|gemini|copilot|claude/i.test(touch.source)) return 'ai_assistant';
    return 'other_campaign';
  }
  if (touch.fbclid) return 'social';
  if (!touch.referrer) return 'direct';
  const host = hostOf(touch.referrer);
  if (!host) return 'referral';
  if (AI_HOSTS.some((d) => host === d || host.endsWith(`.${d}`))) return 'ai_assistant';
  const parts = host.split('.');
  if (SEARCH_ENGINES.some((n) => parts.includes(n))) return 'organic_search';
  if (SOCIAL_HOSTS.includes(host) || SOCIAL.some((n) => parts.includes(n))) return 'social';
  return 'referral';
}

export function attributionChannelFilter(channel) {
  return ATTRIBUTION_CHANNELS.includes(channel) ? { 'attribution.last.channel': channel } : {};
}

const touchFields = () => ({
  ...Object.fromEntries(TOUCH_KEYS.map((key) => [key, { type: String }])),
  capturedAt: { type: Date },
  channel: { type: String, enum: ATTRIBUTION_CHANNELS },
});

export const attributionSchemaField = () => ({ first: touchFields(), last: touchFields() });

function sanitizeTouch(touch) {
  if (!touch || typeof touch !== 'object') return undefined;
  const clean = {};
  for (const key of TOUCH_KEYS) {
    if (typeof touch[key] === 'string' && touch[key].trim()) clean[key] = touch[key].trim().slice(0, 500);
  }
  const capturedAt = touch.capturedAt ? new Date(touch.capturedAt) : null;
  if (capturedAt && !Number.isNaN(capturedAt.getTime())) clean.capturedAt = capturedAt;
  if (!Object.keys(clean).length) return undefined;
  clean.channel = classifyChannel(clean);
  return clean;
}

export function sanitizeAttribution(input) {
  if (!input || typeof input !== 'object') return undefined;
  const first = sanitizeTouch(input.first);
  const last = sanitizeTouch(input.last);
  return first || last ? { first, last } : undefined;
}
