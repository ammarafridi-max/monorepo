const warnUnconfigured = (client, logger, message) => {
  if (!client.isConfigured()) logger.warn(message);
  return client;
};

export function createGoogleAdsConversions({ create, config, logger }) {
  return warnUnconfigured(
    create({
      customerId: config.customerId,
      loginCustomerId: config.loginCustomerId,
      developerToken: config.developerToken,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
      apiVersion: config.apiVersion,
      timezoneOffset: config.timezoneOffset,
      logger,
    }),
    logger,
    '[google-ads-conversions] Credentials not configured — server-side conversion uploads disabled',
  );
}

export function createMetaCapi({ create, config, logger, eventKind = 'purchase' }) {
  return warnUnconfigured(
    create({
      pixelId: config.pixelId,
      accessToken: config.capiAccessToken,
      testEventCode: config.testEventCode,
      logger,
    }),
    logger,
    `[meta-capi] Pixel ID or access token not configured — server-side ${eventKind} events disabled`,
  );
}

export function createOpenAICapi({
  create,
  pixelId,
  apiKey,
  logger,
  message = '[openai-capi] Pixel ID or API key not configured — server-side order events disabled',
}) {
  return warnUnconfigured(create({ pixelId, apiKey, logger }), logger, message);
}

export function createTicketConversionCounter(TicketModel) {
  return async ({ from, to }) => {
    const rows = await TicketModel.aggregate([
      {
        $match: {
          paymentStatus: 'PAID',
          paidAt: { $gte: from, $lt: to },
          $or: [
            { 'attribution.last.channel': 'chatgpt_ads' },
            { 'attribution.last.oppref': { $nin: [null, ''] } },
            { 'openaiAttribution.oppref': { $nin: [null, ''] } },
          ],
        },
      },
      { $group: { _id: '$amountPaid.currency', orders: { $sum: 1 }, amount: { $sum: '$amountPaid.amount' } } },
    ]);
    return {
      orders: rows.reduce((n, r) => n + r.orders, 0),
      revenue: rows.map((r) => ({ currency: r._id, amount: Math.round(r.amount * 100) / 100 })),
    };
  };
}
