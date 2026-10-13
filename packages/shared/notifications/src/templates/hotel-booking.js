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

export function renderHotelBookingPaidTemplate({ brand, sessionId, email, leadGuest, hotel, checkIn, checkOut, nights, destination }) {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${row('Lead guest', leadGuest, 0)}
      ${row('Email', email, 1)}
      ${row('Hotel', hotel?.name ?? destination?.cityName, 2)}
      ${row('City', hotel?.city ?? destination?.cityName, 3)}
      ${row('Check-in', checkIn, 4)}
      ${row('Check-out', checkOut, 5)}
      ${row('Nights', nights, 6)}
      ${row('Session', sessionId, 7)}
    </table>
    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
      The supplier booking runs automatically straight after payment. Check the reservation in the admin panel to confirm it landed.
    </p>`;
  return shell({ brand, eyebrow: 'Hotel reservation', heading: 'Payment received', body });
}

export function renderHotelBookingFailedTemplate({ brand, sessionId, email, reason }) {
  const body = `
    <p style="margin:0 0 20px;color:#b91c1c;font-size:14px;line-height:1.6;font-weight:600;">
      The customer has paid but the supplier booking did not go through. They are owed a room.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${row('Session', sessionId, 0)}
      ${row('Customer', email, 1)}
      ${row('Reason', reason, 2)}
    </table>
    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
      Retry the booking from the reservation detail page, or refund the customer if no refundable room is available.
    </p>`;
  return shell({ brand, accent: '#991b1b', eyebrow: 'Hotel reservation', heading: 'Supplier booking failed', body });
}

export function renderHotelBookingConfirmedTemplate({
  brand, leadGuest, hotel, checkIn, checkOut, nights, occupancy, guests,
  hotelConfirmationCode, bookingReference, freeCancellationUntil,
}) {
  const guestList = (guests ?? [])
    .map((g) => [g.title, g.firstName, g.lastName].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ');

  const roomsLine = occupancy
    ? `${occupancy.rooms ?? 1} room${(occupancy.rooms ?? 1) > 1 ? 's' : ''}, ${occupancy.adults ?? 1} adult${(occupancy.adults ?? 1) > 1 ? 's' : ''}`
    : null;

  const body = `
    <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.6;">
      Hi ${leadGuest || 'there'}, your hotel reservation is confirmed. The details below are what the embassy needs, so keep this email or print it for your file.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${row('Confirmation number', hotelConfirmationCode, 0)}
      ${row('Booking reference', bookingReference, 1)}
      ${row('Hotel', hotel?.name, 2)}
      ${row('Address', hotel?.address, 3)}
      ${row('City', hotel?.city, 4)}
      ${row('Check-in', checkIn, 5)}
      ${row('Check-out', checkOut, 6)}
      ${row('Nights', nights, 7)}
      ${row('Rooms and guests', roomsLine, 8)}
      ${row('Guest names', guestList, 9)}
    </table>

    ${freeCancellationUntil ? `<p style="margin:0 0 16px;font-size:13px;color:#166534;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 14px;line-height:1.6;">
      This is a genuine booking held in your name. It can be cancelled free of charge up to ${freeCancellationUntil}.
    </p>` : ''}

    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
      If anything above is wrong, reply to this email and we will fix it. ${brand?.name ? `Sent by ${brand.name}.` : ''}
    </p>`;

  return shell({ brand, eyebrow: 'Hotel reservation', heading: 'Your reservation is confirmed', body });
}
