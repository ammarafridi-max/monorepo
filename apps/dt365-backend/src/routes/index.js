import { Router } from "express";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter, createAdminBadgesRouter } from "@travel-suite/admin-users";
import {
  createAffiliatesRouter,
  registerAffiliateModels,
} from "@travel-suite/affiliates";
import { createAssistantRouter, assistantDatasets } from "@travel-suite/assistant";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createCloudinaryStorage } from "@travel-suite/cloudinary";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import {
  createFlightRouter,
  createAirportsRouter,
} from "@travel-suite/flights";
import { createAirLabsClient } from "@travel-suite/airlabs";
import { createSerpApiClient } from "@travel-suite/serpapi";
import { createTicketsRouter } from "@travel-suite/tickets";
import { createHotelBookingsRouter } from "@travel-suite/hotel-bookings";
import { createLiteApiClient } from "@travel-suite/liteapi";
import { createConversationsRouter } from "@travel-suite/conversations";
import { createWhatsAppClient } from "@travel-suite/whatsapp";
import { createNotificationsService } from "@travel-suite/notifications";
import {
  createStripeClient,
  createStripeWebhookHandler,
  createPaymentService,
  createPaymentsController,
  createPaymentsAdminRouter,
  PaymentLinkSchema,
  StripeProductSchema,
} from "@travel-suite/payments";
import { createPayPalClient } from "@travel-suite/paypal";
import { db } from "../utils/db.js";
import { createBrevoClient } from "@travel-suite/brevo";
import { createMetaCapiClient } from "@travel-suite/meta-capi";
import { createOpenAICapiClient } from "@travel-suite/openai-capi";
import { createOpenAIAdsClient } from "@travel-suite/openai-ads";
import { createOpenAIAdsRouter } from "@travel-suite/openai-ads-admin";
import { sendEmail } from "../utils/email.js";
import config from "../utils/config.js";
import { logger } from "@travel-suite/utils";

const { Affiliate: AffiliateModel } = registerAffiliateModels({ db });

const router = Router();
const brevo = createBrevoClient({ apiKey: config.brevoApiKey, logger });


const {
  router: authRouter,
  middleware: auth,
  AdminUser,
} = createAuthRouter({
  db,
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
  cookieExpiresInDays: config.jwtCookieExpiresInDays,
  nodeEnv: config.nodeEnv,
  sendEmail,
  brandName: "Dummy Ticket 365",
  loginUrl: `${config.frontendUrl}/admin/login`,
  logger,
});

router.use("/auth", authRouter);

router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

const imageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "dt365/blog",
});
router.use("/blogs", createBlogRouter({ db, auth, imageStorage, anthropicApiKey: config.anthropicApiKey }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

const currencyInUseReason = async (code) => {
  const [paidOrders, priceBooks] = await Promise.all([
    TicketModel.countDocuments({ "amountPaid.currency": code }),
    db.collection("dummy-ticket-prices").countDocuments({ currency: code }),
  ]);
  if (paidOrders > 0) {
    return `${code} cannot be removed: ${paidOrders} paid order${paidOrders === 1 ? " was" : "s were"} charged in it and would drop out of revenue totals.`;
  }
  if (priceBooks > 0) {
    return `${code} cannot be removed while it still has a dummy ticket price book. Delete the price book first.`;
  }
  return null;
};

router.use(
  "/currencies",
  createCurrenciesRouter({ db, auth, isCurrencyInUse: currencyInUseReason }),
);

const airlabs = createAirLabsClient({ apiKey: config.airlabs.apiKey });
const serpapi = createSerpApiClient({ apiKey: config.serpapi.apiKey });
const airlineLogoStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "dt365/airlines",
});
router.use("/flights", createFlightRouter({ db, airlabs, serpapi, auth, logoStorage: airlineLogoStorage }));
router.use("/airports", createAirportsRouter({ airlabs }));

