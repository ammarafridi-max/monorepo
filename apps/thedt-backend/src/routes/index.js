import { Router } from "express";
import { createAssistantRouter, assistantDatasets } from "@travel-suite/assistant";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import {
  createAffiliatesRouter,
  AffiliateSchema,
} from "@travel-suite/affiliates";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createCloudinaryStorage } from "@travel-suite/cloudinary";
import {
  createFlightRouter,
  createAirportsRouter,
} from "@travel-suite/flights";
import { createAirLabsClient } from "@travel-suite/airlabs";
import { createSerpApiClient } from "@travel-suite/serpapi";
import { createInsuranceRouter } from "@travel-suite/insurance";
import { createTicketsRouter } from "@travel-suite/tickets";
import { createNotificationsService } from "@travel-suite/notifications";
import {
  createStripeClient,
  createStripeWebhookHandler,
  createPaymentService,
  createPaymentsController,
  createPaymentsAdminRouter,
  PaymentLinkSchema,
  ProductSchema,
} from "@travel-suite/payments";
import { db } from "../utils/db.js";
import { wis } from "../utils/wis.js";
import { createBrevoClient } from "@travel-suite/brevo";
import { createMetaCapiClient } from "@travel-suite/meta-capi";
import { createOpenAICapiClient } from "@travel-suite/openai-capi";
import { createOpenAIAdsClient } from "@travel-suite/openai-ads";
import { createOpenAIAdsRouter } from "@travel-suite/openai-ads-admin";
import { sendEmail } from "../utils/email.js";
import { insurancePaymentCompletionEmail, policyIssuedEmail } from "../notifications/insurance.js";
import config from "../utils/config.js";
import { logger } from "@travel-suite/utils";

// -- Model pre-registration (ORDER CRITICAL) -----------------------------------
function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}
const AffiliateModel = getOrRegisterModel(db, "Affiliate", AffiliateSchema);

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
  brandName: "The Dummy Ticket AE",
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
  folder: "thedt/blog",
});
router.use("/blogs", createBlogRouter({ db, auth, imageStorage, anthropicApiKey: config.anthropicApiKey }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));


const airlabs = createAirLabsClient({ apiKey: config.airlabs.apiKey });
const serpapi = createSerpApiClient({ apiKey: config.serpapi.apiKey });
const airlineLogoStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "thedt/airlines",
});
router.use("/flights", createFlightRouter({ db, airlabs, serpapi, auth, logoStorage: airlineLogoStorage }));
router.use("/airports", createAirportsRouter({ airlabs }));

const metaCapi = createMetaCapiClient({
  pixelId: config.meta.pixelId,
  accessToken: config.meta.capiAccessToken,
  testEventCode: config.meta.testEventCode,
  logger,
});
if (!metaCapi.isConfigured()) {
  logger.warn("[meta-capi] Pixel ID or access token not configured — server-side purchase events disabled");
}

router.use(
  "/insurance",
  createInsuranceRouter({
    db,
    wis,
    brevo,
    auth,
    Affiliate: AffiliateModel,
    notifications: { insurancePaymentCompletionEmail, policyIssuedEmail },
    metaCapi,
    frontendUrl: config.frontendUrl,
  }),
);

const openaiCapi = createOpenAICapiClient({
  pixelId: config.openai.pixelId,
  apiKey: config.openai.capiApiKey,
  logger,
});
if (!openaiCapi.isConfigured()) {
  logger.warn("[openai-capi] Pixel ID or API key not configured — server-side order events disabled");
}

const notifications = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: "The Dummy Ticket AE",
    teamName: "The Dummy Ticket AE Team",
    adminEmail: config.adminEmail,
    website: "https://thedummyticket.ae",
    paymentsSenderName: "The Dummy Ticket AE Payments",
    deliverySenderName: "The Dummy Ticket AE Delivery",
    customerSenderName: "The Dummy Ticket AE",
    theme: {
      primaryColor: "#053d6c",
      accentColor: "#de3700",
      linkColor: "#053d6c",
    },
  },
});

notifications.sendTicketPaymentToAdmin = async () => {};

const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

const reservationStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "thedt/dummy-tickets",
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
  "/affiliates",
  createAffiliatesRouter({
    db,
    auth,
    TicketModel,
    notifications,
    trackingBaseUrl: config.frontendUrl,
  }),
);

const adsConfigured = Boolean(config.openai.adsApiKey);
let openaiAdsService = null;

if (adsConfigured) {
  const { router: openaiAdsRouter, service } = createOpenAIAdsRouter({
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
  openaiAdsService = service;
  router.use("/openai-ads", openaiAdsRouter);
} else {
  logger.warn("[openai-ads] OPENAI_ADS_API_KEY not configured — ChatGPT Ads management disabled");
}

const paymentService = createPaymentService({
  stripe,
  db,
  PaymentLinkSchema,
  ProductSchema,
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

if (config.anthropicApiKey) {
  const { router: assistantRouter } = createAssistantRouter({
    db,
    auth,
    anthropicApiKey: config.anthropicApiKey,
    stripe,
    ads: openaiAdsService,
    brand: { name: "The Dummy Ticket AE" },
    logger,
    datasets: [
      assistantDatasets.dummyTickets(TicketModel),
      assistantDatasets.insuranceApplications(db.models["insurance-application"]),
      assistantDatasets.affiliates(AffiliateModel),
      assistantDatasets.affiliatePayouts(db.models.AffiliatePayout),
      assistantDatasets.blogPosts(db.models.Blog),
    ],
  });
  router.use("/assistant", assistantRouter);
} else {
  logger.warn("[assistant] ANTHROPIC_API_KEY not configured — admin assistant disabled");
}

export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: {
    ticket: handleStripeSuccess,
    "payment-link": handlePaymentLinkSuccess,
  },
});

export default router;
