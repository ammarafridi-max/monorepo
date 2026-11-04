import { createHash } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_HOST = 'https://googleads.googleapis.com';
const DEFAULT_API_VERSION = 'v26';
const TIMEOUT_MS = 8000;
const TOKEN_SKEW_MS = 60_000;

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const normalizeEmail = (value) => {
  const email = String(value ?? '').trim().toLowerCase();
  const [user, domain] = email.split('@');
  if (!user || !domain || !domain.includes('.')) return '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${user.split('+')[0].replace(/\./g, '')}@${domain}`;
  }
  return `${user}@${domain}`;
};

const normalizePhone = (value) => {
  const digits = digitsOnly(value);
  return digits.length >= 7 ? `+${digits}` : '';
};

const formatDateTime = (value, offset) => {
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return null;
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
  if (!match) return null;
  const [, sign, hours, minutes] = match;
  const shift = (Number(hours) * 60 + Number(minutes)) * 60_000 * (sign === '-' ? -1 : 1);
  return `${new Date(ms + shift).toISOString().slice(0, 19).replace('T', ' ')}${offset}`;
};

export function googleClickIdsFrom(attribution) {
  const last = attribution?.last ?? {};
  const first = attribution?.first ?? {};
  return {
    gclid: last.gclid || first.gclid || undefined,
    gbraid: last.gbraid || first.gbraid || undefined,
    wbraid: last.wbraid || first.wbraid || undefined,
  };
}

export function createGoogleAdsConversionsClient({
  customerId,
  loginCustomerId,
  developerToken,
  clientId,
  clientSecret,
  refreshToken,
  apiVersion = DEFAULT_API_VERSION,
  timezoneOffset = '+00:00',
  logger,
} = {}) {
  const account = digitsOnly(customerId);
  const manager = digitsOnly(loginCustomerId);

  const isConfigured = () =>
    Boolean(account && developerToken && clientId && clientSecret && refreshToken);

  let cachedToken = null;

  const accessToken = async () => {
    if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_SKEW_MS) return cachedToken.value;
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.access_token) {
      throw new Error(json?.error_description ?? json?.error ?? `token HTTP ${res.status}`);
    }
    cachedToken = {
      value: json.access_token,
      expiresAt: Date.now() + Number(json.expires_in ?? 3600) * 1000,
    };
    return cachedToken.value;
  };

  const post = async (method, body) => {
    const res = await fetch(`${API_HOST}/${apiVersion}/customers/${account}:${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'developer-token': developerToken,
        Authorization: `Bearer ${await accessToken()}`,
        ...(manager ? { 'login-customer-id': manager } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = json?.error?.message ?? `HTTP ${res.status}`;
      logger?.warn('[google-ads-conversions] request rejected', { method, status: res.status, detail });
      throw new Error(detail);
    }
    if (json?.partialFailureError) {
      const detail = json.partialFailureError.message ?? 'partial failure';
      logger?.warn('[google-ads-conversions] upload rejected', { method, detail });
      throw new Error(detail);
    }
    return json;
  };

  const forAction = ({ conversionAction, valueRate = 1 } = {}) => {
    const ready = () => isConfigured() && Boolean(conversionAction);

    const identifiersFor = ({ email, phone }) => {
      const identifiers = [];
      const normalizedEmail = normalizeEmail(email);
      if (normalizedEmail) {
        identifiers.push({ hashedEmail: sha256(normalizedEmail), userIdentifierSource: 'FIRST_PARTY' });
      }
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone) {
        identifiers.push({ hashedPhoneNumber: sha256(normalizedPhone), userIdentifierSource: 'FIRST_PARTY' });
      }
      return identifiers;
    };

    const scaledValue = (value) => {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      return Math.round(amount * valueRate * 100) / 100;
    };

    const uploadConversion = async ({
      gclid,
      gbraid,
      wbraid,
      email,
      phone,
      orderId,
      value,
      currency,
      conversionTime = new Date(),
    } = {}) => {
      if (!ready()) return null;
      const identifiers = identifiersFor({ email, phone });
      if (!gclid && !gbraid && !wbraid && !identifiers.length) return null;
      const conversionDateTime = formatDateTime(conversionTime, timezoneOffset);
      if (!conversionDateTime) return null;
      const amount = scaledValue(value);
      return post('uploadClickConversions', {
        partialFailure: true,
        conversions: [
          {
            conversionAction,
            conversionDateTime,
            ...(gclid ? { gclid } : gbraid ? { gbraid } : wbraid ? { wbraid } : {}),
            ...(identifiers.length ? { userIdentifiers: identifiers } : {}),
            ...(orderId ? { orderId } : {}),
            ...(amount === null ? {} : { conversionValue: amount, currencyCode: currency }),
          },
        ],
      });
    };

    const uploadAdjustment = async ({
      orderId,
      gclid,
      conversionTime,
      adjustmentTime = new Date(),
      adjustmentType = 'RETRACTION',
      value,
      currency,
    } = {}) => {
      if (!ready()) return null;
      const adjustmentDateTime = formatDateTime(adjustmentTime, timezoneOffset);
      if (!adjustmentDateTime) return null;
      const conversionDateTime = conversionTime ? formatDateTime(conversionTime, timezoneOffset) : null;
      const identity = orderId
        ? { orderId }
        : gclid && conversionDateTime
          ? { gclidDateTimePair: { gclid, conversionDateTime } }
          : null;
      if (!identity) return null;
      const adjustment = { conversionAction, adjustmentDateTime, adjustmentType, ...identity };
      if (adjustmentType === 'RESTATEMENT') {
        const amount = scaledValue(value);
        if (amount === null) return null;
        adjustment.restatementValue = { adjustedValue: amount, currencyCode: currency };
      }
      return post('uploadConversionAdjustments', {
        partialFailure: true,
        conversionAdjustments: [adjustment],
      });
    };

    return { isConfigured: ready, uploadConversion, uploadAdjustment };
  };

  return { isConfigured, forAction };
}
