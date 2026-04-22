const BREVO_URL = 'https://api.brevo.com/v3';

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

export function createBrevoClient({ apiKey, logger }) {
  const hasConfig = () => Boolean(apiKey);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'api-key': apiKey,
  });

  const logFailure = async (action, res) => {
    logger.warn('Brevo request failed', { action, statusCode: res.status, response: await parseResponseBody(res) });
  };

  const createContact = async ({ firstName, lastName, email }) => {
    if (!hasConfig()) {
      logger.warn('Brevo createContact skipped: BREVO_API_KEY missing', { email });
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

    if (!res.ok) { await logFailure('createContact', res); throw new Error('Brevo createContact failed'); }
    return true;
  };

  const updateContactAttribute = async ({ email, attribute, value }) => {
    if (!hasConfig()) {
      logger.warn('Brevo updateContactAttribute skipped: BREVO_API_KEY missing', { email, attribute });
      return false;
    }

    const res = await fetch(`${BREVO_URL}/contacts/${encodeURIComponent(email.toLowerCase())}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ attributes: { [attribute]: value } }),
    });

    if (!res.ok) { await logFailure('updateContactAttribute', res); throw new Error('Brevo updateContactAttribute failed'); }
    return true;
  };

  return { createContact, updateContactAttribute };
}
