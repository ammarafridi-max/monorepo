function row(label, value, i) {
  const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
  return `
    <tr>
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:160px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

function formatSource(source) {
  const map = {
    hero_cta:    'Hero CTA',
    package_card: 'Package card',
    final_cta:   'Bottom CTA',
    sticky_bar:  'Sticky bar',
    inline_cta:  'Inline CTA',
  };
  return map[source] || source || '—';
}

function formatSubmittedAt(date) {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Dubai',
      hour12: true,
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function renderVisaLeadTemplate({
  brand,
  leadId,
  firstName,
  lastName,
  nationality,
  email,
  phone,
  packageRequested,
  applicantCount,
  visaCountryName,
  source,
  submittedAt,
}) {
  const primary  = brand?.theme?.primaryColor || '#1a1a2e';
  const brandName = brand?.name?.trim() || '';
  const website  = brand?.website || '';
  const teamName = brand?.teamName || (brandName ? `${brandName} Team` : 'Operations Team');
  const crmUrl   = `${website}/admin/visa-leads/${leadId}`;
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New visa lead</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

          <!-- HEADER -->
          <tr>
            <td style="padding:24px 28px;background:${primary};">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">${brandName ? `New visa lead from ${brandName}` : 'New visa lead'}</p>
              <h1 style="margin:6px 0 4px;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.2px;">${fullName}</h1>
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">${visaCountryName || '—'} Visa · ${formatSource(source)}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:28px;">

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                ${row('Name',                 fullName,                          0)}
                ${row('Nationality',          nationality,                       1)}
                ${row('Email',                email,                             2)}
                ${row('Phone',                phone,                             3)}
                ${row('Package',              packageRequested,                  4)}
                ${row('Number of applicants', String(applicantCount ?? '—'),     5)}
                ${row('Visa',                 visaCountryName,                   6)}
                ${row('Source',               formatSource(source),              7)}
                ${row('Submitted',            formatSubmittedAt(submittedAt),    8)}
              </table>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:8px;background:${primary};">
                    <a href="${crmUrl}"
                       style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">
                      View in CRM →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                ${teamName}${website ? ` · <a href="${website}" style="color:#94a3b8;">${website}</a>` : ''}<br />
                This notification was sent automatically. Do not reply to this email.
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

export function renderVisaLeadCustomerTemplate({
  brand,
  firstName,
  packageRequested,
  applicantCount,
  visaCountryName,
}) {
  const primary = brand?.theme?.primaryColor || '#1a1a2e';
  const brandName = brand?.name?.trim() || '';
  const website = brand?.website || '';
  const teamName = brand?.teamName || (brandName ? `${brandName} Team` : 'Support Team');
  const whatsappUrl = brand?.whatsappUrl || '';
  const pkg = packageRequested && packageRequested !== 'undecided' ? packageRequested : null;
  const people = Number(applicantCount) > 1 ? `${applicantCount} applicants` : '1 applicant';

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>We have your request</title></head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <tr><td style="padding:24px 28px;background:${primary};">
        <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">${brandName || 'Visa assistance'}</p>
        <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.2px;">We have your request, ${firstName || 'there'}</h1>
      </td></tr>
      <tr><td style="padding:28px;color:#0f172a;font-size:14px;line-height:1.7;">
        <p style="margin:0 0 12px;">Thanks for getting in touch about a ${visaCountryName || ''} visa${pkg ? ` on the ${pkg} package` : ''} for ${people}.</p>
        <p style="margin:0 0 12px;">A specialist will call you during business hours. If you sent this outside them, expect the call first thing on the next working day.</p>
        <p style="margin:0 0 12px;">To speed things up, have these ready for the call:</p>
        <ul style="margin:0 0 16px;padding-left:20px;">
          <li>Your travel dates and the countries you plan to visit</li>
          <li>Your passport and UAE residence visa validity</li>
          <li>Whether you have been refused a visa before</li>
        </ul>
        ${whatsappUrl ? `<p style="margin:0;">Travelling soon? <a href="${whatsappUrl}" style="color:${primary};font-weight:600;">Message us on WhatsApp</a> and we will pick it up faster.</p>` : ''}
      </td></tr>
      <tr><td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">${teamName}${website ? ` · <a href="${website}" style="color:#94a3b8;">${website}</a>` : ''}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
