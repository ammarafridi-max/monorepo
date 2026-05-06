import { formatDate, formatDubaiTime, formatToDDMMMYYYY, extractIataCode, paxType } from '../helpers.js';

function row(label, value, i) {
  const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
  return `
    <tr>
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:140px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

export function renderTicketPaymentTemplate({
  brand,
  createdAt,
  type,
  from,
  to,
  departureDate,
  returnDate,
  leadPassenger,
  email,
  number,
  flightDetails,
  ticketValidity,
  ticketDelivery,
  passengers,
  message,
}) {
  const { primaryColor, accentColor, linkColor } = brand.theme;

  const fromCode = extractIataCode(from) || from || '';
  const toCode   = extractIataCode(to)   || to   || '';

  const depFlight = [
    flightDetails?.departureFlight?.segments?.[0]?.carrierCode,
    flightDetails?.departureFlight?.segments?.[0]?.flightNumber,
  ].filter(Boolean).join(' ') || '—';

  const retFlight = type === 'Return'
    ? [
        flightDetails?.returnFlight?.segments?.[0]?.carrierCode,
        flightDetails?.returnFlight?.segments?.[0]?.flightNumber,
      ].filter(Boolean).join(' ') || '—'
    : null;

  const depFull = formatToDDMMMYYYY(departureDate);
  const retFull = formatToDDMMMYYYY(returnDate);

  const deliveryBadge = ticketDelivery?.immediate
    ? `<div style="background:${accentColor};color:#fff;font-size:10px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;display:inline-block;">IMMEDIATE</div>`
    : `<div style="background:#dc2626;color:#fff;font-size:10px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;display:inline-block;">DELIVER ${formatDate(ticketDelivery?.deliveryDate)}</div>`;

  const customerNote = message ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
            <div style="font-size:10px;font-weight:700;color:#92400e;letter-spacing:1px;margin-bottom:4px;">CUSTOMER NOTE</div>
            <div style="font-size:13px;color:#78350f;">${message}</div>
          </td>
        </tr>
      </table>` : '';

  const returnRow = type === 'Return' ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;">
        <tr>
          <td style="padding:10px 16px;font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1px;width:70px;">RETURN</td>
          <td style="padding:10px 8px;font-size:13px;font-weight:400;color:#0f172a;">${retFull}</td>
          <td style="padding:10px 8px;font-size:13px;font-weight:400;color:${linkColor};">${toCode} &rarr; ${fromCode}</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:400;color:#475569;text-align:right;">${retFlight}</td>
        </tr>
      </table>` : '';

  const passengerRows = (passengers || []).map((p, i) => {
    const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
    return `
        <tr>
          <td style="padding:10px 14px;font-size:13px;font-weight:400;color:#94a3b8;${border}">${i + 1}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:400;color:${accentColor};${border}">${paxType(p.type)}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${(p.title || '').toUpperCase()} ${(p.firstName || '').toUpperCase()} / ${(p.lastName || '').toUpperCase()}</td>
        </tr>`;
  }).join('');

  const bookingRows = [
    ['Email',        email],
    ['Phone',        number],
    ['Booking Date', `${formatDate(createdAt)} ${formatDubaiTime(createdAt)}`],
    ['Validity',     ticketValidity],
    ['Delivery',     ticketDelivery?.immediate ? 'Immediate' : formatDate(ticketDelivery?.deliveryDate)],
  ].map(([label, value], i) => row(label, value, i)).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:24px 0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">

<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">

  <!-- HEADER -->
  <tr>
    <td style="background:${primaryColor};padding:20px 24px;border-radius:10px 10px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">New Dummy Ticket Order</div>
            <div style="font-size:20px;font-weight:700;color:#ffffff;margin-bottom:4px;">${leadPassenger}</div>
            <div style="font-size:13px;color:#94a3b8;">${fromCode} &rarr; ${toCode} &nbsp;&middot;&nbsp; ${(passengers || []).length} PAX &nbsp;&middot;&nbsp; ${type} &nbsp;&middot;&nbsp; ${ticketValidity}</div>
          </td>
          <td style="text-align:right;vertical-align:top;">${deliveryBadge}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#ffffff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">

      ${customerNote}

      <!-- ITINERARY -->
      <div style="font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Itinerary</div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;">
        <tr>
          <td style="padding:10px 16px;font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1px;width:70px;">DEPARTURE</td>
          <td style="padding:10px 8px;font-size:13px;font-weight:400;color:#0f172a;">${depFull}</td>
          <td style="padding:10px 8px;font-size:13px;font-weight:400;color:${linkColor};">${fromCode} &rarr; ${toCode}</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:400;color:#475569;text-align:right;">${depFlight}</td>
        </tr>
      </table>

      ${returnRow}

      <!-- PASSENGER MANIFEST -->
      <div style="font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Passenger Manifest</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <tr style="background:#f8fafc;">
          <td style="padding:8px 14px;font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1px;border-bottom:1px solid #e2e8f0;width:32px;">#</td>
          <td style="padding:8px 14px;font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1px;border-bottom:1px solid #e2e8f0;width:50px;">TYPE</td>
          <td style="padding:8px 14px;font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">NAME</td>
        </tr>
        ${passengerRows}
      </table>

      <!-- BOOKING DETAILS -->
      <div style="font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Booking Details</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        ${bookingRows}
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}
