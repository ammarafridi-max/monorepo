import { sendEmail } from '../utils/email.js';
import config from '../utils/config.js';

export async function insurancePaymentCompletionEmail({
  leadTraveler, email, sessionId, policyId, policyNumber,
  amount, currency, journeyType, startDate, endDate, region, quoteId, mobile,
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Travel Insurance Payment - ${leadTraveler}</title>
      <style>
        * { box-sizing: border-box; padding: 0; margin: 0; }
        body { font-family: Arial, sans-serif; }
        main { width: 600px; margin: 0 auto; border: 1px solid lightgray; padding: 20px; }
        div, p, span { font-size: 15px; line-height: 24px; }
        .bold { font-weight: 600; }
        .section { margin-bottom: 18px; }
        @media screen and (max-width: 991px) { main { width: 100%; } }
      </style>
    </head>
    <body>
      <main>
        <p class="bold section">Payment received for travel insurance</p>
        <div class="section">
          <p><span class="bold">Lead traveler:</span> ${leadTraveler || '-'}</p>
          <p><span class="bold">Customer email:</span> ${email || '-'}</p>
          <p><span class="bold">Phone:</span> ${mobile || '-'}</p>
        </div>
        <div class="section">
          <p><span class="bold">Amount:</span> ${currency || ''} ${amount || ''}</p>
          <p><span class="bold">Session ID:</span> ${sessionId || '-'}</p>
          <p><span class="bold">Quote ID:</span> ${quoteId || '-'}</p>
        </div>
        <div class="section">
          <p><span class="bold">Policy ID:</span> ${policyId || '-'}</p>
          <p><span class="bold">Policy Number:</span> ${policyNumber || '-'}</p>
        </div>
        <div class="section">
          <p><span class="bold">Journey type:</span> ${journeyType || '-'}</p>
          <p><span class="bold">Travel dates:</span> ${startDate || '-'} to ${endDate || '-'}</p>
          <p><span class="bold">Region:</span> ${region || '-'}</p>
        </div>
      </main>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: config.adminEmail,
      name: 'Travl Team',
      subject: `Travel insurance payment received by ${leadTraveler || 'customer'}`,
      htmlContent,
    });
  } catch (err) {
    console.error('insurancePaymentCompletionEmail: email failed', err);
  }
}
