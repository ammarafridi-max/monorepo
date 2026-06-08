import { renderInsurancePaymentTemplate } from './templates/insurance-payment.js';
import { renderTicketPaymentTemplate } from './templates/ticket-payment.js';
import { renderPaymentLinkPaidTemplate } from './templates/payment-link-paid.js';
import { renderVisaLeadTemplate } from './templates/visa-lead.js';
import { formatDate, formatToDDMMM, formatToDDMMMYYYYMixed, extractIataCode } from './helpers.js';

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

      const isLaterDate = !data.ticketDelivery?.immediate;
      const deliveryPrefix = isLaterDate
        ? `${formatToDDMMMYYYYMixed(data.ticketDelivery?.deliveryDate)} Delivery Date - `
        : '';

      await sendEmail({
        email: brand.adminEmail,
        name: brand.paymentsSenderName,
        subject: `${deliveryPrefix}Payment received — ${data.leadPassenger} · ${fromCode} → ${toCode} · ${depDDMMM}`,
        htmlContent,
      });
    } catch (err) {
      log('[notifications] sendTicketPaymentToAdmin failed', {
        leadPassenger: data.leadPassenger,
        err: err.message,
      });
    }
  }

  // -- 3b. Ticket payment (customer) ----------------------------------------
  //
  // Sent to the customer right after the admin notification on PAID. Plain
  // text only (renders identically across every mail client, looks personal,
  // no broken templates). Two copy variants:
  //   - immediate delivery: "we're preparing your ticket"
  //   - scheduled delivery: "your ticket is scheduled for <date>"
  // Best-effort — wrapped in try/catch so a send failure never breaks payment.

  async function sendTicketPaymentToCustomer(data) {
    try {
      if (!data?.email) return;

      const firstName = data.passengers?.[0]?.firstName?.trim() || 'there';
      const fromCode = extractIataCode(data.from) || data.from || '';
      const toCode = extractIataCode(data.to) || data.to || '';
      const depFull = formatToDDMMMYYYYMixed(data.departureDate);
      const isScheduled = !data.ticketDelivery?.immediate;
      const deliveryDate = formatToDDMMMYYYYMixed(data.ticketDelivery?.deliveryDate);
      const paxCount = (data.passengers || []).length;
      const paxLine = paxCount > 1
        ? `${data.leadPassenger} + ${paxCount - 1}`
        : data.leadPassenger || '—';

      const subject = isScheduled
        ? `Order confirmed — your dummy ticket is scheduled for ${deliveryDate}`
        : `Order confirmed — we're preparing your dummy ticket`;

      const whatHappensNext = isScheduled
        ? `What happens next\nWe'll email your dummy ticket to this address on the morning of your chosen delivery date. You don't need to do anything until then.`
        : `What happens next\nYou'll receive your dummy ticket by email shortly. Most orders are delivered within 15 minutes during working hours.`;

      const orderLines = [
        `- Route: ${fromCode} → ${toCode} (Departure ${depFull})`,
        `- Passengers: ${paxLine}`,
        `- Type: ${data.type || '—'}`,
        `- Validity: ${data.ticketValidity || '—'}`,
        isScheduled ? `- Delivery scheduled: ${deliveryDate}` : null,
      ].filter(Boolean).join('\n');

      const closingHelp = isScheduled
        ? `If your plans change before then, reply to this email and we'll bring the delivery forward (or adjust the dates).`
        : `If you need to make any changes or have a question, just reply to this email.`;

      const textContent = [
        `Hi ${firstName},`,
        ``,
        isScheduled
          ? `Thanks for your order. We've received your payment and your dummy ticket is scheduled for delivery on ${deliveryDate}.`
          : `Thanks for your order. We've received your payment and our team is preparing your dummy ticket now.`,
        ``,
        whatHappensNext,
        ``,
        `Your order`,
        orderLines,
        ``,
        closingHelp,
        ``,
        `Talk soon,`,
        `The ${brand.name} team`,
      ].join('\n');

      await sendEmail({
        email: data.email,
        name: data.leadPassenger,
        subject,
        textContent,
      });
    } catch (err) {
      log('[notifications] sendTicketPaymentToCustomer failed', {
        email: data?.email,
        err: err.message,
      });
    }
  }

  // -- 4. Custom payment link paid (admin) -----------------------------------

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

  // -- 5. Visa lead (admin) ---------------------------------------------------

  async function sendVisaLeadToAdmin(data) {
    try {
      const htmlContent = renderVisaLeadTemplate({ brand, ...data });
      const subject = `New visa lead: ${data.visaCountryName || ''} — ${data.firstName || ''} ${data.lastName || ''}`.trim();
      await sendEmail({
        email: brand.adminEmail,
        name: brand.teamName,
        subject,
        htmlContent,
      });
    } catch (err) {
      log('[notifications] sendVisaLeadToAdmin failed', {
        leadId: data.leadId,
        err: err.message,
      });
    }
  }

  return {
    sendInsuranceFormSubmission,
    sendInsurancePaymentToAdmin,
    sendTicketPaymentToAdmin,
    sendTicketPaymentToCustomer,
    sendPaymentLinkPaidToAdmin,
    sendVisaLeadToAdmin,
  };
}
