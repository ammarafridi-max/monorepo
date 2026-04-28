import { AppError } from '@travel-suite/utils';

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}

/**
 * @param {{
 *   stripe: import('stripe').Stripe,
 *   db?: import('mongoose').Connection,
 *   PaymentLinkSchema?: import('mongoose').Schema,
 * }} deps
 */
export function createPaymentService({ stripe, db, PaymentLinkSchema }) {
  const PaymentLink =
    db && PaymentLinkSchema
      ? getOrRegisterModel(db, 'PaymentLink', PaymentLinkSchema)
      : null;

  // -- Checkout session (existing) ------------------------------------------

  const createCheckoutSession = async ({
    amount,
    currency = 'aed',
    productName,
    customerEmail,
    successUrl,
    cancelUrl,
    metadata = {},
    idempotencyKey,
  }) => {
    const totalAmount = Number(amount);
    if (!totalAmount || totalAmount <= 0 || Number.isNaN(totalAmount)) {
      throw new AppError('Invalid payment amount', 400);
    }

    return stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: customerEmail,
        invoice_creation: { enabled: true },
        metadata,
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Math.round(totalAmount * 100),
              product_data: { name: productName },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  };

  // -- Payment links --------------------------------------------------------

  const createPaymentLink = async ({
    amount,
    currency = 'aed',
    description,
    productName,
    createdBy,
    successUrl,
  }) => {
    if (!PaymentLink) {
      throw new AppError('Payment link store not configured', 500);
    }

    const totalAmount = Number(amount);
    if (!totalAmount || totalAmount <= 0 || Number.isNaN(totalAmount)) {
      throw new AppError('Invalid payment amount', 400);
    }

    const normalizedCurrency = String(currency || 'aed').toLowerCase().trim();
    const trimmedProductName = (productName || '').trim();
    const label = (trimmedProductName || description || 'Custom payment').slice(0, 250);

    // 1. One-shot Price (Stripe creates an inline product when product_data is given)
    const price = await stripe.prices.create({
      currency: normalizedCurrency,
      unit_amount: Math.round(totalAmount * 100),
      product_data: { name: label },
    });

    // 2. Payment Link tied to that Price. The webhook routes by metadata.productType.
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { productType: 'payment-link' },
      payment_intent_data: { metadata: { productType: 'payment-link' } },
      after_completion: successUrl
        ? { type: 'redirect', redirect: { url: successUrl } }
        : { type: 'hosted_confirmation' },
    });

    // 3. Persist
    const record = await PaymentLink.create({
      stripePaymentLinkId: link.id,
      stripePriceId: price.id,
      stripeProductId: typeof price.product === 'string' ? price.product : price.product?.id,
      url: link.url,
      amount: totalAmount,
      currency: normalizedCurrency,
      productName: trimmedProductName,
      description: description || '',
      createdBy: createdBy
        ? { _id: createdBy._id, name: createdBy.name, email: createdBy.email }
        : undefined,
      status: 'active',
    });

    return record;
  };

  /**
   * Activate or deactivate a payment link. Updates Stripe (the source of truth
   * for whether new payments can be accepted) AND the DB status field.
   *
   * Refuses to flip a 'paid' record — once a customer has paid, the link's
   * lifecycle is terminal and toggling it is meaningless.
   */
  const setPaymentLinkActive = async ({ id, active }) => {
    if (!PaymentLink) {
      throw new AppError('Payment link store not configured', 500);
    }
    if (!id) throw new AppError('Payment link id is required', 400);
    if (typeof active !== 'boolean') {
      throw new AppError('"active" must be a boolean', 400);
    }

    const record = await PaymentLink.findById(id);
    if (!record) throw new AppError('Payment link not found', 404);

    if (record.status === 'paid') {
      throw new AppError('Cannot change status of a paid link', 400);
    }

    // Stripe is the source of truth — flip there first. If it fails, the DB
    // still reflects reality.
    await stripe.paymentLinks.update(record.stripePaymentLinkId, { active });

    record.status = active ? 'active' : 'inactive';
    await record.save();
    return record.toObject();
  };

  const getPaymentLink = async ({ id }) => {
    if (!PaymentLink) {
      throw new AppError('Payment link store not configured', 500);
    }
    if (!id) throw new AppError('Payment link id is required', 400);

    const record = await PaymentLink.findById(id).lean();
    if (!record) throw new AppError('Payment link not found', 404);
    return record;
  };

  const listPaymentLinks = async ({ status, page = 1, limit = 20 } = {}) => {
    if (!PaymentLink) {
      throw new AppError('Payment link store not configured', 500);
    }

    const filter = {};
    if (status) filter.status = status;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      PaymentLink.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PaymentLink.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  };

  /**
   * Marks a payment link record as paid based on a webhook session payload.
   * Returns the updated record (or null if no link is associated with the session).
   */
  const markPaymentLinkPaid = async ({ session }) => {
    if (!PaymentLink) return null;
    const stripePaymentLinkId =
      typeof session.payment_link === 'string'
        ? session.payment_link
        : session.payment_link?.id;
    if (!stripePaymentLinkId) return null;

    const update = {
      status: 'paid',
      paidAt: new Date(),
      sessionId: session.id,
      transactionId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
      paidByName: session.customer_details?.name || undefined,
      paidByEmail: session.customer_details?.email || undefined,
    };

    return PaymentLink.findOneAndUpdate(
      { stripePaymentLinkId },
      { $set: update },
      { new: true },
    );
  };

  // -- Revenue analytics (live from Stripe) ---------------------------------

  /**
   * Returns aggregated revenue between two unix timestamps (seconds).
   * Uses balance transactions so amounts are net of refunds and reflect what
   * actually settled. Currency-bucketed because Stripe doesn't auto-convert.
   */
  const getRevenue = async ({ from, to }) => {
    const fromTs = Number(from);
    const toTs = Number(to);
    if (!fromTs || !toTs || fromTs >= toTs) {
      throw new AppError('Invalid date range', 400);
    }

    const byCurrency = {}; // { aed: { gross: 0, net: 0, count: 0 } }
    const byDayByCurrency = {}; // { aed: { '2026-04-28': 5000, ... } }

    for await (const txn of stripe.balanceTransactions.list({
      type: 'charge',
      created: { gte: fromTs, lte: toTs },
      limit: 100,
    })) {
      const cur = txn.currency;
      if (!byCurrency[cur]) byCurrency[cur] = { gross: 0, net: 0, count: 0 };
      byCurrency[cur].gross += txn.amount;
      byCurrency[cur].net += txn.net;
      byCurrency[cur].count += 1;

      const day = new Date(txn.created * 1000).toISOString().slice(0, 10);
      if (!byDayByCurrency[cur]) byDayByCurrency[cur] = {};
      byDayByCurrency[cur][day] = (byDayByCurrency[cur][day] || 0) + txn.amount;
    }

    // Convert to major units and shape byDay as sorted arrays
    const result = {};
    for (const [cur, totals] of Object.entries(byCurrency)) {
      const days = Object.entries(byDayByCurrency[cur] || {})
        .map(([date, amt]) => ({ date, amount: amt / 100 }))
        .sort((a, b) => a.date.localeCompare(b.date));
      result[cur] = {
        currency: cur,
        gross: totals.gross / 100,
        net: totals.net / 100,
        count: totals.count,
        average: totals.count ? totals.net / totals.count / 100 : 0,
        byDay: days,
      };
    }

    return { from: fromTs, to: toTs, byCurrency: result };
  };

  /**
   * Lists recent charges for the orders table. Returns lightweight projections.
   */
  const listCharges = async ({ from, to, limit = 25, startingAfter } = {}) => {
    const params = { limit: Math.min(Number(limit) || 25, 100) };
    if (from && to) {
      params.created = { gte: Number(from), lte: Number(to) };
    }
    if (startingAfter) params.starting_after = startingAfter;

    const page = await stripe.charges.list(params);

    const items = page.data.map((c) => ({
      id: c.id,
      amount: c.amount / 100,
      amountRefunded: c.amount_refunded / 100,
      currency: c.currency,
      status: c.status,
      paid: c.paid,
      refunded: c.refunded,
      created: c.created,
      customerEmail: c.billing_details?.email || c.receipt_email || null,
      customerName: c.billing_details?.name || null,
      description: c.description || null,
      receiptUrl: c.receipt_url || null,
      paymentMethod: c.payment_method_details?.type || null,
      productType: c.metadata?.productType || null,
    }));

    return {
      items,
      hasMore: page.has_more,
      nextCursor: page.has_more ? page.data[page.data.length - 1]?.id : null,
    };
  };

  return {
    createCheckoutSession,
    createPaymentLink,
    getPaymentLink,
    listPaymentLinks,
    setPaymentLinkActive,
    markPaymentLinkPaid,
    getRevenue,
    listCharges,
  };
}
