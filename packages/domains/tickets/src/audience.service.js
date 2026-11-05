import { dialCodeToCountry, genderFromTitle, toE164 } from '@travel-suite/utils/contact';

const RECENT_WINDOW_DAYS = 90;
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const FORMULA_LEAD = /^[=+\-@\t\r]/;

const csvCell = (value) => {
  const text = String(value ?? '');
  const safe = FORMULA_LEAD.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(header, rows) {
  return [header.join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n') + '\n';
}

const baseAmount = ({ amount, currency }, rates) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  const rate = Number(rates[String(currency ?? '').toUpperCase()]);
  return Number.isFinite(rate) && rate > 0 ? value / rate : null;
};

const paidBase = (ticket, rates) => {
  const base = Number(ticket.amountPaidBase?.amount);
  if (Number.isFinite(base)) return base;
  return baseAmount(ticket.amountPaid ?? {}, rates);
};

const refundedBase = (ticket, rates) =>
  baseAmount(
    {
      amount: ticket.refundedAmount?.amount,
      currency: ticket.refundedAmount?.currency ?? ticket.amountPaid?.currency,
    },
    rates,
  );

export function buildAudiences(tickets, { rates = {}, now = new Date(), prefix = 'audience' } = {}) {
  const recentCutoff = now.getTime() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const byEmail = new Map();

  for (const ticket of tickets) {
    const key = String(ticket?.email ?? '').trim().toLowerCase();
    if (!EMAIL_SHAPE.test(key)) continue;

    let record = byEmail.get(key);
    if (!record) {
      record = { email: key, paid: 0, unpaid: 0, refunded: 0, value: 0, latest: null, latestAt: -1 };
      byEmail.set(key, record);
    }

    if (ticket.paymentStatus === 'PAID' || ticket.paymentStatus === 'PARTIALLY_REFUNDED') {
      record.paid += 1;
      const gross = paidBase(ticket, rates);
      if (gross != null) {
        const refunded =
          ticket.paymentStatus === 'PARTIALLY_REFUNDED' ? refundedBase(ticket, rates) ?? 0 : 0;
        record.value += Math.max(gross - refunded, 0);
      }
    } else if (ticket.paymentStatus === 'UNPAID') {
      record.unpaid += 1;
    } else if (ticket.paymentStatus === 'REFUNDED') {
      record.refunded += 1;
    }

    const stamp = new Date(ticket.paidAt ?? ticket.createdAt ?? 0).getTime();
    const at = Number.isFinite(stamp) ? stamp : 0;
    if (at >= record.latestAt) {
      record.latestAt = at;
      record.latest = ticket;
    }
  }

  const identity = (record) => {
    const lead = record.latest?.passengers?.[0] ?? {};
    return [
      record.email,
      toE164(record.latest?.phoneNumber?.code, record.latest?.phoneNumber?.digits) ?? '',
      String(lead.firstName ?? '').trim(),
      String(lead.lastName ?? '').trim(),
      genderFromTitle(lead.title) ?? '',
      dialCodeToCountry(record.latest?.phoneNumber?.code, {
        currency: record.latest?.amountPaid?.currency ?? record.latest?.currency,
      }) ?? '',
    ];
  };

  const all = [...byEmail.values()];
  const purchasers = all.filter((record) => record.paid > 0);
  const abandoners = all.filter(
    (record) => record.paid === 0 && record.refunded === 0 && record.unpaid > 0,
  );
  const recentAbandoners = abandoners.filter((record) => record.latestAt >= recentCutoff);

  const identityHeader = ['email', 'phone', 'fn', 'ln', 'gen', 'country'];

  return {
    purchasers: {
      name: `${prefix}-purchasers.csv`,
      rows: purchasers.length,
      csv: toCsv(
        [...identityHeader, 'value'],
        purchasers.map((record) => [...identity(record), record.value.toFixed(2)]),
      ),
    },
    abandoners: {
      name: `${prefix}-abandoned-never-bought.csv`,
      rows: abandoners.length,
      csv: toCsv(identityHeader, abandoners.map(identity)),
    },
    recentAbandoners: {
      name: `${prefix}-abandoned-last-${RECENT_WINDOW_DAYS}-days.csv`,
      rows: recentAbandoners.length,
      csv: toCsv(identityHeader, recentAbandoners.map(identity)),
    },
  };
}

const filePrefix = (brandName) =>
  String(brandName ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'audience';

export function createAudienceService({ Ticket, Currency, sendEmail, recipient, brandName, logger }) {
  const exportAudiences = async ({ now = new Date() } = {}) => {
    if (!recipient) {
      const error = new Error('No audience export recipient is configured');
      error.statusCode = 400;
      throw error;
    }

    const rateRows = Currency ? await Currency.find({}).lean() : [];
    const rates = Object.fromEntries(
      rateRows.map((row) => [String(row.code).toUpperCase(), Number(row.rate) || 1]),
    );

    const tickets = await Ticket.find(
      {
        paymentStatus: { $in: ['PAID', 'PARTIALLY_REFUNDED', 'UNPAID', 'REFUNDED'] },
        email: { $nin: [null, ''] },
      },
      'email phoneNumber passengers paymentStatus paidAt createdAt amountPaid amountPaidBase refundedAmount currency',
    ).lean();

    const audiences = buildAudiences(tickets, { rates, now, prefix: filePrefix(brandName) });
    const files = [audiences.purchasers, audiences.abandoners, audiences.recentAbandoners];

    await sendEmail({
      email: recipient,
      name: recipient,
      subject: `${brandName} advertising audiences, ${now.toISOString().slice(0, 10)}`,
      htmlContent: renderSummary({ brandName, now, files }),
      attachment: files.map((file) => ({
        name: file.name,
        content: Buffer.from(file.csv, 'utf8').toString('base64'),
      })),
    });

    logger?.info?.('[tickets] audience export sent', {
      recipient,
      files: files.map((file) => `${file.name}:${file.rows}`),
    });

    return {
      sentTo: recipient,
      generatedAt: now.toISOString(),
      files: files.map((file) => ({ name: file.name, rows: file.rows })),
    };
  };

  return { exportAudiences };
}

function renderSummary({ brandName, now, files }) {
  const rows = files
    .map(
      (file) => `
    <tr>
      <td style="padding:9px 14px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">${file.name}</td>
      <td style="padding:9px 14px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;text-align:right;">${file.rows.toLocaleString('en-US')}</td>
    </tr>`,
    )
    .join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <p style="font-size:15px;color:#0f172a;margin:0 0 16px;">
      ${brandName} advertising audiences for ${now.toISOString().slice(0, 10)}.
    </p>
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;">
      <tr>
        <td style="padding:9px 14px;font-size:12px;color:#94a3b8;">File</td>
        <td style="padding:9px 14px;font-size:12px;color:#94a3b8;text-align:right;">Rows</td>
      </tr>${rows}
    </table>
    <p style="font-size:13px;color:#475569;margin:16px 0 0;">
      Upload these as Customer List audiences in Meta Ads Manager. The purchasers file carries a
      value column, so map it to create a value based audience. Delete the files once uploaded.
    </p>
  </div>`;
}
