/**
 * Delivery email via Resend (https://resend.com). Dependency-free: the Resend
 * API is a single authenticated POST, so we use fetch directly, same as the
 * Replicate client. Throws on a non-2xx so the caller can decide whether to
 * retry; it does NOT touch the order (idempotency lives in the caller).
 *
 * Copy follows BRAND.md: verdict first, plain, no hype, no em dashes.
 */

const RESEND_API = 'https://api.resend.com/emails';

/**
 * @param {Object} args
 * @param {string} args.to
 * @param {string} args.from        - a verified sender, e.g. "Headliner <hi@yourdomain.com>"
 * @param {string} args.resultsUrl  - the success page for this order
 * @param {AbortSignal} [args.signal]
 */
export async function sendDeliveryEmail({ to, from, resultsUrl, signal }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('[email] RESEND_API_KEY is required to send');

  const html = [
    '<div style="font-family:Inter,Arial,sans-serif;color:#0B0B0C;line-height:1.6">',
    '<h1 style="font-weight:600;font-size:22px;margin:0 0 12px">Your headshots are ready.</h1>',
    '<p style="margin:0 0 20px;color:#0B0B0C">They came out well. Open your gallery to view and download them.</p>',
    `<p style="margin:0 0 24px"><a href="${resultsUrl}" style="background:#2F5BFF;color:#FAF9F6;text-decoration:none;padding:12px 18px;border-radius:6px;display:inline-block">View my headshots</a></p>`,
    `<p style="margin:0;color:#6B6B70;font-size:13px">Or paste this link into your browser: ${resultsUrl}</p>`,
    '</div>',
  ].join('');

  const text = `Your headshots are ready.\n\nView and download them here: ${resultsUrl}`;

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Your headshots are ready',
      html,
      text,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[email] Resend ${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}
