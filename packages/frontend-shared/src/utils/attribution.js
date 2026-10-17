const STORAGE_KEY = 'attribution:v1';
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

const PARAMS = {
  utm_source: 'source',
  utm_medium: 'medium',
  utm_campaign: 'campaign',
  utm_term: 'term',
  utm_content: 'content',
  gclid: 'gclid',
  gbraid: 'gbraid',
  wbraid: 'wbraid',
  fbclid: 'fbclid',
  msclkid: 'msclkid',
  ttclid: 'ttclid',
  oppref: 'oppref',
};

const IGNORED_REFERRERS = ['stripe.com', 'paypal.com', 'accounts.google.com'];
const RETURN_PATH = /(payment|success|confirmation)/i;

let captured = false;

const bareHost = (host) => host.replace(/^www\./, '').toLowerCase();

function read() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored?.first?.capturedAt) return null;
    if (Date.now() - new Date(stored.first.capturedAt).getTime() > TTL_MS) return null;
    return stored;
  } catch {
    return null;
  }
}

function externalReferrer() {
  if (!document.referrer) return undefined;
  try {
    const host = bareHost(new URL(document.referrer).hostname);
    const own = bareHost(window.location.hostname);
    if (host === own || host.endsWith(`.${own}`) || own.endsWith(`.${host}`)) return undefined;
    if (IGNORED_REFERRERS.some((d) => host === d || host.endsWith(`.${d}`))) return undefined;
    return document.referrer;
  } catch {
    return undefined;
  }
}

export function captureAttribution() {
  if (captured || typeof window === 'undefined') return;
  captured = true;
  const url = new URL(window.location.href);
  const touch = { landingPage: `${url.pathname}${url.search}`, capturedAt: new Date().toISOString() };
  let campaign = false;
  for (const [param, key] of Object.entries(PARAMS)) {
    const value = url.searchParams.get(param);
    if (value) {
      touch[key] = value.slice(0, 500);
      campaign = true;
    }
  }
  const referrer = RETURN_PATH.test(url.pathname) ? undefined : externalReferrer();
  if (referrer) touch.referrer = referrer.slice(0, 500);

  const stored = read();
  if (stored && !campaign && !referrer) return;

  const next = { first: stored?.first ?? touch, last: campaign || referrer ? touch : stored?.last ?? touch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function getAttribution() {
  if (typeof window === 'undefined') return undefined;
  return read() ?? undefined;
}

const SEARCH_ENGINES = { google: 'Google', bing: 'Bing', yahoo: 'Yahoo', duckduckgo: 'DuckDuckGo', yandex: 'Yandex', ecosia: 'Ecosia' };
const AI_ASSISTANTS = { 'chatgpt.com': 'ChatGPT', 'chat.openai.com': 'ChatGPT', 'perplexity.ai': 'Perplexity', 'gemini.google.com': 'Gemini', 'copilot.microsoft.com': 'Copilot', 'claude.ai': 'Claude' };
const SOCIAL = { facebook: 'Facebook', instagram: 'Instagram', 'lnkd.in': 'LinkedIn', linkedin: 'LinkedIn', 't.co': 'X', twitter: 'X', 'x.com': 'X', tiktok: 'TikTok', youtube: 'YouTube', reddit: 'Reddit', whatsapp: 'WhatsApp', snapchat: 'Snapchat', pinterest: 'Pinterest' };

const PAID_MEDIUMS = /^(cpc|ppc|paid|paidsocial|paid_social|paid-social|cpm|display|ads?)$/i;

export function describeChannel(touch) {
  if (!touch) return 'Unknown';
  if (touch.gclid || touch.gbraid || touch.wbraid) return 'Google Ads';
  if (touch.msclkid) return 'Microsoft Ads';
  if (touch.ttclid) return 'TikTok Ads';
  if (touch.oppref) return 'ChatGPT Ads';
  if (touch.fbclid && PAID_MEDIUMS.test(touch.medium || '')) return 'Meta Ads';
  if (touch.source) {
    const paid = PAID_MEDIUMS.test(touch.medium || '');
    return `${touch.source}${touch.medium ? ` / ${touch.medium}` : ''}${paid ? ' (paid)' : ''}`;
  }
  if (touch.fbclid) return 'Facebook / Instagram';
  if (!touch.referrer) return 'Direct';

  let host;
  try {
    host = bareHost(new URL(touch.referrer).hostname);
  } catch {
    return 'Referral';
  }
  for (const [domain, name] of Object.entries(AI_ASSISTANTS)) if (host === domain || host.endsWith(`.${domain}`)) return `${name} (AI)`;
  for (const [key, name] of Object.entries(SEARCH_ENGINES)) if (host.split('.').includes(key)) return `${name} organic`;
  for (const [key, name] of Object.entries(SOCIAL)) if (host === key || host.split('.').includes(key)) return `${name} (social)`;
  return `Referral: ${host}`;
}

export const CHANNEL_LABELS = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  chatgpt_ads: 'ChatGPT Ads',
  microsoft_ads: 'Microsoft Ads',
  tiktok_ads: 'TikTok Ads',
  other_paid: 'Other paid',
  organic_search: 'Organic search',
  ai_assistant: 'AI assistants',
  social: 'Social',
  email: 'Email',
  referral: 'Referral',
  other_campaign: 'Other campaign',
  direct: 'Direct',
};

export const CHANNEL_OPTIONS = Object.entries(CHANNEL_LABELS).map(([value, label]) => ({ value, label }));

export function sourceLabel(attribution) {
  const last = attribution?.last ?? attribution?.first;
  if (!last) return null;
  return CHANNEL_LABELS[last.channel] ?? describeChannel(last);
}