const notifications = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: "Dummy Ticket 365",
    teamName: "Dummy Ticket 365 Team",
    adminEmail: config.adminEmail,
    website: "https://dummyticket365.com",
    paymentsSenderName: "Dummy Ticket 365 Payments",
    deliverySenderName: "Dummy Ticket 365 Delivery",
    customerSenderName: "Dummy Ticket 365",
    theme: {
      primaryColor: "#1e60a6",
      accentColor: "#ff603a",
      linkColor: "#1e60a6",
    },
  },
});

notifications.sendTicketPaymentToAdmin = async () => {};

const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

let paypal = null;
if (config.paypal.clientId && config.paypal.clientSecret) {
  paypal = createPayPalClient({
    clientId: config.paypal.clientId,
    clientSecret: config.paypal.clientSecret,
    mode: config.paypal.mode,
  });
  logger.info(`[paypal] Client initialised (mode: ${config.paypal.mode})`);
} else {
  logger.warn("[paypal] Credentials not configured — PayPal checkout disabled");
}

const metaCapi = createMetaCapiClient({
  pixelId: config.meta.pixelId,
  accessToken: config.meta.capiAccessToken,
  testEventCode: config.meta.testEventCode,
  logger,
});
if (!metaCapi.isConfigured()) {
  logger.warn("[meta-capi] Pixel ID or access token not configured — server-side purchase events disabled");
}

const openaiCapi = createOpenAICapiClient({
  pixelId: config.openai.pixelId,
  apiKey: config.openai.capiApiKey,
  logger,
});
if (!openaiCapi.isConfigured()) {
  logger.warn("[openai-capi] Pixel ID or API key not configured — server-side order events disabled");
}

const reservationStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "dt365/dummy-tickets",
});
const {
  router: ticketsRouter,
  pricingRouter,
  handleStripeSuccess,
  TicketModel,
} = createTicketsRouter({
  db,
  auth,
  stripe,
  paypal,
  notifications,
  frontendUrl: config.frontendUrl,
  AffiliateModel,
  brevo,
  reviewListId: config.brevoTicketListId,
  reservationStorage,
  sendEmail,
  metaCapi,
  openaiCapi,
});
router.use("/tickets", ticketsRouter);
router.use("/pricing", pricingRouter);

router.use(
  "/admin-badges",
  createAdminBadgesRouter({
    auth,
    counters: {
      pendingDummyTickets: () =>
        TicketModel.countDocuments({ paymentStatus: "PAID", orderStatus: "PENDING" }),
      unreadChats: () =>
        db.models.conversation
          ? db.models.conversation.countDocuments({ status: "OPEN", unreadCount: { $gt: 0 } })
          : 0,
    },
  }),
);

const CurrencyModel = db.models.currency ?? null;
const liteapiConfigured = Boolean(config.liteapi.apiKey);
let handleHotelStripeSuccess = null;

if (liteapiConfigured) {
  const {
    router: hotelBookingsRouter,
    pricingRouter: hotelPricingRouter,
    handleStripeSuccess: onHotelPaid,
  } = createHotelBookingsRouter({
    db,
    auth,
    stripe,
    supplier: createLiteApiClient({ apiKey: config.liteapi.apiKey, logger }),
    citySuggest: async (search) =>
      (await airlabs.suggestCities(search))
        .filter((c) => c?.city_code)
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .map((c) => ({ name: c.name, countryCode: c.country_code, cityCode: c.city_code })),
    notifications,
    frontendUrl: config.frontendUrl,
    AffiliateModel,
    CurrencyModel,
  });
  handleHotelStripeSuccess = onHotelPaid;
  router.use("/hotel-bookings", hotelBookingsRouter);
  router.use("/hotel-booking-pricing", hotelPricingRouter);
} else {
  logger.warn("[hotel-bookings] LITEAPI_API_KEY not configured — hotel reservations disabled");
}

router.use(
  "/affiliates",
  createAffiliatesRouter({
    db,
    auth,
    TicketModel,
    notifications,
    trackingBaseUrl: config.frontendUrl,
  }),
);

