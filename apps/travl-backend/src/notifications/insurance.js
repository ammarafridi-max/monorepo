import { createNotificationsService } from '@travel-suite/notifications';
import { logger } from '@travel-suite/utils';
import { sendEmail } from '../utils/email.js';
import config from '../utils/config.js';

const SITE = 'https://www.travl.ae';

const customer = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: 'Travl',
    adminEmail: config.adminEmail,
    theme: { primaryColor: '#0d6a66', linkColor: '#0d6a66' },
  },
});

// Outbound brands are a deliberate exception to brand neutrality, confined to
// this app. Visa assistance is VisaWadi's; dummy tickets are Dummy Ticket 365's.
const UPSELLS = [
  {
    title: 'Get Visa Assistance',
    brand: 'VisaWadi',
    description: 'Schengen, UK, US and Saudi visas, handled end to end.',
    price: 'AED 299',
    ctaLabel: 'Get assistance',
    href: 'https://www.visawadi.com/uae',
  },
  {
    title: 'Book a Dummy Ticket',
    brand: 'Dummy Ticket 365',
    description: 'A verifiable flight reservation with a real PNR for your visa file.',
    price: 'USD 13',
    ctaLabel: 'Book now',
    href: 'https://www.dummyticket365.com',
  },
];

export function policyIssuedEmail(data) {
  return customer.sendPolicyIssuedToCustomer({
    ...data,
    refundBeforeStart: true,
    claimsUrl: `${SITE}/claims`,
    supportEmail: config.adminEmail,
    upsells: UPSELLS,
    footerNote: 'Underwritten by AXA. Travl Technologies LLC.',
  });
}

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
