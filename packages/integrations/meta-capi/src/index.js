import { createHash } from 'node:crypto';

const GRAPH_URL = 'https://graph.facebook.com/v23.0';
const TIMEOUT_MS = 5000;

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const hashed = (value, normalize) => {
  if (typeof value !== 'string') return undefined;
  const normalized = normalize(value);
  return normalized ? [sha256(normalized)] : undefined;
};

const normalizeEmail = (v) => v.trim().toLowerCase();
const normalizePhone = (v) => v.replace(/\D/g, '');
const normalizeName = (v) => v.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function createMetaCapiClient({ pixelId, accessToken, testEventCode, logger } = {}) {
  const isConfigured = () => Boolean(pixelId && accessToken);

  const sendEvent = async ({
    eventName,
    eventId,
    eventTime = new Date(),
    eventSourceUrl,
    user = {},
    customData = {},
  }) => {
    if (!isConfigured()) return null;

    const userData = {
      em: hashed(user.email, normalizeEmail),
      ph: hashed(user.phone, normalizePhone),
      fn: hashed(user.firstName, normalizeName),
      ln: hashed(user.lastName, normalizeName),
      external_id: hashed(user.externalId, (v) => v.trim()),
      client_ip_address: user.clientIp || undefined,
      client_user_agent: user.userAgent || undefined,
      fbp: user.fbp || undefined,
      fbc: user.fbc || undefined,
    };

    const body = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(new Date(eventTime).getTime() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: eventSourceUrl,
          user_data: userData,
          custom_data: customData,
        },
      ],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
      access_token: accessToken,
    };

    const res = await fetch(`${GRAPH_URL}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = json?.error?.message ?? `HTTP ${res.status}`;
      logger?.warn('[meta-capi] event rejected', { eventName, eventId, status: res.status, detail });
      throw new Error(detail);
    }
    return json;
  };

  const trackPurchase = ({ eventId, value, currency, ...rest }) =>
    sendEvent({ eventName: 'Purchase', eventId, customData: { value, currency }, ...rest });

  return { isConfigured, sendEvent, trackPurchase };
}
