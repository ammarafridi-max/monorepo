function shell({ brand, heading, eyebrow, bodyHtml }) {
  const primary = brand?.theme?.primaryColor || '#14948f';
  const website = brand?.website || 'https://www.travl.ae';
  const teamName = brand?.teamName || `${brand?.name || 'Travl'} Team`;
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${heading}</title></head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <tr><td style="padding:24px 28px;background:${primary};">
        ${eyebrow ? `<p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">${eyebrow}</p>` : ''}
        <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.2px;">${heading}</h1>
      </td></tr>
      <tr><td style="padding:28px;color:#0f172a;font-size:14px;line-height:1.7;">${bodyHtml}</td></tr>
      <tr><td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">${teamName} · <a href="${website}" style="color:#94a3b8;">${website}</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function button({ brand, href, label }) {
  const primary = brand?.theme?.primaryColor || '#14948f';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;"><tr>
    <td align="center" style="border-radius:8px;background:${primary};">
      <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>
    </td></tr></table>`;
}

export function renderMagicLink({ brand, magicLinkUrl }) {
  return shell({
    brand,
    eyebrow: `${brand?.name || 'Travl'} sign in`,
    heading: 'Your sign-in link',
    bodyHtml: `
      <p style="margin:0 0 8px;">Click the button below to sign in to your ${brand?.name || 'Travl'} visa account. This link is valid for 20 minutes and can only be used once.</p>
      ${button({ brand, href: magicLinkUrl, label: 'Sign in →' })}
      <p style="margin:0;color:#64748b;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>`,
  });
}

export function renderApplicationAssigned({ brand, applicationRef, destinationCountry, magicLinkUrl }) {
  return shell({
    brand,
    eyebrow: 'Your visa application',
    heading: `Application ${applicationRef} is ready`,
    bodyHtml: `
      <p style="margin:0 0 8px;">We've set up your ${destinationCountry || 'Schengen'} visa application (<strong>${applicationRef}</strong>). Use the secure link below to sign in, complete your details, and upload your documents.</p>
      ${button({ brand, href: magicLinkUrl, label: 'Open my application →' })}
      <p style="margin:0;color:#64748b;font-size:12px;">This sign-in link is valid for 20 minutes.</p>`,
  });
}

export function renderDocumentRejected({ brand, applicationRef, docType, rejectionReason, link }) {
  const label = String(docType || '').replace(/_/g, ' ').toLowerCase();
  return shell({
    brand,
    eyebrow: `Application ${applicationRef}`,
    heading: 'A document needs to be re-uploaded',
    bodyHtml: `
      <p style="margin:0 0 8px;">Your <strong>${label}</strong> could not be accepted for application <strong>${applicationRef}</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;">
        <tr><td style="padding:12px 14px;color:#b91c1c;font-size:13px;"><strong>Reason:</strong> ${rejectionReason || 'Please re-upload a clearer copy.'}</td></tr>
      </table>
      <p style="margin:0 0 4px;">Please sign in and upload a corrected copy.</p>
      ${button({ brand, href: link, label: 'Re-upload document →' })}`,
  });
}

export function renderAllApproved({ brand, applicationRef, destinationCountry, link }) {
  return shell({
    brand,
    eyebrow: `Application ${applicationRef}`,
    heading: 'All your documents are approved',
    bodyHtml: `
      <p style="margin:0 0 8px;">Great news — every document for your ${destinationCountry || 'Schengen'} visa application (<strong>${applicationRef}</strong>) has been reviewed and approved.</p>
      <p style="margin:0 0 8px;">Our team is now preparing your appointment. We'll be in touch with the next steps shortly.</p>
      ${button({ brand, href: link, label: 'View my application →' })}`,
  });
}

export function renderChecklistCompleteAdmin({ brand, applicationRef, destinationCountry }) {
  const website = brand?.website || 'https://www.travl.ae';
  return shell({
    brand,
    eyebrow: 'Ready for review',
    heading: `${applicationRef} — all documents uploaded`,
    bodyHtml: `
      <p style="margin:0 0 8px;">A customer has completed their full document checklist for application <strong>${applicationRef}</strong> (${destinationCountry || 'Schengen'}).</p>
      ${button({ brand, href: `${website}/admin/visa-applications`, label: 'Review in admin →' })}`,
  });
}

