function row(label, value, i) {
  const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
  return `
    <tr>
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:180px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

function formatMoney(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  const code = String(currency || '').trim().toUpperCase();
  if (!code) return value.toFixed(2);
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

function formatDay(date) {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

function shell({ primary, eyebrow, heading, subheading, body, teamName, website }) {
  return `<!doctype html>
<html lang="en">
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
              <h1 style="margin:6px 0 4px;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.2px;">${heading}</h1>
              ${subheading ? `<p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">${subheading}</p>` : ''}
            </td>
          </tr>

          <tr>
            <td style="padding:28px;color:#0f172a;font-size:14px;line-height:1.7;">
              ${body}
            </td>
          </tr>

          <tr>
            <td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                ${teamName}${website ? ` · <a href="${website}" style="color:#94a3b8;">${website}</a>` : ''}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderAffiliateWelcomeTemplate({
  brand,
  name,
  affiliateId,
  commissionPercent,
  trackingLink,
}) {
  const primary = brand?.theme?.primaryColor || '#1a1a2e';
  const brandName = brand?.name?.trim() || '';
  const website = brand?.website || '';
  const teamName = brand?.teamName || (brandName ? `${brandName} Team` : 'Partnerships Team');
  const rate = Number.isFinite(Number(commissionPercent)) ? `${Number(commissionPercent)}%` : '—';

  const linkBlock = trackingLink
    ? `
      <p style="margin:0 0 10px;">Here is your tracking link. Every sale that comes through it is credited to you.</p>
      <p style="margin:0 0 20px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;word-break:break-all;">
        <a href="${trackingLink}" style="color:${primary};font-weight:600;text-decoration:none;">${trackingLink}</a>
      </p>`
    : `<p style="margin:0 0 20px;">Your partnership contact will send your tracking link shortly.</p>`;

  const body = `
    <p style="margin:0 0 12px;">Welcome aboard${name ? `, ${name}` : ''}. Your affiliate account is live.</p>
    ${linkBlock}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:22px;">
      ${row('Affiliate ID', affiliateId, 0)}
      ${row('Commission rate', rate, 1)}
    </table>
    <p style="margin:0 0 12px;font-weight:600;">How the tracking works</p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      <li>A visitor who arrives on your link is tagged for 30 days.</li>
      <li>Attribution is first touch, so the first link a customer uses keeps the credit.</li>
      <li>Commission is earned on a customer's first purchase only.</li>
    </ul>
    <p style="margin:0;">Statements go out monthly once a payout is settled. Any questions, just reply to your partnership contact.</p>`;

  return shell({
    primary,
    eyebrow: brandName ? `${brandName} affiliate programme` : 'Affiliate programme',
    heading: 'Your affiliate account is ready',
    subheading: affiliateId ? `Affiliate ID ${affiliateId}` : '',
    body,
    teamName,
    website,
  });
}

export function renderAffiliateStatementTemplate({
  brand,
  name,
  affiliateId,
  periodStart,
  periodEnd,
  currency,
  commissionAmount,
  revenueAmount,
  orderCount,
  absorbedRefundCount,
  absorbedRefundAmount,
  paidAt,
  reference,
  note,
}) {
  const primary = brand?.theme?.primaryColor || '#1a1a2e';
  const brandName = brand?.name?.trim() || '';
  const website = brand?.website || '';
  const teamName = brand?.teamName || (brandName ? `${brandName} Team` : 'Partnerships Team');
  const period = `${formatDay(periodStart)} – ${formatDay(periodEnd)}`;
  const refunds = Number(absorbedRefundCount) > 0
    ? `${absorbedRefundCount} (${formatMoney(absorbedRefundAmount, currency)})`
    : 'None';

  const body = `
    <p style="margin:0 0 12px;">Hi${name ? ` ${name}` : ''}, your commission for this period has been paid.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:22px;">
      ${row('Affiliate ID', affiliateId, 0)}
      ${row('Period', period, 1)}
      ${row('Orders', String(orderCount ?? 0), 2)}
      ${row('Sales value', formatMoney(revenueAmount, currency), 3)}
      ${row('Refunds absorbed', refunds, 4)}
      ${row('Commission paid', `<strong>${formatMoney(commissionAmount, currency)}</strong>`, 5)}
      ${row('Paid on', formatDay(paidAt), 6)}
      ${row('Reference', reference, 7)}
      ${note ? row('Note', note, 8) : ''}
    </table>
    <p style="margin:0;">Funds should reach your account within a few working days, depending on your bank. If anything here looks wrong, reply to your partnership contact and we will check it.</p>`;

  return shell({
    primary,
    eyebrow: brandName ? `${brandName} affiliate statement` : 'Affiliate statement',
    heading: `Commission paid: ${formatMoney(commissionAmount, currency)}`,
    subheading: period,
    body,
    teamName,
    website,
  });
}
