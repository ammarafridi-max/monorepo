import { createApiClient } from '../../src/lib/blog-utils.mjs';

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const ENDPOINT = '/api/affiliates/payouts';

function flagValue(argv, name) {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : null;
}

export function previousMonth(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const d = new Date(Date.UTC(year, month - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function resolvePeriod(argv) {
  const explicit = flagValue(argv, 'period');
  if (!explicit) return previousMonth();
  if (!PERIOD_PATTERN.test(explicit)) {
    throw new Error(`--period must be YYYY-MM with a month in 01-12, got "${explicit}"`);
  }
  return explicit;
}

function formatAmount(amount, currency) {
  const value = typeof amount === 'number' ? amount.toFixed(2) : String(amount ?? '0');
  return currency ? `${value} ${currency}` : value;
}

export async function run({ target, dryRun, argv = [] }) {
  const period = resolvePeriod(argv);

  console.log(`Target:   ${target.name} (${target.key})`);
  console.log(`Period:   ${period}`);
  console.log(`Endpoint: POST ${target.backendUrl}${ENDPOINT}`);

  if (dryRun) {
    console.log('Dry run: no login, no request, nothing generated.');
    return;
  }

  const api = createApiClient(target);
  const token = await api.login();

  const body = await api.apiFetch(ENDPOINT, {
    method: 'POST',
    headers: { Cookie: `jwt=${token}` },
    body: JSON.stringify({ period }),
  });

  const data = body?.data ?? {};
  const payouts = data.payouts ?? [];

  console.log(`Window:   ${data.periodStart ?? '?'} → ${data.periodEnd ?? '?'} (hold ${data.holdDays ?? '?'} days)`);

  if (payouts.length === 0) {
    console.log('No payouts for this period.');
    return;
  }

  let totalOrders = 0;
  let totalClaimed = 0;
  const totalsByCurrency = new Map();

  for (const p of payouts) {
    const orders = p.orderCount ?? 0;
    const claimed = p.claimed ?? 0;
    const commission = p.commissionAmount ?? 0;
    totalOrders += orders;
    totalClaimed += claimed;
    totalsByCurrency.set(p.currency, (totalsByCurrency.get(p.currency) ?? 0) + commission);

    const refund = p.absorbedRefundAmount
      ? `, refunds absorbed ${formatAmount(p.absorbedRefundAmount, p.currency)}`
      : '';
    console.log(
      `  ${p.affiliateId}  ${orders} order(s)  ${formatAmount(commission, p.currency)}  ${claimed} newly claimed  [${p.status}]${refund}`,
    );
  }

  const totals = [...totalsByCurrency.entries()]
    .map(([currency, amount]) => formatAmount(amount, currency))
    .join(' + ');

  console.log(
    `Total:    ${payouts.length} payout(s), ${totalOrders} order(s), ${totals}, ${totalClaimed} newly claimed`,
  );
}
