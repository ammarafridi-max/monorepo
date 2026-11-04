import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { GoogleAdsApi } from 'google-ads-api';

const CLICK_VIEW_WINDOW_DAYS = 90;
const PAID_STATUSES = ['PAID'];

function flagValue(argv, name, fallback = null) {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : fallback;
}

const digits = (value) => String(value ?? '').replace(/\D/g, '');

function requireEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env: ${missing.join(', ')}`);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function assertIsoDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must be YYYY-MM-DD, got "${value}"`);
  return value;
}

export function dayList(from, to) {
  const days = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function shiftDay(day, delta) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function zonedDayFormatter(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return (date) => formatter.format(date);
}

export function mondayOf(day) {
  const d = new Date(`${day}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}

function createAdsCustomer() {
  requireEnv([
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID',
  ]);
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });
  const login = digits(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  return client.Customer({
    customer_id: digits(process.env.GOOGLE_ADS_CUSTOMER_ID),
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    ...(login ? { login_customer_id: login } : {}),
  });
}

function adsError(err) {
  const detail = err?.errors?.[0]?.message;
  if (!detail) return err;
  const wrapped = new Error(detail);
  wrapped.cause = err;
  return wrapped;
}

async function query(customer, gaql) {
  try {
    return await customer.query(gaql);
  } catch (err) {
    throw adsError(err);
  }
}

async function fetchAccount(customer) {
  const rows = await query(customer, 
    'SELECT customer.id, customer.descriptive_name, customer.time_zone, customer.currency_code FROM customer LIMIT 1',
  );
  const account = rows[0]?.customer;
  if (!account?.time_zone || !account?.currency_code) {
    throw new Error('Could not read customer.time_zone / customer.currency_code from the Ads account');
  }
  return account;
}

async function resolveCampaign(customer, wanted) {
  if (!wanted) {
    const all = await query(customer, 
      'SELECT campaign.id, campaign.name, campaign.status FROM campaign ORDER BY campaign.name',
    );
    const list = all.map((r) => `  ${r.campaign.id}  ${r.campaign.name}  [${r.campaign.status}]`).join('\n');
    throw new Error(`--campaign <id|name fragment> is required. Campaigns in this account:\n${list || '  (none)'}`);
  }

  const escaped = wanted.replace(/'/g, "\\'");
  const where = /^\d+$/.test(wanted)
    ? `campaign.id = ${wanted}`
    : `campaign.name LIKE '%${escaped}%'`;
  const rows = await query(customer, 
    `SELECT campaign.id, campaign.name, campaign.start_date, campaign.status FROM campaign WHERE ${where}`,
  );

  if (rows.length === 0) throw new Error(`No campaign matched "${wanted}"`);
  if (rows.length > 1) {
    const list = rows.map((r) => `  ${r.campaign.id}  ${r.campaign.name}`).join('\n');
    throw new Error(`"${wanted}" matched ${rows.length} campaigns. Pass an id:\n${list}`);
  }
  return rows[0].campaign;
}

async function fetchDailyMetrics(customer, campaignId, from, to) {
  const rows = await query(customer, `
    SELECT segments.date, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions
    FROM campaign
    WHERE campaign.id = ${campaignId} AND segments.date BETWEEN '${from}' AND '${to}'
    ORDER BY segments.date
  `);
  const byDay = new Map();
  for (const row of rows) {
    byDay.set(row.segments.date, {
      spend: Number(row.metrics.cost_micros ?? 0) / 1_000_000,
      clicks: Number(row.metrics.clicks ?? 0),
      impressions: Number(row.metrics.impressions ?? 0),
      conversions: Number(row.metrics.conversions ?? 0),
    });
  }
  return byDay;
}

async function fetchGclids(customer, campaignId, from, to, log) {
  // click_view only retains the last 90 days and only accepts a single-day date filter.
  const earliest = shiftDay(new Date().toISOString().slice(0, 10), -(CLICK_VIEW_WINDOW_DAYS - 1));
  const start = from > earliest ? from : earliest;
  const gclids = new Set();
  if (start > to) return { gclids, start: null, truncated: true };

  for (const day of dayList(start, to)) {
    const rows = await query(customer, `
      SELECT click_view.gclid, segments.date
      FROM click_view
      WHERE campaign.id = ${campaignId} AND segments.date = '${day}'
    `);
    for (const row of rows) if (row.click_view?.gclid) gclids.add(row.click_view.gclid);
  }
  log(`gclids:  ${gclids.size} click(s) from ${start} → ${to}`);
  return { gclids, start, truncated: start > from };
}

async function fetchOrders({ collection, from, to, utmCampaigns, gclids, dateField }) {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const docs = await mongoose.connection
      .collection(collection)
      .find({
        paymentStatus: { $in: PAID_STATUSES },
        createdAt: { $gte: new Date(`${shiftDay(from, -3)}T00:00:00Z`), $lt: new Date(`${shiftDay(to, 3)}T00:00:00Z`) },
      })
      .project({
        createdAt: 1,
        paymentVerifiedAt: 1,
        issuedAt: 1,
        paymentStatus: 1,
        amountPaid: 1,
        attribution: 1,
        sessionId: 1,
        policyNumber: 1,
      })
      .toArray();

    const matched = [];
    let withoutAttribution = 0;

    for (const doc of docs) {
      const touches = [doc.attribution?.last, doc.attribution?.first].filter(Boolean);
      if (touches.length === 0) {
        withoutAttribution++;
        continue;
      }
      const byUtm = touches.some((t) => t.campaign && utmCampaigns.has(t.campaign.toLowerCase()));
      const byGclid = touches.some((t) => t.gclid && gclids.has(t.gclid));
      if (!byUtm && !byGclid) continue;

      const stamp = dateField === 'createdAt'
        ? doc.createdAt
        : (doc.paymentVerifiedAt ?? doc.issuedAt ?? doc.createdAt);

      matched.push({
        at: new Date(stamp),
        revenue: Number(doc.amountPaid?.amount ?? 0),
        currency: doc.amountPaid?.currency ?? null,
        matchedBy: byGclid ? (byUtm ? 'gclid+utm' : 'gclid') : 'utm',
      });
    }

    return { matched, scanned: docs.length, withoutAttribution };
  } finally {
    await mongoose.disconnect();
  }
}

export function buildDaily({ days, metrics, orders, localDay, commissionRate }) {
  const ordersByDay = new Map();
  for (const order of orders) {
    const day = localDay(order.at);
    if (!ordersByDay.has(day)) ordersByDay.set(day, []);
    ordersByDay.get(day).push(order);
  }

  let cumSpend = 0;
  let cumRevenue = 0;
  let cumCommission = 0;
  let cumProfit = 0;

  const rows = days.map((day) => {
    const m = metrics.get(day) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
    const dayOrders = ordersByDay.get(day) ?? [];
    const revenue = dayOrders.reduce((sum, o) => sum + o.revenue, 0);
    const commission = revenue * commissionRate;
    const profit = commission - m.spend;

    cumSpend += m.spend;
    cumRevenue += revenue;
    cumCommission += commission;
    cumProfit += profit;

    return {
      day,
      impressions: m.impressions,
      clicks: m.clicks,
      conversions: m.conversions,
      spend: m.spend,
      orders: dayOrders.length,
      revenue,
      commission,
      profit,
      cumSpend,
      cumRevenue,
      cumCommission,
      cumProfit,
    };
  });

  const outside = [...ordersByDay.keys()].filter((day) => !days.includes(day));
  return { rows, outside: outside.reduce((sum, day) => sum + ordersByDay.get(day).length, 0) };
}

export function buildWeekly(rows) {
  const weeks = new Map();
  for (const row of rows) {
    const key = mondayOf(row.day);
    if (!weeks.has(key)) {
      weeks.set(key, {
        weekStart: key,
        weekEnd: row.day,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        orders: 0,
        revenue: 0,
        commission: 0,
        profit: 0,
      });
    }
    const week = weeks.get(key);
    week.weekEnd = row.day;
    week.impressions += row.impressions;
    week.clicks += row.clicks;
    week.conversions += row.conversions;
    week.spend += row.spend;
    week.orders += row.orders;
    week.revenue += row.revenue;
    week.commission += row.commission;
    week.profit += row.profit;
  }
  return [...weeks.values()];
}

const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

function styleHeader(sheet) {
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function writeWorkbook({ path, meta, rows, weekly }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'travel-suite automations';
  workbook.created = new Date();

  const money = `#,##0.00`;
  const daily = workbook.addWorksheet('Daily');
  daily.columns = [
    { header: 'Date', key: 'day', width: 12 },
    { header: 'Impressions', key: 'impressions', width: 13, style: { numFmt: '#,##0' } },
    { header: 'Clicks', key: 'clicks', width: 10, style: { numFmt: '#,##0' } },
    { header: 'Ads conversions', key: 'conversions', width: 16, style: { numFmt: '#,##0.00' } },
    { header: `Spend (${meta.currency})`, key: 'spend', width: 14, style: { numFmt: money } },
    { header: 'Orders', key: 'orders', width: 9, style: { numFmt: '#,##0' } },
    { header: `Order revenue (${meta.currency})`, key: 'revenue', width: 20, style: { numFmt: money } },
    { header: `Commission ${Math.round(meta.commissionRate * 100)}% (${meta.currency})`, key: 'commission', width: 22, style: { numFmt: money } },
    { header: `Profit (${meta.currency})`, key: 'profit', width: 14, style: { numFmt: money } },
    { header: 'Cum. spend', key: 'cumSpend', width: 14, style: { numFmt: money } },
    { header: 'Cum. revenue', key: 'cumRevenue', width: 14, style: { numFmt: money } },
    { header: 'Cum. commission', key: 'cumCommission', width: 16, style: { numFmt: money } },
    { header: 'Cum. profit', key: 'cumProfit', width: 14, style: { numFmt: money } },
  ];
  rows.forEach((row) => daily.addRow(row));

  const totals = daily.addRow({
    day: 'TOTAL',
    impressions: sum(rows, 'impressions'),
    clicks: sum(rows, 'clicks'),
    conversions: sum(rows, 'conversions'),
    spend: sum(rows, 'spend'),
    orders: sum(rows, 'orders'),
    revenue: sum(rows, 'revenue'),
    commission: sum(rows, 'commission'),
    profit: sum(rows, 'profit'),
  });
  totals.font = { bold: true };
  totals.border = { top: { style: 'thin' } };
  styleHeader(daily);

  const weeks = workbook.addWorksheet('Weekly');
  weeks.columns = [
    { header: 'Week starting', key: 'weekStart', width: 14 },
    { header: 'Week ending', key: 'weekEnd', width: 14 },
    { header: 'Impressions', key: 'impressions', width: 13, style: { numFmt: '#,##0' } },
    { header: 'Clicks', key: 'clicks', width: 10, style: { numFmt: '#,##0' } },
    { header: 'Ads conversions', key: 'conversions', width: 16, style: { numFmt: '#,##0.00' } },
    { header: `Spend (${meta.currency})`, key: 'spend', width: 14, style: { numFmt: money } },
    { header: 'Orders', key: 'orders', width: 9, style: { numFmt: '#,##0' } },
    { header: `Order revenue (${meta.currency})`, key: 'revenue', width: 20, style: { numFmt: money } },
    { header: `Commission (${meta.currency})`, key: 'commission', width: 18, style: { numFmt: money } },
    { header: `Profit (${meta.currency})`, key: 'profit', width: 14, style: { numFmt: money } },
    { header: 'ROAS (commission/spend)', key: 'roas', width: 24, style: { numFmt: '0.00' } },
    { header: `Cost per order (${meta.currency})`, key: 'cpo', width: 20, style: { numFmt: money } },
  ];
  for (const week of weekly) {
    weeks.addRow({
      ...week,
      roas: week.spend ? week.commission / week.spend : null,
      cpo: week.orders ? week.spend / week.orders : null,
    });
  }
  const weekTotals = weeks.addRow({
    weekStart: 'TOTAL',
    weekEnd: '',
    impressions: sum(weekly, 'impressions'),
    clicks: sum(weekly, 'clicks'),
    conversions: sum(weekly, 'conversions'),
    spend: sum(weekly, 'spend'),
    orders: sum(weekly, 'orders'),
    revenue: sum(weekly, 'revenue'),
    commission: sum(weekly, 'commission'),
    profit: sum(weekly, 'profit'),
    roas: sum(weekly, 'spend') ? sum(weekly, 'commission') / sum(weekly, 'spend') : null,
    cpo: sum(weekly, 'orders') ? sum(weekly, 'spend') / sum(weekly, 'orders') : null,
  });
  weekTotals.font = { bold: true };
  weekTotals.border = { top: { style: 'thin' } };
  styleHeader(weeks);

  const notes = workbook.addWorksheet('Notes');
  notes.columns = [
    { header: 'Field', key: 'field', width: 26 },
    { header: 'Value', key: 'value', width: 90 },
  ];
  for (const [field, value] of meta.notes) notes.addRow({ field, value });
  styleHeader(notes);

  await writeFile(path, Buffer.from(await workbook.xlsx.writeBuffer()));
}

export async function run({ target, dryRun, argv = [] }) {
  const settings = target.adsProfitability ?? {};
  const campaignArg = flagValue(argv, 'campaign', settings.campaign ?? null);
  const commissionRate = Number(flagValue(argv, 'commission', settings.commissionRate ?? 0.3));
  const collection = flagValue(argv, 'collection', settings.ordersCollection);
  const dateField = flagValue(argv, 'date-field', settings.dateField ?? 'paid');
  const skipGclid = argv.includes('--no-gclid');
  const extraUtms = (flagValue(argv, 'utm', '') || '').split(',').map((v) => v.trim()).filter(Boolean);

  if (!collection) {
    throw new Error(
      `Target "${target.key}" has no adsProfitability.ordersCollection. Add it to the target config or pass --collection.`,
    );
  }
  if (!Number.isFinite(commissionRate) || commissionRate <= 0 || commissionRate > 1) {
    throw new Error(`--commission must be a fraction between 0 and 1, got "${commissionRate}"`);
  }
  if (!['paid', 'createdAt'].includes(dateField)) {
    throw new Error(`--date-field must be "paid" or "createdAt", got "${dateField}"`);
  }

  console.log(`Target:     ${target.name} (${target.key})`);
  console.log(`Campaign:   ${campaignArg ?? '(must be passed with --campaign)'}`);
  console.log(`Collection: ${collection}`);
  console.log(`Commission: ${(commissionRate * 100).toFixed(0)}% of order revenue`);
  console.log(`Order date: ${dateField === 'paid' ? 'paymentVerifiedAt → issuedAt → createdAt' : 'createdAt'}`);
  console.log(`Orders:     paymentStatus in [${PAID_STATUSES.join(', ')}] (REFUNDED, FAILED, PENDING, UNPAID excluded)`);

  if (dryRun) {
    console.log('Dry run: no Google Ads call, no Mongo connection, no file written.');
    console.log('Live run needs: GOOGLE_ADS_* credentials and MONGO_URI.');
    return;
  }

  const customer = createAdsCustomer();
  const account = await fetchAccount(customer);
  const campaign = await resolveCampaign(customer, campaignArg);

  const today = zonedDayFormatter(account.time_zone)(new Date());
  const from = assertIsoDate(flagValue(argv, 'from', campaign.start_date), '--from');
  const to = assertIsoDate(flagValue(argv, 'to', today), '--to');
  if (from > to) throw new Error(`--from (${from}) is after --to (${to})`);

  console.log(`Account:    ${account.descriptive_name} · ${account.time_zone} · ${account.currency_code}`);
  console.log(`Resolved:   ${campaign.name} (${campaign.id}), started ${campaign.start_date}`);
  console.log(`Window:     ${from} → ${to} (${account.time_zone})`);

  const metrics = await fetchDailyMetrics(customer, campaign.id, from, to);
  const { gclids, truncated } = skipGclid
    ? { gclids: new Set(), truncated: false }
    : await fetchGclids(customer, campaign.id, from, to, (line) => console.log(line));

  const utmCampaigns = new Set(
    [campaign.name, slugify(campaign.name), ...(settings.utmCampaigns ?? []), ...extraUtms].map((v) =>
      String(v).toLowerCase(),
    ),
  );
  console.log(`utm match:  ${[...utmCampaigns].join(', ')}`);

  const { matched, scanned, withoutAttribution } = await fetchOrders({
    collection,
    from,
    to,
    utmCampaigns,
    gclids,
    dateField,
  });

  if (matched.length === 0) {
    console.log(
      `! No order matched. ${scanned} paid order(s) were scanned, ${withoutAttribution} of them with no attribution. ` +
        `Check that the ad URLs tag utm_campaign, or widen --utm.`,
    );
  }

  const currencies = new Set(matched.map((o) => o.currency).filter(Boolean));
  if (currencies.size > 1) {
    throw new Error(`Matched orders mix currencies (${[...currencies].join(', ')}); this report assumes one.`);
  }
  const orderCurrency = [...currencies][0] ?? account.currency_code;
  if (orderCurrency !== account.currency_code) {
    throw new Error(
      `Order revenue is in ${orderCurrency} but Ads spend is in ${account.currency_code}. ` +
        'Profit would be meaningless without a conversion rate, so nothing was written.',
    );
  }

  const localDay = zonedDayFormatter(account.time_zone);
  const days = dayList(from, to);
  const { rows, outside } = buildDaily({ days, metrics, orders: matched, localDay, commissionRate });
  const weekly = buildWeekly(rows);

  const totalSpend = sum(rows, 'spend');
  const totalCommission = sum(rows, 'commission');
  const totalProfit = sum(rows, 'profit');
  const totalOrders = sum(rows, 'orders');
  const byGclidOnly = matched.filter((o) => o.matchedBy === 'gclid').length;

  const notes = [
    ['Generated', new Date().toISOString()],
    ['Campaign', `${campaign.name} (${campaign.id}), status ${campaign.status}`],
    ['Ads account', `${account.descriptive_name} (${account.id})`],
    ['Account timezone', account.time_zone],
    ['Account currency', account.currency_code],
    ['Window', `${from} → ${to}`],
    ['Commission rate', `${(commissionRate * 100).toFixed(0)}% of order revenue`],
    ['Orders collection', collection],
    ['Order statuses counted', PAID_STATUSES.join(', ')],
    ['Order date basis', dateField === 'paid' ? 'paymentVerifiedAt → issuedAt → createdAt' : 'createdAt'],
    ['Attribution match', `utm_campaign in [${[...utmCampaigns].join(', ')}], or gclid seen on this campaign`],
    ['gclid matches', skipGclid ? 'skipped (--no-gclid)' : `${byGclidOnly} order(s) matched by gclid alone`],
    ['gclid coverage', skipGclid
      ? 'none'
      : truncated
        ? `click_view only goes back ${CLICK_VIEW_WINDOW_DAYS} days, so earlier days rely on utm_campaign only`
        : 'full window'],
    ['Paid orders scanned', String(scanned)],
    ['Paid orders with no attribution at all', String(withoutAttribution)],
    ['Matched orders outside the window', String(outside)],
    ['Caveat', 'Spend is dated by click, orders by payment date, so a single day is not a strict cohort.'],
  ];

  const defaultName = `ads-profitability-${target.key}-${campaign.id}-${from}_${to}.xlsx`;
  const outPath = resolve(process.cwd(), flagValue(argv, 'out', defaultName));
  await writeWorkbook({
    path: outPath,
    meta: { currency: account.currency_code, commissionRate, notes },
    rows,
    weekly,
  });

  const fmt = (n) => `${n.toFixed(2)} ${account.currency_code}`;
  console.log(`Spend:      ${fmt(totalSpend)}`);
  console.log(`Orders:     ${totalOrders} (revenue ${fmt(sum(rows, 'revenue'))})`);
  console.log(`Commission: ${fmt(totalCommission)}`);
  console.log(`Profit:     ${fmt(totalProfit)}  → ${totalProfit >= 0 ? 'PROFITABLE' : 'LOSS'}`);
  console.log(`ROAS:       ${totalSpend ? (totalCommission / totalSpend).toFixed(2) : 'n/a'} (commission per unit spend)`);
  console.log(`Cost/order: ${totalOrders ? fmt(totalSpend / totalOrders) : 'n/a'}`);
  if (withoutAttribution) console.log(`Note:       ${withoutAttribution} paid order(s) in range carry no attribution and cannot be credited.`);
  if (outside) console.log(`Note:       ${outside} matched order(s) fall outside ${from} → ${to}.`);
  console.log(`Written:    ${outPath}`);
}