function missingGroupsHtml(missing = []) {
  return (missing || []).map((g) => `
    <p style="margin:14px 0 4px;font-weight:600;color:#0f172a;">${g.traveller}</p>
    <ul style="margin:0 0 4px;padding-left:18px;color:#334155;">
      ${(g.items || []).map((item) => `<li style="margin:2px 0;">${item}</li>`).join('')}
    </ul>`).join('');
}

export function renderDocumentsStillNeeded({ brand, applicationRef, destinationCountry, missing, link }) {
  return shell({
    brand,
    eyebrow: `Application ${applicationRef}`,
    heading: 'A few documents are still outstanding',
    bodyHtml: `
      <p style="margin:0 0 8px;">Your ${destinationCountry || 'Schengen'} visa application (<strong>${applicationRef}</strong>) is almost there. We still need the following before we can move forward:</p>
      ${missingGroupsHtml(missing)}
      <p style="margin:14px 0 4px;">Uploading them only takes a minute.</p>
      ${button({ brand, href: link, label: 'Upload my documents →' })}
      <p style="margin:0;color:#64748b;font-size:12px;">If you've already sent these another way, you can ignore this reminder.</p>`,
  });
}

function rejectedGroupsHtml(rejected = []) {
  return (rejected || []).map((g) => `
    <p style="margin:14px 0 4px;font-weight:600;color:#0f172a;">${g.traveller}</p>
    ${(g.items || []).map((item) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;">
        <tr><td style="padding:10px 12px;color:#b91c1c;font-size:13px;"><strong>${item.document}:</strong> ${item.reason}</td></tr>
      </table>`).join('')}`).join('');
}

export function renderRejectionReminder({ brand, applicationRef, rejected, link }) {
  return shell({
    brand,
    eyebrow: `Application ${applicationRef}`,
    heading: 'A document still needs to be re-uploaded',
    bodyHtml: `
      <p style="margin:0 0 8px;">We're still waiting on a corrected copy for application <strong>${applicationRef}</strong>. Here's what needs another look:</p>
      ${rejectedGroupsHtml(rejected)}
      <p style="margin:14px 0 4px;">Please sign in and upload a corrected version so we can keep things moving.</p>
      ${button({ brand, href: link, label: 'Re-upload now →' })}`,
  });
}

export function renderFileReadyForStaff({ brand, applicationRef, destinationCountry }) {
  const website = brand?.website || 'https://www.travl.ae';
  return shell({
    brand,
    eyebrow: 'Your turn',
    heading: `${applicationRef} — customer documents complete`,
    bodyHtml: `
      <p style="margin:0 0 8px;">The customer has finished uploading everything for their ${destinationCountry || 'Schengen'} visa file (<strong>${applicationRef}</strong>). It's now ready for the team to prepare — flight reservation, insurance, cover letter, forms and the appointment.</p>
      ${button({ brand, href: `${website}/admin/visa-applications?queue=your_turn`, label: 'Open the "Your turn" queue →' })}`,
  });
}

export function renderApplicationEscalated({ brand, applicationRef, destinationCountry, customerEmail, reminderCount, link }) {
  const website = brand?.website || 'https://www.travl.ae';
  return shell({
    brand,
    eyebrow: 'Gone quiet — needs a call',
    heading: `${applicationRef} — customer not responding`,
    bodyHtml: `
      <p style="margin:0 0 8px;">Application <strong>${applicationRef}</strong> (${destinationCountry || 'Schengen'}) has had <strong>${reminderCount}</strong> automated reminders with no response. Automated chasing has stopped — this one needs a personal follow-up (a call).</p>
      <p style="margin:0 0 8px;color:#334155;">Customer: ${customerEmail || 'unknown'}</p>
      ${button({ brand, href: `${website}/admin/visa-applications`, label: 'Open in admin →' })}
      <p style="margin:0;color:#64748b;font-size:12px;">Direct link: <a href="${link}" style="color:#64748b;">${link}</a></p>`,
  });
}
