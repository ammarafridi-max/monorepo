import { renderInsurancePaymentTemplate } from './templates/insurance-payment.js';
import { renderPolicyIssuedTemplate, renderPolicyIssuedText } from './templates/policy-issued.js';
import { renderInsuranceReminderTemplate, renderInsuranceReminderText } from './templates/insurance-payment-reminder.js';
import { renderTicketPaymentTemplate } from './templates/ticket-payment.js';
import { renderBookingPaymentTemplate } from './templates/booking-payment.js';
import { renderBookingPaymentAdminTemplate } from './templates/booking-payment-admin.js';
import { renderPaymentLinkPaidTemplate } from './templates/payment-link-paid.js';
import { renderHotelBookingPaidTemplate } from './templates/hotel-booking.js';
import { renderVisaLeadTemplate, renderVisaLeadCustomerTemplate } from './templates/visa-lead.js';
import {
  renderAffiliateWelcomeTemplate,
  renderAffiliateStatementTemplate,
} from './templates/affiliate.js';
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
import { format } from 'date-fns';
import { formatDate, formatToDDMMM, formatToDDMMMYYYYMixed, extractIataCode } from './helpers.js';

export function createNotificationsService({ sendEmail, logger, brand }) {
  const log = logger?.error?.bind(logger) ?? console.error;
  const productNoun = brand.productNoun ?? 'dummy ticket';

  const neverThrow = (fn, context = () => ({}), fallback) => async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      log(`[notifications] ${fn.name} failed`, { ...context(...args), err: err.message });
      return typeof fallback === 'function' ? fallback(err) : fallback;
    }
  };
  const failed = (err) => ({ ok: false, error: err.message });

  async function sendInsuranceFormSubmission({ passengers }) {
    const lead = passengers?.[0];
    const leadPassenger = lead ? `${lead.firstName} ${lead.lastName}` : 'unknown';

    await sendEmail({
      email: brand.adminEmail,
      name: brand.teamName,
      subject: `Travel insurance form submission by ${leadPassenger}`,
    });
  }

  async function sendInsurancePaymentToAdmin(data) {
    const htmlContent = renderInsurancePaymentTemplate({ brand, ...data });
    await sendEmail({
      email: brand.adminEmail,
      name: brand.teamName,
      subject: `Travel insurance payment received by ${data.leadTraveler || 'customer'}`,
      htmlContent,
    });
  }

  async function sendTicketPaymentToAdmin(data) {
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
  }

  async function sendTicketPaymentToCustomer(data) {
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

    const copy = isScheduled
      ? {
          subject: `Order confirmed — your ${productNoun} is scheduled for ${deliveryDate}`,
          intro: `Thanks for your order. We've received your payment and your ${productNoun} is scheduled for delivery on ${deliveryDate}.`,
          whatHappensNext: `What happens next\nWe'll email your ${productNoun} to this address on the morning of your chosen delivery date. You don't need to do anything until then.`,
          deliveryLine: `- Delivery scheduled: ${deliveryDate}`,
          closingHelp: `If your plans change before then, reply to this email and we'll bring the delivery forward (or adjust the dates).`,
        }
      : {
          subject: `Order confirmed — we're preparing your ${productNoun}`,
          intro: `Thanks for your order. We've received your payment and our team is preparing your ${productNoun} now.`,
          whatHappensNext: `What happens next\nYou'll receive your ${productNoun} by email shortly. Most orders are delivered within 15 minutes, any time of day.`,
          deliveryLine: null,
          closingHelp: `If you need to make any changes or have a question, just reply to this email.`,
        };

    const orderLines = [
      `- Route: ${fromCode} → ${toCode} (Departure ${depFull})`,
      `- Passengers: ${paxLine}`,
      `- Type: ${data.type || '—'}`,
      `- Validity: ${data.ticketValidity || '—'}`,
      copy.deliveryLine,
    ].filter(Boolean).join('\n');

    const textContent = [
      `Hi ${firstName},`,
      ``,
      copy.intro,
      ``,
      copy.whatHappensNext,
      ``,
      `Your order`,
      orderLines,
      ``,
      copy.closingHelp,
      ``,
      `Talk soon,`,
      `The ${brand.name} team`,
    ].join('\n');

    await sendEmail({
      email: data.email,
      name: data.leadPassenger,
      subject: copy.subject,
      textContent,
    });
  }

  async function sendPaymentLinkPaidToAdmin(data) {
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
  }

  async function sendBookingPaymentToAdmin(data) {
    const htmlContent = renderBookingPaymentAdminTemplate({ brand, ...data });
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';
    const sent = await sendEmail({
      email: brand.adminEmail,
      name: brand.paymentsSenderName,
      subject: `New booking paid — ${fullName} · ${data.bookingRef || ''}`,
      htmlContent,
    });
    return sent?.ok ?? false;
  }

  async function sendBookingConfirmationToCustomer(data) {
    if (!data?.email) return false;
    const htmlContent = renderBookingPaymentTemplate({ brand, ...data });
    const sent = await sendEmail({
      email: data.email,
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
      subject: `Booking confirmed — ${data.serviceName || 'Airport Transfer'} on ${data.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`,
      htmlContent,
    });
    return sent?.ok ?? false;
  }

  async function sendContactFormToAdmin({ name, email, subject, message }) {
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
  }

  async function sendVisaLeadToAdmin(data) {
    const htmlContent = renderVisaLeadTemplate({ brand, ...data });
    const subject = `New visa lead: ${data.visaCountryName || ''} — ${data.firstName || ''} ${data.lastName || ''}`.trim();
    await sendEmail({
      email: brand.adminEmail,
      name: brand.teamName,
      subject,
      htmlContent,
    });
  }

  async function sendVisaLeadToCustomer(data) {
    if (!data.email) return false;
    await sendEmail({
      email: data.email,
      name: data.firstName || data.email,
      subject: `We have your ${data.visaCountryName || ''} visa request`.replace('  ', ' '),
      htmlContent: renderVisaLeadCustomerTemplate({ brand, ...data }),
    });
    return true;
  }

  async function sendAffiliateWelcome(data) {
    if (!data?.email) return false;
    await sendEmail({
      email: data.email,
      name: data.name || data.email,
      subject: brand.name
        ? `You're set up as a ${brand.name} affiliate`
        : "You're set up as an affiliate",
      htmlContent: renderAffiliateWelcomeTemplate({ brand, ...data }),
    });
    return true;
  }

  async function sendAffiliatePayoutStatement(data) {
    if (!data?.email) return false;
    await sendEmail({
      email: data.email,
      name: data.name || data.email,
      subject: `Your affiliate statement${data.periodLabel ? ` for ${data.periodLabel}` : ''}`,
      htmlContent: renderAffiliateStatementTemplate({ brand, ...data }),
    });
    return true;
  }

  async function sendMagicLink({ email, magicLinkUrl }) {
    if (!email || !magicLinkUrl) return false;
    await sendEmail({
      email,
      name: email,
      subject: `Your ${brand.name} sign-in link`,
      htmlContent: renderMagicLink({ brand, magicLinkUrl }),
    });
    return true;
  }

  async function sendApplicationAssigned({ email, applicationRef, destinationCountry, magicLinkUrl }) {
    if (!email || !magicLinkUrl) return false;
    await sendEmail({
      email,
      name: email,
      subject: `Your ${destinationCountry || 'Schengen'} visa application ${applicationRef} is ready`,
      htmlContent: renderApplicationAssigned({ brand, applicationRef, destinationCountry, magicLinkUrl }),
    });
    return true;
  }

  async function sendDocumentRejected({ email, applicationRef, docType, rejectionReason, link }) {
    if (!email) return false;
    await sendEmail({
      email,
      name: email,
      subject: `Action needed on application ${applicationRef}`,
      htmlContent: renderDocumentRejected({ brand, applicationRef, docType, rejectionReason, link }),
    });
    return true;
  }

  async function sendAllDocumentsApproved({ email, applicationRef, destinationCountry, link }) {
    if (!email) return false;
    await sendEmail({
      email,
      name: email,
      subject: `All documents approved — application ${applicationRef}`,
      htmlContent: renderAllApproved({ brand, applicationRef, destinationCountry, link }),
    });
    return true;
  }

  async function sendChecklistCompleteToAdmin({ applicationRef, destinationCountry }) {
    await sendEmail({
      email: brand.adminEmail,
      name: brand.teamName,
      subject: `Documents complete — application ${applicationRef}`,
      htmlContent: renderChecklistCompleteAdmin({ brand, applicationRef, destinationCountry }),
    });
    return true;
  }

  async function sendDocumentsStillNeeded({ email, applicationRef, destinationCountry, missing, link }) {
    if (!email) return false;
    await sendEmail({
      email,
      name: email,
      subject: `Reminder — documents still needed for application ${applicationRef}`,
      htmlContent: renderDocumentsStillNeeded({ brand, applicationRef, destinationCountry, missing, link }),
    });
    return true;
  }

  async function sendRejectionReminder({ email, applicationRef, destinationCountry, rejected, link }) {
    if (!email) return false;
    await sendEmail({
      email,
      name: email,
      subject: `Reminder — a document still needs fixing for application ${applicationRef}`,
      htmlContent: renderRejectionReminder({ brand, applicationRef, destinationCountry, rejected, link }),
    });
    return true;
  }

  async function sendFileReadyForStaff({ applicationRef, destinationCountry }) {
    await sendEmail({
      email: brand.adminEmail,
      name: brand.teamName,
      subject: `Your turn — ${applicationRef} is ready to prepare`,
      htmlContent: renderFileReadyForStaff({ brand, applicationRef, destinationCountry }),
    });
    return true;
  }

  async function sendApplicationEscalated({ applicationRef, destinationCountry, customerEmail, reminderCount, link }) {
    await sendEmail({
      email: brand.adminEmail,
      name: brand.teamName,
      subject: `Application ${applicationRef} has gone quiet — needs a call`,
      htmlContent: renderApplicationEscalated({ brand, applicationRef, destinationCountry, customerEmail, reminderCount, link }),
    });
    return true;
  }


  const JOURNEY_LABEL = { single: 'Single Trip', annual: 'Annual Multi-Trip', biennial: 'Two-Year Multi-Trip' };
  const coverDate = (d) => {
    if (!d) return '';
    try { return format(new Date(`${String(d).slice(0, 10)}T00:00:00Z`), 'd MMM yyyy'); } catch { return String(d); }
  };

  async function sendPolicyIssuedToCustomer({
    email, firstName, policyNumber, journeyType, region, startDate, endDate,
    passengers = [], amount, currency, documents = [], attachments = [],
    refundBeforeStart = true, claimsUrl, supportEmail, upsells = [], footerNote,
  }) {
    if (!email || !policyNumber) return { ok: false, error: 'Missing customer email or policy number' };
    const amountLabel = [currency, typeof amount === 'number' ? amount.toFixed(2) : amount].filter(Boolean).join(' ');
    const travellers = passengers
      .map((p) => [p.title, p.firstName, p.lastName].filter(Boolean).join(' '))
      .filter(Boolean)
      .join(', ');
    const data = {
      brand,
      firstName,
      policyNumber,
      plan: JOURNEY_LABEL[journeyType] || journeyType,
      region,
      coverStart: coverDate(startDate),
      coverEnd: coverDate(endDate),
      travellers,
      amount: amountLabel,
      documents,
      attachedCount: attachments.length,
      refundBeforeStart,
      claimsUrl,
      supportEmail: supportEmail || brand.adminEmail,
      upsells,
      footerNote,
    };
    const result = await sendEmail({
      email,
      name: firstName,
      subject: `Your travel insurance is issued: policy ${policyNumber}`,
      htmlContent: renderPolicyIssuedTemplate(data),
      textContent: renderPolicyIssuedText(data),
      attachment: attachments,
    });
    return result?.ok === false ? { ok: false, error: result.error } : { ok: true };
  }

  async function sendInsurancePaymentReminder({
    email, firstName, journeyType, region, startDate, endDate,
    passengers = [], amount, currency, paymentUrl, quoteExpiresAt, supportEmail, footerNote,
  }) {
    if (!email || !paymentUrl) return { ok: false, error: 'Missing customer email or payment link' };
    const amountLabel = [currency, typeof amount === 'number' ? amount.toFixed(2) : amount].filter(Boolean).join(' ');
    const travellers = passengers
      .map((p) => [p.title, p.firstName, p.lastName].filter(Boolean).join(' '))
      .filter(Boolean)
      .join(', ');
    const data = {
      brand,
      firstName,
      plan: JOURNEY_LABEL[journeyType] || journeyType,
      region,
      coverStart: coverDate(startDate),
      coverEnd: coverDate(endDate),
      travellers,
      amount: amountLabel,
      paymentUrl,
      expiresOn: quoteExpiresAt ? coverDate(quoteExpiresAt) : '',
      supportEmail: supportEmail || brand.adminEmail,
      footerNote,
    };
    const result = await sendEmail({
      email,
      name: firstName,
      subject: `Your travel insurance quote is ready to pay`,
      htmlContent: renderInsuranceReminderTemplate(data),
      textContent: renderInsuranceReminderText(data),
    });
    return result?.ok === false ? { ok: false, error: result.error } : { ok: true };
  }

  async function sendHotelBookingPaymentToAdmin(data) {
    const htmlContent = renderHotelBookingPaidTemplate({ brand, ...data });
    const where = data.hotel?.name || data.destination?.cityName || 'hotel';
    await sendEmail({
      email: brand.adminEmail,
      name: brand.paymentsSenderName,
      subject: `Hotel reservation paid — ${data.leadGuest || 'customer'} · ${where} · ${formatToDDMMMYYYYMixed(data.checkIn)}`,
      htmlContent,
    });
  }

  return {
    sendInsuranceFormSubmission: neverThrow(sendInsuranceFormSubmission),
    sendPolicyIssuedToCustomer: neverThrow(sendPolicyIssuedToCustomer, ({ policyNumber }) => ({ policyNumber }), failed),
    sendInsurancePaymentReminder: neverThrow(sendInsurancePaymentReminder, ({ email }) => ({ email }), failed),
    sendInsurancePaymentToAdmin: neverThrow(sendInsurancePaymentToAdmin, (data) => ({ leadTraveler: data.leadTraveler })),
    sendTicketPaymentToAdmin: neverThrow(sendTicketPaymentToAdmin, (data) => ({ leadPassenger: data.leadPassenger })),
    sendTicketPaymentToCustomer: neverThrow(sendTicketPaymentToCustomer, (data) => ({ email: data?.email })),
    sendBookingPaymentToAdmin: neverThrow(sendBookingPaymentToAdmin, (data) => ({ bookingRef: data?.bookingRef }), false),
    sendBookingConfirmationToCustomer: neverThrow(sendBookingConfirmationToCustomer, (data) => ({ email: data?.email }), false),
    sendPaymentLinkPaidToAdmin: neverThrow(sendPaymentLinkPaidToAdmin, (data) => ({ paymentLinkId: data.paymentLinkId })),
    sendHotelBookingPaymentToAdmin: neverThrow(sendHotelBookingPaymentToAdmin, (data) => ({ sessionId: data.sessionId })),
    sendContactFormToAdmin: neverThrow(sendContactFormToAdmin, ({ name }) => ({ name }), false),
    sendVisaLeadToAdmin: neverThrow(sendVisaLeadToAdmin, (data) => ({ leadId: data.leadId })),
    sendVisaLeadToCustomer: neverThrow(sendVisaLeadToCustomer, (data) => ({ email: data.email }), false),
    sendAffiliateWelcome: neverThrow(sendAffiliateWelcome, (data) => ({ affiliateId: data?.affiliateId }), false),
    sendAffiliatePayoutStatement: neverThrow(sendAffiliatePayoutStatement, (data) => ({ affiliateId: data?.affiliateId }), false),
    sendMagicLink: neverThrow(sendMagicLink, ({ email }) => ({ email }), false),
    sendApplicationAssigned: neverThrow(sendApplicationAssigned, ({ applicationRef }) => ({ applicationRef }), false),
    sendDocumentRejected: neverThrow(sendDocumentRejected, ({ applicationRef }) => ({ applicationRef }), false),
    sendAllDocumentsApproved: neverThrow(sendAllDocumentsApproved, ({ applicationRef }) => ({ applicationRef }), false),
    sendChecklistCompleteToAdmin: neverThrow(sendChecklistCompleteToAdmin, ({ applicationRef }) => ({ applicationRef }), false),
    sendDocumentsStillNeeded: neverThrow(sendDocumentsStillNeeded, ({ applicationRef }) => ({ applicationRef }), false),
    sendRejectionReminder: neverThrow(sendRejectionReminder, ({ applicationRef }) => ({ applicationRef }), false),
    sendApplicationEscalated: neverThrow(sendApplicationEscalated, ({ applicationRef }) => ({ applicationRef }), false),
    sendFileReadyForStaff: neverThrow(sendFileReadyForStaff, ({ applicationRef }) => ({ applicationRef }), false),
  };
}
