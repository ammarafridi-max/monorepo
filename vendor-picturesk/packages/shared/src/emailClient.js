/**
 * Transactional email via Brevo (https://www.brevo.com) transactional API.
 *
 * A shared connection/client helper in the same spirit as redis.js / storage.js:
 * a factory (createEmailClient) that centralises the provider + sender so every
 * service sends mail the same way and can never drift. No import-time side
 * effects; the API key and sender are passed in when the factory is called.
 *
 * Dependency-free: a Brevo transactional send is a single authenticated POST, so
 * we use fetch directly, exactly like replicateClient.js. No SDK is needed, which
 * keeps this consistent with the repo's "one POST = just fetch" convention.
 *
 * Copy follows BRAND.md: verdict first, plain, no hype, no em dashes.
 */

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

/**
 * Normalise a sender given as "Name <email@host>" or { name, email } into the
 * { name, email } shape Brevo's payload wants.
 */
function normalizeSender(sender) {
  if (sender && typeof sender === 'object' && sender.email) {
    return { name: sender.name || 'Picturesk.ai', email: sender.email };
  }
  if (typeof sender === 'string') {
    const m = sender.match(/^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/);
    if (m) return { name: m[1] || 'Picturesk.ai', email: m[2] };
    if (sender.includes('@')) return { name: 'Picturesk.ai', email: sender.trim() };
  }
  throw new Error('[email] createEmailClient: sender must be "Name <email>" or { name, email }');
}

/**
 * Build the Brevo email client.
 *
 * @param {Object} opts
 * @param {string} opts.apiKey - Brevo API key (BREVO_API_KEY)
 * @param {{ name?: string, email: string } | string} opts.sender - the From
 *        identity, as "Name <email>" or { name, email }. The email must be a
 *        verified Brevo sender.
 * @returns {{ sendDeliveryEmail: (args: {
 *   to: string,
 *   resultsUrl: string,
 *   orderId: string,
 *   thumbnailUrls?: readonly string[],
 *   linkLifetime?: string,
 *   signal?: AbortSignal,
 * }) => Promise<any> }}
 */
export function createEmailClient({ apiKey, sender }) {
  if (!apiKey) throw new Error('[email] createEmailClient: apiKey is required');
  const from = normalizeSender(sender);

  /** One authenticated Brevo transactional POST. Throws on non-2xx (caller retries). */
  async function send({ to, subject, html, text, signal }) {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: from,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`[email] Brevo ${res.status} ${res.statusText}: ${body}`);
    }
    return res.json();
  }

  return {
    /**
     * The delivery email. Branded per BRAND.md; sends the customer to their
     * results page. Idempotency lives in the caller (deliveredEmailSentAt), not
     * here: this just sends, and throws on failure so the caller can retry.
     */
    async sendDeliveryEmail({ to, resultsUrl, orderId, thumbnailUrls = [], linkLifetime, signal }) {
      const { subject, html, text } = renderDeliveryEmail({
        resultsUrl,
        orderId,
        thumbnailUrls,
        linkLifetime,
      });
      return send({ to, subject, html, text, signal });
    },
  };
}

// Forest & Gold palette. Deep green ink on warm sand, green CTA, gold as a
// sparing accent. Constant NAMES are kept from the old palette to minimize edits
// (COBALT is now a deep green; SERIF is now the humanist sans, matching the site).
const INK = '#163A33';
const BONE = '#F5EFE2';
const COBALT = '#0E4A44';
const ASH = '#5F6B62';
const LINE = '#E4DCC8';
const GOLD = '#E7B24C';

// Body and headings share the humanist sans stack (matching the site), falling
// back to Arial. SERIF keeps its name but now points at the same sans stack.
const SANS = "Inter, -apple-system, 'Segoe UI', Arial, sans-serif";
const SERIF = SANS;

/**
 * Render the branded delivery email (HTML + plain-text alternative).
 *
 * Table-based layout with inline styles for mail-client compatibility. Truthful
 * copy only: we say the headshots are ready and point at the gallery, nothing the
 * system does not back. No PII beyond the results link and the order id.
 *
 * @param {Object} args
 * @param {string} args.resultsUrl
 * @param {string} args.orderId
 * @param {readonly string[]} [args.thumbnailUrls] - the delivered (culled) set;
 *        a few are embedded as a preview, but the CTA is the primary action
 * @param {string} [args.linkLifetime] - short truthful line on link availability
 */
export function renderDeliveryEmail({ resultsUrl, orderId, thumbnailUrls = [], linkLifetime }) {
  const subject = 'Your headshots are ready';
  const preheader = 'Open your gallery to view and download the full set.';
  const lifetimeLine =
    linkLifetime ||
    'The link stays available, so you can come back and download the set anytime. We still recommend saving your favorites now.';

  // Up to three preview thumbnails, each linking to the gallery. Only rendered if
  // there is a delivered set to show.
  const previews = thumbnailUrls.slice(0, 3);
  const thumbsRow = previews.length
    ? `
      <tr>
        <td style="padding:0 0 28px 0">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
            <tr>
              ${previews
                .map(
                  (url) => `<td style="padding-right:10px" valign="top">
                <a href="${resultsUrl}" style="text-decoration:none">
                  <img src="${url}" width="140" height="140" alt="Your headshot" style="display:block;width:140px;height:140px;object-fit:cover;border-radius:6px;border:1px solid ${LINE}" />
                </a>
              </td>`
                )
                .join('')}
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${BONE};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:${BONE};height:0;width:0;overflow:hidden;mso-hide:all">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BONE};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px;max-width:520px;background:${BONE};">
          <tr>
            <td style="padding:0 0 28px 0;font-family:${SANS};font-size:15px;font-weight:600;letter-spacing:0.02em;color:${INK}">
              Picturesk.ai
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:600;color:${INK}">
              Your headshots are ready.
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 28px 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${INK}">
              They came out well. Open your gallery to view the full set and download the ones you want.
            </td>
          </tr>
          ${thumbsRow}
          <tr>
            <td style="padding:0 0 28px 0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
                <tr>
                  <td align="center" style="border-radius:6px;background:${COBALT};border-top:3px solid ${GOLD}">
                    <a href="${resultsUrl}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:16px;font-weight:600;color:${BONE};text-decoration:none;border-radius:6px">
                      View my headshots
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 28px 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${ASH}">
              ${lifetimeLine}
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 28px 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${ASH}">
              Our promise: if these don't look like you, just reply to this email within 14 days and we'll refund you in full.
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid ${LINE};padding:20px 0 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${ASH}">
              Trouble with the button? Paste this link into your browser:<br />
              <a href="${resultsUrl}" style="color:${COBALT};text-decoration:none;word-break:break-all">${resultsUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0 0 0;font-family:${SANS};font-size:12px;color:${ASH}">
              Order ${orderId}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'Your headshots are ready.',
    '',
    'They came out well. View the full set and download the ones you want here:',
    resultsUrl,
    '',
    lifetimeLine,
    '',
    "Our promise: if these don't look like you, just reply to this email within 14 days and we'll refund you in full.",
    '',
    `Order ${orderId}`,
  ].join('\n');

  return { subject, html, text };
}
