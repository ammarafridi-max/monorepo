import { renderInsurancePaymentTemplate } from './templates/insurance-payment.js';
import { renderTicketPaymentTemplate } from './templates/ticket-payment.js';
import { renderBookingPaymentTemplate } from './templates/booking-payment.js';
import { renderBookingPaymentAdminTemplate } from './templates/booking-payment-admin.js';
import { renderPaymentLinkPaidTemplate } from './templates/payment-link-paid.js';
import { renderVisaLeadTemplate } from './templates/visa-lead.js';
import {
  renderMagicLink,
  renderApplicationAssigned,
  renderDocumentRejected,
  renderAllApproved,
  renderChecklistCompleteAdmin,
  renderDocumentsStillNeeded,
  renderRejectionReminder,
  renderApplicationEscalated,
  renderFileReadyForStaff,
} from './templates/visa-applications.js';
import { formatDate, formatToDDMMM, formatToDDMMMYYYYMixed, extractIataCode } from './helpers.js';

export function createNotificationsService({ sendEmail, logger, brand }) {
  const log = logger?.error?.bind(logger) ?? console.error;

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

  async function sendBookingPaymentToAdmin(data) {
    try {
      const htmlContent = renderBookingPaymentAdminTemplate({ brand, ...data });
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';
      const sent = await sendEmail({
        email: brand.adminEmail,
        name: brand.paymentsSenderName,
        subject: `New booking paid — ${fullName} · ${data.bookingRef || ''}`,
        htmlContent,
      });
      return sent?.ok ?? false;
    } catch (err) {
      log('[notifications] sendBookingPaymentToAdmin failed', {
        bookingRef: data?.bookingRef,
        err: err.message,
      });
      return false;
    }
  }

  async function sendBookingConfirmationToCustomer(data) {
    try {
      if (!data?.email) return false;
      const htmlContent = renderBookingPaymentTemplate({ brand, ...data });
      const sent = await sendEmail({
        email: data.email,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
        subject: `Booking confirmed — Airport Transfer on ${data.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`,
        htmlContent,
      });
      return sent?.ok ?? false;
    } catch (err) {
      log('[notifications] sendBookingConfirmationToCustomer failed', {
        email: data?.email,
        err: err.message,
      });
      return false;
    }
  }

  async function sendContactFormToAdmin({ name, email, subject, message }) {
    try {
      const textContent = [
        `Name: ${name}`,
        `Email: ${email}`,
        ``,
        `Subject: ${subject}`,
        ``,
        message,
      ].join('\n');
      const sent = await sendEmail({
        email: brand.adminEmail,
        name: brand.teamName,
        subject: `Contact form: ${subject} — ${name}`,
        textContent,
      });
      return sent?.ok ?? false;
    } catch (err) {
      log('[notifications] sendContactFormToAdmin failed', { name, err: err.message });
      return false;
    }
  }

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

  async function sendMagicLink({ email, magicLinkUrl }) {
    try {
      if (!email || !magicLinkUrl) return false;
      await sendEmail({
        email,
        name: email,
        subject: `Your ${brand.name} sign-in link`,
        htmlContent: renderMagicLink({ brand, magicLinkUrl }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendMagicLink failed', { email, err: err.message });
      return false;
    }
  }

  async function sendApplicationAssigned({ email, applicationRef, destinationCountry, magicLinkUrl }) {
    try {
      if (!email || !magicLinkUrl) return false;
      await sendEmail({
        email,
        name: email,
        subject: `Your ${destinationCountry || 'Schengen'} visa application ${applicationRef} is ready`,
        htmlContent: renderApplicationAssigned({ brand, applicationRef, destinationCountry, magicLinkUrl }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendApplicationAssigned failed', { applicationRef, err: err.message });
      return false;
    }
  }

  async function sendDocumentRejected({ email, applicationRef, docType, rejectionReason, link }) {
    try {
      if (!email) return false;
      await sendEmail({
        email,
        name: email,
        subject: `Action needed on application ${applicationRef}`,
        htmlContent: renderDocumentRejected({ brand, applicationRef, docType, rejectionReason, link }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendDocumentRejected failed', { applicationRef, err: err.message });
      return false;
    }
  }

  async function sendAllDocumentsApproved({ email, applicationRef, destinationCountry, link }) {
    try {
      if (!email) return false;
      await sendEmail({
        email,
        name: email,
        subject: `All documents approved — application ${applicationRef}`,
        htmlContent: renderAllApproved({ brand, applicationRef, destinationCountry, link }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendAllDocumentsApproved failed', { applicationRef, err: err.message });
      return false;
    }
  }

  async function sendChecklistCompleteToAdmin({ applicationRef, destinationCountry }) {
    try {
      await sendEmail({
        email: brand.adminEmail,
        name: brand.teamName,
        subject: `Documents complete — application ${applicationRef}`,
        htmlContent: renderChecklistCompleteAdmin({ brand, applicationRef, destinationCountry }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendChecklistCompleteToAdmin failed', { applicationRef, err: err.message });
      return false;
    }
  }

  async function sendDocumentsStillNeeded({ email, applicationRef, destinationCountry, missing, link }) {
    try {
      if (!email) return false;
      await sendEmail({
        email,
        name: email,
        subject: `Reminder — documents still needed for application ${applicationRef}`,
        htmlContent: renderDocumentsStillNeeded({ brand, applicationRef, destinationCountry, missing, link }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendDocumentsStillNeeded failed', { applicationRef, err: err.message });
      return false;
    }
  }

  async function sendRejectionReminder({ email, applicationRef, destinationCountry, rejected, link }) {
    try {
      if (!email) return false;
      await sendEmail({
        email,
        name: email,
        subject: `Reminder — a document still needs fixing for application ${applicationRef}`,
        htmlContent: renderRejectionReminder({ brand, applicationRef, destinationCountry, rejected, link }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendRejectionReminder failed', { applicationRef, err: err.message });
      return false;
    }
  }

  async function sendFileReadyForStaff({ applicationRef, destinationCountry }) {
    try {
      await sendEmail({
        email: brand.adminEmail,
        name: brand.teamName,
        subject: `Your turn — ${applicationRef} is ready to prepare`,
        htmlContent: renderFileReadyForStaff({ brand, applicationRef, destinationCountry }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendFileReadyForStaff failed', { applicationRef, err: err.message });
      return false;
    }
  }

  async function sendApplicationEscalated({ applicationRef, destinationCountry, customerEmail, reminderCount, link }) {
    try {
      await sendEmail({
        email: brand.adminEmail,
        name: brand.teamName,
        subject: `Application ${applicationRef} has gone quiet — needs a call`,
        htmlContent: renderApplicationEscalated({ brand, applicationRef, destinationCountry, customerEmail, reminderCount, link }),
      });
      return true;
    } catch (err) {
      log('[notifications] sendApplicationEscalated failed', { applicationRef, err: err.message });
      return false;
    }
  }

  return {
    sendInsuranceFormSubmission,
    sendInsurancePaymentToAdmin,
    sendTicketPaymentToAdmin,
    sendTicketPaymentToCustomer,
    sendBookingPaymentToAdmin,
    sendBookingConfirmationToCustomer,
    sendPaymentLinkPaidToAdmin,
    sendContactFormToAdmin,
    sendVisaLeadToAdmin,
    sendMagicLink,
    sendApplicationAssigned,
    sendDocumentRejected,
    sendAllDocumentsApproved,
    sendChecklistCompleteToAdmin,
    sendDocumentsStillNeeded,
    sendRejectionReminder,
    sendApplicationEscalated,
    sendFileReadyForStaff,
  };
}
