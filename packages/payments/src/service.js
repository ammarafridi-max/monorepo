import { AppError } from '@travel-suite/utils';

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}

/**
 * @param {{
 *   stripe: import('stripe').Stripe,
 *   db?: import('mongoose').Connection,
 *   PaymentLinkSchema?: import('mongoose').Schema,
 *   ProductSchema?: import('mongoose').Schema,
 * }} deps
 */
export function createPaymentService({ stripe, db, PaymentLinkSchema, ProductSchema }) {
  const PaymentLink =
    db && PaymentLinkSchema
      ? getOrRegisterModel(db, 'payment-link', PaymentLinkSchema)
      : null;
  const Product =
    db && ProductSchema
      ? getOrRegisterModel(db, 'Product', ProductSchema)
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

  // -- Products (reusable catalog) -----------------------------------------

  const createProduct = async ({ name, unitAmount, currency = 'aed', description, createdBy }) => {
    if (!Product) {
      throw new AppError('Product store not configured', 500);
    }
    const trimmedName = (name || '').trim();
    if (!trimmedName) throw new AppError('Product name is required', 400);

    const unit = Number(unitAmount);
    if (!unit || unit <= 0 || Number.isNaN(unit)) {
      throw new AppError('Invalid unit amount', 400);
    }

    const normalizedCurrency = String(currency || 'aed').toLowerCase().trim();

    // Create a reusable Stripe Price that can be referenced by many Payment Links
    const price = await stripe.prices.create({
      currency: normalizedCurrency,
      unit_amount: Math.round(unit * 100),
      product_data: { name: trimmedName.slice(0, 250) },
    });

    const record = await Product.create({
      name: trimmedName,
      description: (description || '').trim(),
      unitAmount: unit,
      currency: normalizedCurrency,
      stripePriceId: price.id,
      stripeProductId: typeof price.product === 'string' ? price.product : price.product?.id,
      isActive: true,
      createdBy: createdBy
        ? { _id: createdBy._id, name: createdBy.name, email: createdBy.email }
        : undefined,
    });

    return record.toObject();
  };

  const listProducts = async ({ activeOnly, page = 1, limit = 50 } = {}) => {
    if (!Product) {
      throw new AppError('Product store not configured', 500);
    }

    const filter = {};
    if (activeOnly) filter.isActive = true;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
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

  const getProduct = async ({ id }) => {
    if (!Product) {
      throw new AppError('Product store not configured', 500);
    }
    if (!id) throw new AppError('Product id is required', 400);
    const record = await Product.findById(id).lean();
    if (!record) throw new AppError('Product not found', 404);
    return record;
  };

  const setProductActive = async ({ id, active }) => {
    if (!Product) {
      throw new AppError('Product store not configured', 500);
    }
    if (!id) throw new AppError('Product id is required', 400);
    if (typeof active !== 'boolean') {
      throw new AppError('"active" must be a boolean', 400);
    }
    const record = await Product.findByIdAndUpdate(
      id,
      { $set: { isActive: active } },
      { new: true },
    ).lean();
    if (!record) throw new AppError('Product not found', 404);
    return record;
  };

  /**
   * Update a Product. Handles:
   *   - name change: updates the Stripe Product name (customer-facing)
   *   - description change: DB-only
   *   - unitAmount/currency change: Stripe Prices are immutable, so we archive
   *     the old Price and create a new one attached to the same Stripe Product.
   *     Existing PaymentLinks that already reference the old Price keep working
   *     at the old price; only new links spawned from this product use the new
   *     price.
   */
  const updateProduct = async ({ id, name, description, unitAmount, currency }) => {
    if (!Product) {
      throw new AppError('Product store not configured', 500);
    }
    if (!id) throw new AppError('Product id is required', 400);

    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    const update = {};

    if (typeof name === 'string') {
      const trimmed = name.trim();
      if (!trimmed) throw new AppError('Product name cannot be empty', 400);
      if (trimmed !== product.name) {
        update.name = trimmed;
        // Sync customer-facing name on Stripe.
        if (product.stripeProductId) {
          try {
            await stripe.products.update(product.stripeProductId, { name: trimmed.slice(0, 250) });
          } catch (err) {
            throw new AppError(`Failed to update Stripe product: ${err.message}`, 500);
          }
        }
      }
    }

    if (typeof description === 'string') {
      update.description = description.trim();
    }

    // Price/currency change → create a new Stripe Price.
    let newUnit = product.unitAmount;
    let newCurrency = product.currency;
    let priceChanging = false;

    if (unitAmount !== undefined && unitAmount !== null && unitAmount !== '') {
      const u = Number(unitAmount);
      if (!u || u <= 0 || Number.isNaN(u)) {
        throw new AppError('Invalid unit amount', 400);
      }
      if (u !== product.unitAmount) {
        newUnit = u;
        priceChanging = true;
      }
    }

    if (typeof currency === 'string') {
      const c = currency.toLowerCase().trim();
      if (c && c !== product.currency) {
        newCurrency = c;
        priceChanging = true;
      }
    }

    if (priceChanging) {
      if (!product.stripeProductId) {
        throw new AppError('Cannot change price — product is missing a Stripe Product reference', 500);
      }
      // Create new Price attached to the same Stripe Product.
      const newPrice = await stripe.prices.create({
        product: product.stripeProductId,
        currency: newCurrency,
        unit_amount: Math.round(newUnit * 100),
      });
      // Archive the old Price (best effort).
      try {
        await stripe.prices.update(product.stripePriceId, { active: false });
      } catch {
        // Already inactive or unreachable — continue.
      }
      update.stripePriceId = newPrice.id;
      update.unitAmount = newUnit;
      update.currency = newCurrency;
    }

    if (Object.keys(update).length === 0) {
      return product.toObject();
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    ).lean();
    return updated;
  };

  /**
   * Delete a Product. Allowed only if no Payment Link (any status) references
   * it via top-level productId or lineItems[].productId. Archives the Stripe
   * Price + Product (Stripe doesn't allow hard delete once a Price is created).
   */
  const deleteProduct = async ({ id }) => {
    if (!Product) {
      throw new AppError('Product store not configured', 500);
    }
    if (!id) throw new AppError('Product id is required', 400);
    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    // Block delete if any Payment Link references this product.
    if (PaymentLink) {
      const usageCount = await PaymentLink.countDocuments({
        $or: [{ productId: product._id }, { 'lineItems.productId': product._id }],
      });
      if (usageCount > 0) {
        throw new AppError(
          `Product is referenced by ${usageCount} payment link${usageCount > 1 ? 's' : ''}. Delete those first.`,
          400,
        );
      }
    }

    // Archive on Stripe (best effort — don't block delete if Stripe fails).
    try {
      if (product.stripePriceId) {
        await stripe.prices.update(product.stripePriceId, { active: false });
      }
    } catch {
      // Stripe Price already inactive or unreachable — continue.
    }
    try {
      if (product.stripeProductId) {
        await stripe.products.update(product.stripeProductId, { active: false });
      }
    } catch {
      // Stripe Product already inactive or unreachable — continue.
    }

    await Product.deleteOne({ _id: product._id });
    return { _id: product._id };
  };

  // -- Payment links --------------------------------------------------------

  /**
   * Create a Payment Link with one or more line items.
   *
   * Accepts an `items` array (preferred). Each item is either:
   *   - { productId, quantity }                — references a catalog Product (Stripe Price reused)
   *   - { productName, amount, currency, quantity } — ad-hoc inline item (creates a fresh Stripe Price)
   *
   * Or legacy single-item shape (back-compat):
   *   - { productId, quantity }
   *   - { amount, productName, currency }
   *
   * All items must share the same currency (Stripe constraint).
   */
  const createPaymentLink = async ({
    items,
    productId,
    quantity,
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

    // Normalise inputs to a single items[] array.
    let inputItems;
    if (Array.isArray(items) && items.length > 0) {
      inputItems = items;
    } else if (productId) {
      inputItems = [{ productId, quantity: quantity ?? 1 }];
    } else if (amount !== undefined && amount !== null && amount !== '') {
      inputItems = [{ productName, amount, currency, quantity: 1 }];
    } else {
      throw new AppError('Either items, productId, or amount is required', 400);
    }

    // Resolve each item: catalog lookup or fresh Stripe Price.
    const resolved = [];
    for (const item of inputItems) {
      const qty = Math.max(1, Math.floor(Number(item.quantity ?? 1)));
      if (!qty || Number.isNaN(qty)) {
        throw new AppError('Invalid quantity', 400);
      }

      if (item.productId) {
        if (!Product) {
          throw new AppError('Product store not configured', 500);
        }
        const product = await Product.findById(item.productId);
        if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
        if (!product.isActive) {
          throw new AppError(`Product "${product.name}" is inactive`, 400);
        }
        resolved.push({
          productId: product._id,
          productName: product.name,
          unitAmount: product.unitAmount,
          currency: product.currency,
          quantity: qty,
          stripePriceId: product.stripePriceId,
          stripeProductId: product.stripeProductId,
        });
      } else {
        // Ad-hoc inline item — create a one-shot Stripe Price.
        const itemAmount = Number(item.amount);
        if (!itemAmount || itemAmount <= 0 || Number.isNaN(itemAmount)) {
          throw new AppError('Invalid item amount', 400);
        }
        const itemCurrency = String(item.currency || currency || 'aed').toLowerCase().trim();
        const itemName = (item.productName || productName || 'Custom payment').toString().trim();
        const label = (itemName || description || 'Custom payment').slice(0, 250);

        const price = await stripe.prices.create({
          currency: itemCurrency,
          unit_amount: Math.round(itemAmount * 100),
          product_data: { name: label },
        });

        resolved.push({
          productId: null,
          productName: itemName,
          unitAmount: itemAmount,
          currency: itemCurrency,
          quantity: qty,
          stripePriceId: price.id,
          stripeProductId: typeof price.product === 'string' ? price.product : price.product?.id,
        });
      }
    }

    // Currency must match across all items (Stripe constraint).
    const currencies = new Set(resolved.map((r) => r.currency));
    if (currencies.size > 1) {
      throw new AppError(
        `All items must share the same currency (got: ${[...currencies].join(', ')})`,
        400,
      );
    }
    const sharedCurrency = [...currencies][0];

    // Total amount across all line items.
    const total = resolved.reduce((sum, r) => sum + r.unitAmount * r.quantity, 0);

    // Customer-facing summary name (shown only on legacy lists; Stripe shows per-line).
    const summaryName = resolved.length === 1
      ? resolved[0].productName
      : `${resolved.length} items`;

    // One Stripe Payment Link with N line_items.
    const link = await stripe.paymentLinks.create({
      line_items: resolved.map((r) => ({ price: r.stripePriceId, quantity: r.quantity })),
      metadata: { productType: 'payment-link' },
      payment_intent_data: { metadata: { productType: 'payment-link' } },
      after_completion: successUrl
        ? { type: 'redirect', redirect: { url: successUrl } }
        : { type: 'hosted_confirmation' },
    });

    const isSingle = resolved.length === 1;
    const record = await PaymentLink.create({
      stripePaymentLinkId: link.id,
      // First line's Stripe references kept at top level for legacy display code.
      stripePriceId: resolved[0].stripePriceId,
      stripeProductId: resolved[0].stripeProductId,
      url: link.url,
      amount: total,
      currency: sharedCurrency,
      productName: summaryName,
      description: description || '',
      lineItems: resolved.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        unitAmount: r.unitAmount,
        quantity: r.quantity,
        stripePriceId: r.stripePriceId,
      })),
      // Legacy single-product fields populated only when there's exactly one line.
      productId: isSingle ? resolved[0].productId : null,
      unitAmount: isSingle ? resolved[0].unitAmount : null,
      quantity: isSingle ? resolved[0].quantity : 1,
      createdBy: createdBy
        ? { _id: createdBy._id, name: createdBy.name, email: createdBy.email }
        : undefined,
      status: 'active',
    });

    return record;
  };

  /**
   * Update a Payment Link. Supports:
   *   - active: boolean → toggles status on Stripe + DB. Refused for paid links.
   *   - description: string → DB-only (internal admin note)
   *
   * Substantive edits (line items, products, quantities) are NOT supported —
   * Stripe Payment Links don't allow swapping prices post-creation. For those
   * cases, delete the link and create a new one.
   */
  const updatePaymentLink = async ({ id, active, description }) => {
    if (!PaymentLink) {
      throw new AppError('Payment link store not configured', 500);
    }
    if (!id) throw new AppError('Payment link id is required', 400);

    const record = await PaymentLink.findById(id);
    if (!record) throw new AppError('Payment link not found', 404);

    let mutated = false;

    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        throw new AppError('"active" must be a boolean', 400);
      }
      if (record.status === 'paid') {
        throw new AppError('Cannot change status of a paid link', 400);
      }
      // Stripe is the source of truth — flip there first.
      await stripe.paymentLinks.update(record.stripePaymentLinkId, { active });
      record.status = active ? 'active' : 'inactive';
      mutated = true;
    }

    if (description !== undefined) {
      record.description = String(description || '').trim();
      mutated = true;
    }

    if (!mutated) {
      throw new AppError('No fields to update', 400);
    }

    await record.save();
    return record.toObject();
  };

  // Back-compat thin wrapper.
  const setPaymentLinkActive = ({ id, active }) =>
    updatePaymentLink({ id, active });

  const getPaymentLink = async ({ id }) => {
    if (!PaymentLink) {
      throw new AppError('Payment link store not configured', 500);
    }
    if (!id) throw new AppError('Payment link id is required', 400);

    const query = PaymentLink.findById(id);
    if (Product) query.populate('productId', 'name unitAmount currency');
    const record = await query.lean();
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
   * Delete a Payment Link. Allowed only if not paid. Deactivates on Stripe
   * (Stripe Payment Links can be deactivated but not deleted) before removing
   * the DB record.
   */
  const deletePaymentLink = async ({ id }) => {
    if (!PaymentLink) {
      throw new AppError('Payment link store not configured', 500);
    }
    if (!id) throw new AppError('Payment link id is required', 400);
    const record = await PaymentLink.findById(id);
    if (!record) throw new AppError('Payment link not found', 404);

    if (record.status === 'paid') {
      throw new AppError('Cannot delete a paid payment link', 400);
    }

    // Deactivate on Stripe first (best effort — never blocks delete).
    try {
      await stripe.paymentLinks.update(record.stripePaymentLinkId, { active: false });
    } catch {
      // Already inactive or unreachable — continue with DB delete.
    }

    await PaymentLink.deleteOne({ _id: record._id });
    return { _id: record._id };
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
    createProduct,
    listProducts,
    getProduct,
    setProductActive,
    updateProduct,
    deleteProduct,
    updatePaymentLink,
    deletePaymentLink,
    getRevenue,
    listCharges,
  };
}
