import { logger } from '@travel-suite/utils';
import { sendEmail } from '../utils/email.js';
import config from '../utils/config.js';

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Sent to the customer when their itinerary payment is confirmed. Attaches the
// clean, watermark-free PDF (fetched from Cloudinary) and links to the page where
// they can re-download. Best-effort: never throws into the Stripe webhook.
export async function itineraryPaymentCustomerEmail({
  email,
  name,
  sessionId,
  visaCountry,
  startDate,
  endDate,
  fromCity,
  toCity,
  pdfUrl,
}) {
  try {
    if (!email) return;

    const firstName = (name || '').trim().split(/\s+/)[0] || 'there';
    const route = [fromCity, toCity].filter(Boolean).join(' → ');
    const dates = [fmtDate(startDate), fmtDate(endDate)].filter(Boolean).join(' – ');
    const downloadLink = `${config.frontendUrl}/itinerary-booking/${sessionId}/success`;

    // Fetch the PDF and attach it (base64). If it can't be fetched, still send the
    // email with the download link so the customer is notified.
    let attachment;
    if (pdfUrl) {
      try {
        const res = await fetch(pdfUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          attachment = [{ content: buf.toString('base64'), name: 'travl-itinerary.pdf' }];
        } else {
          logger.warn('[itinerary-email] PDF fetch returned non-OK', { sessionId, status: res.status });
        }
      } catch (err) {
        logger.warn('[itinerary-email] Could not fetch PDF for attachment', { sessionId, error: err.message });
      }
    }

    const subject = visaCountry
      ? `Your travel itinerary for your ${visaCountry} visa application`
      : 'Your travel itinerary is ready';

    const summaryRows = [
      visaCountry && `<p><span class="bold">Applying to:</span> ${visaCountry}</p>`,
      route && `<p><span class="bold">Route:</span> ${route}</p>`,
      dates && `<p><span class="bold">Travel dates:</span> ${dates}</p>`,
    ].filter(Boolean).join('\n');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Your travel itinerary</title>
      <style>
        * { box-sizing: border-box; padding: 0; margin: 0; }
        body { font-family: Arial, sans-serif; color: #1f2937; }
        main { width: 600px; max-width: 100%; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
        p, span { font-size: 15px; line-height: 24px; }
        .bold { font-weight: 600; }
        .section { margin-bottom: 18px; }
        .btn { display: inline-block; background: #0d6a66; color: #fff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 22px; border-radius: 10px; }
        .muted { color: #6b7280; font-size: 13px; }
        @media screen and (max-width: 620px) { main { width: 100%; border: none; } }
      </style>
    </head>
    <body>
      <main>
        <p class="bold section" style="font-size:18px;">Your travel itinerary is ready 🎉</p>
        <div class="section">
          <p>Hi ${firstName},</p>
          <p>Thanks for your purchase — your payment is confirmed. Your embassy-ready, day-by-day travel itinerary is attached to this email as a PDF.</p>
        </div>
        ${summaryRows ? `<div class="section">${summaryRows}</div>` : ''}
        <div class="section">
          <a class="btn" href="${downloadLink}">Download your itinerary</a>
        </div>
        <p class="muted section">If the attachment doesn't open, use the button above to download it again any time. You have free edits available from that page too.</p>
        <p class="muted">Safe travels,<br/>The Travl team</p>
      </main>
    </body>
    </html>`;

    const textContent = [
      `Hi ${firstName},`,
      '',
      'Thanks for your purchase — your payment is confirmed. Your embassy-ready, day-by-day travel itinerary is attached to this email as a PDF.',
      '',
      visaCountry ? `Applying to: ${visaCountry}` : null,
      route ? `Route: ${route}` : null,
      dates ? `Travel dates: ${dates}` : null,
      '',
      `Download again any time: ${downloadLink}`,
      '',
      'Safe travels,',
      'The Travl team',
    ].filter((l) => l !== null).join('\n');

    await sendEmail({ email, name: name || firstName, subject, htmlContent, textContent, attachment });
  } catch (err) {
    logger.error('[itinerary-email] Failed to send itinerary email', { sessionId, error: err.message });
  }
}