const { router: openaiAdsRouter, service: openaiAdsService } = createOpenAIAdsRouter({
  adsClient: createOpenAIAdsClient({ apiKey: config.openai.adsApiKey, logger }),
  auth,
  maxDailyBudget: config.openai.adsMaxDailyBudget,
  logger,
  countOwnConversions: async ({ from, to }) => {
    const rows = await TicketModel.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          paidAt: { $gte: from, $lt: to },
          $or: [
            { "attribution.last.channel": "chatgpt_ads" },
            { "attribution.last.oppref": { $nin: [null, ""] } },
            { "openaiAttribution.oppref": { $nin: [null, ""] } },
          ],
        },
      },
      { $group: { _id: "$amountPaid.currency", orders: { $sum: 1 }, amount: { $sum: "$amountPaid.amount" } } },
    ]);
    return {
      orders: rows.reduce((n, r) => n + r.orders, 0),
      revenue: rows.map((r) => ({ currency: r._id, amount: Math.round(r.amount * 100) / 100 })),
    };
  },
});
router.use("/openai-ads", openaiAdsRouter);

const paymentService = createPaymentService({
  stripe,
  db,
  PaymentLinkSchema,
  StripeProductSchema,
});
const paymentsController = createPaymentsController({
  service: paymentService,
});
router.use(
  "/payments",
  createPaymentsAdminRouter({ controller: paymentsController, auth }),
);

async function handlePaymentLinkSuccess(session) {
  const updated = await paymentService.markPaymentLinkPaid({ session });
  if (!updated) {
    logger.warn("[payment-link] No matching record for session", {
      sessionId: session.id,
      paymentLink: session.payment_link,
    });
    return;
  }
  await notifications.sendPaymentLinkPaidToAdmin({
    amount: updated.amount,
    currency: updated.currency,
    payerName: updated.paidByName || session.customer_details?.name,
    payerEmail: updated.paidByEmail || session.customer_details?.email,
    description: updated.description,
    createdByName: updated.createdBy?.name,
    paymentLinkId: updated.stripePaymentLinkId,
    sessionId: updated.sessionId,
    paidAt: updated.paidAt,
  });
}

const whatsappConfigured = Boolean(
  config.whatsapp.appSecret && config.whatsapp.webhookVerifyToken,
);

let whatsappWebhook = null;

if (whatsappConfigured) {
  const whatsapp = createWhatsAppClient({
    accessToken: config.whatsapp.accessToken,
    phoneNumberId: config.whatsapp.phoneNumberId,
    logger,
  });
  const { router: conversationsRouter, webhook } = createConversationsRouter({
    db,
    auth,
    whatsapp,
    AdminUser,
    appSecret: config.whatsapp.appSecret,
    verifyToken: config.whatsapp.webhookVerifyToken,
  });
  router.use("/conversations", conversationsRouter);
  whatsappWebhook = webhook;
} else {
  logger.warn("[whatsapp] Credentials not configured — chat inbox disabled");
}

if (config.anthropicApiKey) {
  const { router: assistantRouter } = createAssistantRouter({
    db,
    auth,
    anthropicApiKey: config.anthropicApiKey,
    stripe,
    ads: config.openai.adsApiKey ? openaiAdsService : null,
    brand: { name: "Dummy Ticket 365" },
    logger,
    datasets: [
      assistantDatasets.dummyTickets(TicketModel),
      assistantDatasets.hotelBookings(db.models["hotel-booking"]),
      assistantDatasets.affiliates(AffiliateModel),
      assistantDatasets.affiliatePayouts(db.models['affiliate-payout']),
      assistantDatasets.blogPosts(db.models.blog),
    ],
  });
  router.use("/assistant", assistantRouter);
} else {
  logger.warn("[assistant] ANTHROPIC_API_KEY not configured — admin assistant disabled");
}

// -- WhatsApp webhook (raw body required — mounted in app.js before JSON middleware) --
export const whatsappWebhookHandlers = whatsappWebhook;

export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: {
    ticket: handleStripeSuccess,
    "payment-link": handlePaymentLinkSuccess,
    ...(handleHotelStripeSuccess ? { "hotel-booking": handleHotelStripeSuccess } : {}),
  },
});

export default router;
