const BREVO_URL = 'https://api.brevo.com/v3';

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

export function createBrevoClient({ apiKey, logger } = {}) {
  const hasConfig = () => Boolean(apiKey);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'api-key': apiKey,
  });

  const logFailure = async (action, res) => {
    logger?.warn('Brevo request failed', {
      action,
      statusCode: res.status,
      response: await parseResponseBody(res),
    });
  };

  const skip = (action, meta) => {
    logger?.warn(`Brevo ${action} skipped because BREVO_API_KEY is missing`, meta);
    return false;
  };

  const upsertContact = async (action, body) => {
    const res = await fetch(`${BREVO_URL}/contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...body, email: body.email.toLowerCase(), updateEnabled: true }),
    });
    if (!res.ok) {
      await logFailure(action, res);
      throw new Error(`Brevo ${action} failed`);
    }
    return true;
  };

  const createContact = async ({ firstName, lastName, email }) => {
    if (!hasConfig()) return skip('createContact', { email });
    return upsertContact('createContact', {
      email,
      attributes: { FIRSTNAME: firstName, LASTNAME: lastName, PAYMENT_STATUS: 'UNPAID' },
    });
  };

  const subscribeContact = async ({ email, attributes = {} }) => {
    if (!hasConfig()) return skip('subscribeContact', { email });
    return upsertContact('subscribeContact', { email, attributes });
  };

  const addContactToReviewList = async ({ email, firstName, listId }) => {
    if (!hasConfig()) return skip('addContactToReviewList', { email });
    if (!listId) {
      logger?.warn('Brevo addContactToReviewList skipped because listId is missing', { email });
      return false;
    }
    return upsertContact('addContactToReviewList', {
      email,
      ...(firstName ? { attributes: { FIRSTNAME: firstName } } : {}),
      listIds: [Number(listId)],
    });
  };

  const updateContactAttribute = async ({ email, attribute, value }) => {
    if (!hasConfig()) return skip('updateContactAttribute', { email, attribute });

    const res = await fetch(`${BREVO_URL}/contacts/${encodeURIComponent(email.toLowerCase())}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ attributes: { [attribute]: value } }),
    });

    if (!res.ok) {
      await logFailure('updateContactAttribute', res);
      throw new Error('Brevo updateContactAttribute failed');
    }
    return true;
  };

  return { createContact, subscribeContact, addContactToReviewList, updateContactAttribute };
}
