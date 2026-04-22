import { logger } from '@travel-suite/utils';
import config from './config.js';

const BREVO_URL = 'https://api.brevo.com/v3';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'api-key': config.brevoApiKey,
});

const hasBrevoConfig = () => Boolean(config.brevoApiKey);

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

const logBrevoFailure = async (action, res) => {
  const body = await parseResponseBody(res);
  logger.warn('Brevo request failed', { action, statusCode: res.status, response: body });
};

export const createContact = async ({ firstName, lastName, email }) => {
  if (!hasBrevoConfig()) {
    logger.warn('Brevo createContact skipped because BREVO_API_KEY is missing', { email });
    return false;
  }

  const res = await fetch(`${BREVO_URL}/contacts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email: email.toLowerCase(),
      attributes: { FIRSTNAME: firstName, LASTNAME: lastName, PAYMENT_STATUS: 'UNPAID' },
      updateEnabled: true,
    }),
  });

  if (!res.ok) {
    await logBrevoFailure('createContact', res);
    throw new Error('Brevo sync failed');
  }

  return true;
};

export const updateContactAttribute = async ({ email, attribute, value }) => {
  if (!hasBrevoConfig()) {
    logger.warn('Brevo updateContactAttribute skipped because BREVO_API_KEY is missing', { email, attribute });
    return false;
  }

  const res = await fetch(`${BREVO_URL}/contacts/${encodeURIComponent(email.toLowerCase())}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ attributes: { [attribute]: value } }),
  });

  if (!res.ok) {
    await logBrevoFailure('updateContactAttribute', res);
    throw new Error('Brevo updateContactAttribute failed');
  }

  return true;
};
