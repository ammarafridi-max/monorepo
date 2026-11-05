import { Router } from "express";
import { createAssistantRouter, assistantDatasets } from "@travel-suite/assistant";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter, createAdminBadgesRouter } from "@travel-suite/admin-users";
import {
  createAffiliatesRouter,
  registerAffiliateModels,
} from "@travel-suite/affiliates";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import {
  createFlightRouter,
  createAirportsRouter,
  createAirlineSellabilityGate,
} from "@travel-suite/flights";
import { createAirLabsClient } from "@travel-suite/airlabs";
import { createSerpApiClient } from "@travel-suite/serpapi";
import { createInsuranceRouter } from "@travel-suite/insurance";
import { createTicketsRouter } from "@travel-suite/tickets";
import { createBrandStorage } from "@travel-suite/backend-app/storage";
import { createBrandNotifications } from "@travel-suite/backend-app/notifications";
import { createPaymentLinkSuccessHandler } from "@travel-suite/backend-app/payment-link";
import {
  createGoogleAdsConversions,
  createMetaCapi,
  createOpenAICapi,
  createTicketConversionCounter,
} from "@travel-suite/backend-app/tracking";
import {
  createStripeClient,
  createStripeWebhookHandler,
  createPaymentService,
  createPaymentsController,
  createPaymentsAdminRouter,
  PaymentLinkSchema,
  StripeProductSchema,
} from "@travel-suite/payments";
import { db } from "../utils/db.js";
import { wis } from "../utils/wis.js";
import { createBrevoClient } from "@travel-suite/brevo";
import { createMetaCapiClient } from "@travel-suite/meta-capi";
import { createGoogleAdsConversionsClient } from "@travel-suite/google-ads-conversions";
import { createOpenAICapiClient } from "@travel-suite/openai-capi";
import { createOpenAIAdsClient } from "@travel-suite/openai-ads";
import { createOpenAIAdsRouter } from "@travel-suite/openai-ads-admin";
import { sendEmail } from "../utils/email.js";
import { insurancePaymentCompletionEmail, policyIssuedEmail } from "../notifications/insurance.js";
import config from "../utils/config.js";
import { logger } from "@travel-suite/utils";

const { Affiliate: AffiliateModel } = registerAffiliateModels({ db });

const router = Router();

const storage = createBrandStorage({ config });

const googleAds = createGoogleAdsConversions({
  create: createGoogleAdsConversionsClient,
  config: config.googleAds,
  logger,
});
const insuranceConversions = googleAds.forAction(config.googleAds.insurance);
const ticketsConversions = googleAds.forAction(config.googleAds.tickets);

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
  brandName: config.brand.name,
  loginUrl: `${config.frontendUrl}/admin/login`,
  logger,
});

router.use("/auth", authRouter);

router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

const imageStorage = storage("blog");
router.use("/blogs", createBlogRouter({ db, auth, imageStorage, anthropicApiKey: config.anthropicApiKey }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));


const airlabs = createAirLabsClient({ apiKey: config.airlabs.apiKey });
const serpapi = createSerpApiClient({ apiKey: config.serpapi.apiKey });
const airlineLogoStorage = storage("airlines");
router.use("/flights", createFlightRouter({ db, airlabs, serpapi, auth, logoStorage: airlineLogoStorage }));
router.use("/airports", createAirportsRouter({ airlabs }));

router.use(
  "/insurance",
  createInsuranceRouter({
    db,
    wis,
    brevo,
    auth,
    Affiliate: AffiliateModel,
    notifications: { insurancePaymentCompletionEmail, policyIssuedEmail },
    googleAds: insuranceConversions,
  }),
);

const notifications = createBrandNotifications({ config, sendEmail });

notifications.sendTicketPaymentToAdmin = async () => {};

const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

const metaCapi = createMetaCapi({
  create: createMetaCapiClient,
  config: config.meta,
  logger,
});

const openaiCapi = createOpenAICapi({
  create: createOpenAICapiClient,
  pixelId: config.openai.pixelId,
  apiKey: config.openai.capiApiKey,
  logger,
});

const reservationStorage = storage("dummy-tickets");
const {
  router: ticketsRouter,
  pricingRouter,
  handleStripeSuccess,
  TicketModel,
} = createTicketsRouter({
  db,
  airlineRules: createAirlineSellabilityGate({ db }),
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
  googleAds: ticketsConversions,
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
    },
  }),
);

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
    countOwnConversions: createTicketConversionCounter(TicketModel),
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
  StripeProductSchema,
});
const paymentsController = createPaymentsController({
  service: paymentService,
});
router.use(
  "/payments",
  createPaymentsAdminRouter({ controller: paymentsController, auth }),
);

const handlePaymentLinkSuccess = createPaymentLinkSuccessHandler({
  paymentService,
  notifications,
  logger,
});

if (config.anthropicApiKey) {
  const { router: assistantRouter } = createAssistantRouter({
    db,
    auth,
    anthropicApiKey: config.anthropicApiKey,
    stripe,
    ads: openaiAdsService,
    brand: { name: config.brand.name },
    logger,
    datasets: [
      assistantDatasets.dummyTickets(TicketModel),
      assistantDatasets.insuranceApplications(db.models["insurance-application"]),
      assistantDatasets.affiliates(AffiliateModel),
      assistantDatasets.affiliatePayouts(db.models['affiliate-payout']),
      assistantDatasets.blogPosts(db.models.blog),
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
