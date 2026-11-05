import { formatToDDMMMYYYYMixed } from '../helpers.js';

function row(label, value, i) {
  const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
  return `
    <tr>
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:170px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

function shell({ brand, eyebrow, heading, accent, body }) {
  const primary = accent || brand?.theme?.primaryColor || '#1a1a2e';
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:24px 28px;background:${primary};">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">${eyebrow}</p>
              <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.2px;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">${body}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderHotelBookingPaidTemplate({
  brand, sessionId, email, leadGuest, hotel, checkIn, checkOut, nights,
  destination, occupancy, guests, phoneNumber, amountPaid, message,
}) {
  const guestList = (guests ?? [])
    .map((g) => [g.title, g.firstName, g.lastName].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ');

  const roomsLine = occupancy
    ? `${occupancy.rooms ?? 1} room${(occupancy.rooms ?? 1) > 1 ? 's' : ''}, ${occupancy.adults ?? 1} adult${(occupancy.adults ?? 1) > 1 ? 's' : ''}`
    : null;

  const phone = phoneNumber?.digits ? `${phoneNumber.code ?? ''}${phoneNumber.digits}` : null;
  const paid = amountPaid?.amount ? `${amountPaid.currency ?? ''} ${amountPaid.amount}` : null;
  const listed = hotel?.listedRate?.amount ? `${hotel.listedRate.currency ?? ''} ${hotel.listedRate.amount}` : null;

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${row('Lead guest', leadGuest, 0)}
      ${row('All guests', guestList, 1)}
      ${row('Email', email, 2)}
      ${row('Phone', phone, 3)}
      ${row('Hotel', hotel?.name, 4)}
      ${row('Stars', hotel?.stars, 5)}
      ${row('Google rating', hotel?.rating, 6)}
      ${row('City', hotel?.city ?? destination?.cityName, 7)}
      ${row('Country', hotel?.country ?? destination?.countryCode, 8)}
      ${row('Check-in', formatToDDMMMYYYYMixed(checkIn), 9)}
      ${row('Check-out', formatToDDMMMYYYYMixed(checkOut), 10)}
      ${row('Nights', nights, 11)}
      ${row('Rooms and guests', roomsLine, 12)}
      ${row('Room listed at', listed, 13)}
      ${row('Customer paid', paid, 14)}
      ${row('Session', sessionId, 15)}
    </table>
    ${message ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
          <div style="font-size:10px;font-weight:700;color:#92400e;letter-spacing:1px;margin-bottom:4px;">CUSTOMER REQUIREMENTS</div>
          <div style="font-size:13px;color:#78350f;">${message}</div>
        </td>
      </tr>
    </table>` : ''}
    ${hotel?.link ? `<p style="margin:0 0 16px;font-size:13px;"><a href="${hotel.link}" style="color:#1e60a6;">Open the hotel on Google</a></p>` : ''}
    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
      Book this reservation and send it to the customer from the admin panel.
    </p>`;
  return shell({ brand, eyebrow: 'Hotel booking', heading: 'Payment received', body });
}
