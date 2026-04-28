import { renderInsurancePaymentTemplate } from './templates/insurance-payment.js';
import { renderTicketPaymentTemplate } from './templates/ticket-payment.js';
import { renderTicketScheduledDeliveryTemplate } from './templates/ticket-scheduled-delivery.js';
import { renderPaymentLinkPaidTemplate } from './templates/payment-link-paid.js';
import { formatDate, formatToDDMMM, extractIataCode } from './helpers.js';

/**
 * @param {{
 *   sendEmail: (args: { email: string, name: string, subject: string, htmlContent?: string, textContent?: string }) => Promise<any>,
 *   logger?: { error: Function },
 *   brand: {
 *     name: string,
 *     teamName: string,
 *     adminEmail: string,
 *     website: string,
 *     paymentsSenderName: string,
 *     deliverySenderName: string,
 *     customerSenderName: string,
 *     theme: { primaryColor: string, accentColor: string, linkColor: string },
 *   }
 * }} deps
 */
export function createNotificationsService({ sendEmail, logger, brand }) {
  const log = logger?.error?.bind(logger) ?? console.error;

  // -- 1. Insurance form submission ------------------------------------------

  async function sendInsuranceFormSubmission({ passengers }) {
    try {
      const lead = passengers?.[0];
      const leadPassenger = lead ? `${lead.firstName} ${lead.lastName}` : 'unknown';

      await sendEmail({
        email: brand.adminEmail,
        name: brand.teamName,
        subject: `Travel insurance form submission by ${leadPassenger}`,
      });
    } catch (err) {
      log('[notifications] sendInsuranceFormSubmission failed', { err: err.message });
    }
  }

  // -- 2. Insurance payment (admin) ------------------------------------------

  async function sendInsurancePaymentToAdmin(data) {
    try {
      const htmlContent = renderInsurancePaymentTemplate({ brand, ...data });
      await sendEmail({
        email: brand.adminEmail,
        name: brand.teamName,
        subject: `Travel insurance payment received by ${data.leadTraveler || 'customer'}`,
        htmlContent,
      });
    } catch (err) {
      log('[notifications] sendInsurancePaymentToAdmin failed', {
        leadTraveler: data.leadTraveler,
        err: err.message,
      });
    }
  }

  // -- 3. Ticket payment (admin) ---------------------------------------------

  async function sendTicketPaymentToAdmin(data) {
    try {
      const htmlContent = renderTicketPaymentTemplate({ brand, ...data });
      const fromCode = extractIataCode(data.from) || data.from || '';
      const toCode   = extractIataCode(data.to)   || data.to   || '';
      const depDDMMM = formatToDDMMM(data.departureDate);

      await sendEmail({
        email: brand.adminEmail,
        name: brand.paymentsSenderName,
        subject: `Payment received — ${data.leadPassenger} · ${fromCode} → ${toCode} · ${depDDMMM}`,
        htmlContent,
      });
    } catch (err) {
      log('[notifications] sendTicketPaymentToAdmin failed', {
        leadPassenger: data.leadPassenger,
        err: err.message,
      });
    }
  }

  // -- 4. Ticket scheduled delivery (admin) ----------------------------------

  async function sendTicketScheduledDeliveryToAdmin(data) {
    try {
      const htmlContent = renderTicketScheduledDeliveryTemplate({ brand, ...data });
      const fromCode = extractIataCode(data.from) || data.from || '';
      const toCode   = extractIataCode(data.to)   || data.to   || '';
      const depDDMMM = formatToDDMMM(data.departureDate);

      await sendEmail({
        email: brand.adminEmail,
        name: brand.deliverySenderName,
        subject: `ACTION REQUIRED — Deliver today · ${data.leadPassenger} · ${fromCode} → ${toCode} · ${depDDMMM}`,
        htmlContent,
      });
    } catch (err) {
      log('[notifications] sendTicketScheduledDeliveryToAdmin failed', {
        leadPassenger: data.leadPassenger,
        err: err.message,
      });
    }
  }

  // -- 5. Later-date delivery confirmation (customer) ------------------------

  async function sendLaterDateDeliveryToCustomer({ to, passenger, deliveryDate }) {
    try {
      await sendEmail({
        email: to,
        name: brand.customerSenderName,
        subject: `Your flight reservation will be delivered on ${formatDate(deliveryDate)}`,
        textContent: [
          `Hi ${passenger},`,
          '',
          `Thank you for booking your dummy ticket with ${brand.name}.`,
          '',
          `Your flight reservation will be sent to your email address as per your requested date on ${formatDate(deliveryDate)}.`,
          '',
          `If you accidentally selected the later date delivery option and want your dummy ticket to be issued now, please reply to this email and we'll issue and send your dummy ticket as soon as possible.`,
          '',
          `Best regards,`,
          `${brand.name} team`,
          brand.website,
        ].join('\n'),
      });
    } catch (err) {
      log('[notifications] sendLaterDateDeliveryToCustomer failed', {
        to,
        passenger,
        err: err.message,
      });
    }
  }

  // -- 6. Custom payment link paid (admin) -----------------------------------

  async function sendPaymentLinkPaidToAdmin(data) {
    try {
      const currency = String(data.currency || '').toUpperCase();
      const amountFormatted = `${currency} ${Number(data.amount || 0).toFixed(2)}`;
      const payerName = data.payerName || 'customer';

      const htmlContent = renderPaymentLinkPaidTemplate({
        brand,
        amountFormatted,
        payerName,
        payerEmail: data.payerEmail,
        description: data.description,
        createdByName: data.createdByName,
        paymentLinkId: data.paymentLinkId,
        sessionId: data.sessionId,
        paidAt: data.paidAt ? formatDate(data.paidAt) : '',
      });

      await sendEmail({
        email: brand.adminEmail,
        name: brand.paymentsSenderName,
        subject: `${amountFormatted} paid by ${payerName} using custom payment link`,
        htmlContent,
      });
    } catch (err) {
      log('[notifications] sendPaymentLinkPaidToAdmin failed', {
        paymentLinkId: data.paymentLinkId,
        err: err.message,
      });
    }
  }

  return {
    sendInsuranceFormSubmission,
    sendInsurancePaymentToAdmin,
    sendTicketPaymentToAdmin,
    sendTicketScheduledDeliveryToAdmin,
    sendLaterDateDeliveryToCustomer,
    sendPaymentLinkPaidToAdmin,
  };
}
