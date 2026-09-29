import { createHash } from 'node:crypto';

const EVENTS_URL = 'https://bzr.openai.com/v1/events';
const TIMEOUT_MS = 5000;

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');

const hashedList = (value, normalize) => {
  if (typeof value !== 'string') return undefined;
  const normalized = normalize(value);
  return normalized ? [sha256(normalized)] : undefined;
};

const normalizeEmail = (v) => v.trim().toLowerCase();
const normalizePhone = (v) => {
  const digits = v.replace(/\D/g, '').replace(/^0+/, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : '';
};
const normalizeName = (v) => v.toLowerCase().replace(/[\s!-/:-@[-`{-~]/g, '');

const toMinorUnits = (value) => Math.round(Number(value || 0) * 100);

export function createOpenAICapiClient({ pixelId, apiKey, validateOnly = false, logger } = {}) {
  const isConfigured = () => Boolean(pixelId && apiKey);

  const sendEvent = async ({
    type,
    eventId,
    eventTime = new Date(),
    sourceUrl,
    user = {},
    data,
    customEventName,
  }) => {
    if (!isConfigured()) return null;

    const event = {
      id: eventId,
      type,
      timestamp_ms: new Date(eventTime).getTime(),
      action_source: 'web',
      source_url: sourceUrl,
      oppref: user.oppref || undefined,
      user: {
        emails_sha256: hashedList(user.email, normalizeEmail),
        phone_numbers_sha256: hashedList(user.phone, normalizePhone),
        first_names_sha256: hashedList(user.firstName, normalizeName),
        last_names_sha256: hashedList(user.lastName, normalizeName),
        external_ids_sha256: hashedList(user.externalId, (v) => v.trim()),
        obref: user.obref || undefined,
        ip_address: user.clientIp || undefined,
        user_agent: user.userAgent || undefined,
      },
      data,
      ...(customEventName ? { custom_event_name: customEventName } : {}),
    };

    const res = await fetch(`${EVENTS_URL}?pid=${encodeURIComponent(pixelId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ integration_source: 'travel-suite', validate_only: validateOnly, events: [event] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    if (!res.ok) {
      const detail = json?.error?.message ?? json?.message ?? `HTTP ${res.status}`;
      logger?.warn('[openai-capi] event rejected', { type, eventId, status: res.status, detail });
      throw new Error(detail);
    }
    return json;
  };

  const trackOrder = ({ eventId, value, currency, ...rest }) =>
    sendEvent({ type: 'order_created', eventId, data: { type: 'contents', amount: toMinorUnits(value), currency }, ...rest });

  const trackLead = ({ eventId, ...rest }) =>
    sendEvent({ type: 'lead_created', eventId, data: { type: 'customer_action' }, ...rest });

  return { isConfigured, sendEvent, trackOrder, trackLead };
}
