import { Router } from "express";
import { createAssistantRouter, assistantDatasets } from "@travel-suite/assistant";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createVisaRouter } from "@travel-suite/visa";
import { createVisaLeadRouter } from "@travel-suite/visa-leads";
import { createMetaCapiClient } from "@travel-suite/meta-capi";
import { createGoogleAdsConversionsClient } from "@travel-suite/google-ads-conversions";
import { createOpenAICapiClient } from "@travel-suite/openai-capi";
import { createOpenAIAdsClient } from "@travel-suite/openai-ads";
import { createOpenAIAdsRouter } from "@travel-suite/openai-ads-admin";
import { createOpenAIEventsRouter } from "./openaiEvents.js";
import { createVisaRequirementsRouter } from "@travel-suite/visa-requirements";
import { createUsersRouter } from "@travel-suite/users";
import { createVisaApplicationsRouter } from "@travel-suite/visa-applications";
import { createBrandStorage } from "@travel-suite/backend-app/storage";
import { createBrandNotifications } from "@travel-suite/backend-app/notifications";
import { createPaymentLinkSuccessHandler } from "@travel-suite/backend-app/payment-link";
import {
  createGoogleAdsConversions,
  createMetaCapi,
  createOpenAICapi,
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
import { logger } from "@travel-suite/utils";
import { db } from "../utils/db.js";
import { sendEmail } from "../utils/email.js";
import config from "../utils/config.js";

const router = Router();

const storage = createBrandStorage({ config });

const googleAds = createGoogleAdsConversions({
  create: createGoogleAdsConversionsClient,
  config: config.googleAds,
  logger,
});
const leadConversions = googleAds.forAction(config.googleAds.lead);


const { router: authRouter, middleware: auth, AdminUser } = createAuthRouter({
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

const visaImageStorage = storage("visa");
router.use("/visas", createVisaRouter({ db, auth, imageStorage: visaImageStorage }));

const notifications = createBrandNotifications({
  config,
  sendEmail,
  website: config.siteUrl,
  extras: { whatsappUrl: "https://wa.me/971569964924" },
  theme: { primaryColor: "#254b8e", accentColor: "#F26B4E", linkColor: "#2b5cb0" },
});

const metaCapi = createMetaCapi({
  create: createMetaCapiClient,
  config: config.meta,
  logger,
  eventKind: "lead",
});

const openaiCapi = createOpenAICapi({
  create: createOpenAICapiClient,
  pixelId: config.openai.pixelId,
  apiKey: config.openai.capiApiKey,
  logger,
  message: "[openai-capi] Pixel ID or API key not configured — server-side lead events disabled",
});

const openaiWhatsappCapi = createOpenAICapi({
  create: createOpenAICapiClient,
  pixelId: config.openai.pixelId,
  apiKey: config.openai.whatsappCapiApiKey,
  logger,
  message: "[openai-capi] WhatsApp conversion key not configured — click-to-chat events disabled",
});

router.use(
  "/visa-leads",
  createVisaLeadRouter({ db, auth, notifications, metaCapi, openaiCapi, googleAds: leadConversions, frontendUrl: config.frontendUrl }),
);

router.use(
  "/openai-events",
  createOpenAIEventsRouter({ capi: openaiWhatsappCapi, frontendUrl: config.frontendUrl, logger }),
);

const { router: openaiAdsRouter } = createOpenAIAdsRouter({
  adsClient: createOpenAIAdsClient({ apiKey: config.openai.adsApiKey, logger }),
  auth,
  maxDailyBudget: config.openai.adsMaxDailyBudget,
  logger,
  countOwnConversions: async ({ from, to }) => {
    const VisaLead = db.models["visa-lead"];
    if (!VisaLead) return { orders: 0, revenue: [] };
    const leads = await VisaLead.countDocuments({
      createdAt: { $gte: from, $lt: to },
      $or: [
        { "attribution.last.channel": "chatgpt_ads" },
        { "attribution.last.oppref": { $nin: [null, ""] } },
      ],
    });
    return { orders: leads, revenue: [] };
  },
});
router.use("/openai-ads", openaiAdsRouter);

const { router: visaRequirementsRouter } = createVisaRequirementsRouter({
  db,
  auth,
  servicedSlugs: [
    "schengen", "united-kingdom", "usa", "canada", "saudi-arabia",
    "greece-visa",
    "france-visa", "germany-visa", "italy-visa", "spain-visa",
  ],
  logger,
});
router.use("/visa-requirements", visaRequirementsRouter);

const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

const paymentService = createPaymentService({ stripe, db, PaymentLinkSchema, StripeProductSchema });
const paymentsController = createPaymentsController({ service: paymentService });
router.use("/payments", createPaymentsAdminRouter({ controller: paymentsController, auth }));

const handlePaymentLinkSuccess = createPaymentLinkSuccessHandler({
  paymentService,
  notifications,
  logger,
});

export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: {
    "payment-link": handlePaymentLinkSuccess,
  },
});

const { router: usersRouter, middleware: userAuth, User } = createUsersRouter({
  db,
  jwtSecret: config.userJwtSecret,
  jwtExpiresIn: config.userJwtExpiresIn,
  cookieExpiresInDays: config.userCookieExpiresInDays,
  nodeEnv: config.nodeEnv,
  notifications,
  appBaseUrl: config.frontendUrl,
  apiBaseUrl: config.backendUrl,
});

router.use("/users", usersRouter);

const visaApplicationStorage = storage("visa-applications");

const { router: visaApplicationsRouter, runReminderSweep } = createVisaApplicationsRouter({
  db,
  auth,          
  userAuth,      
  User,
  storage: visaApplicationStorage,
  notifications,
  apiUrl: config.backendUrl,
  frontendUrl: config.frontendUrl,
  logger,
});
router.use("/visa-applications", visaApplicationsRouter);

if (config.anthropicApiKey) {
  const { router: assistantRouter } = createAssistantRouter({
    db,
    auth,
    anthropicApiKey: config.anthropicApiKey,
    stripe,
    brand: { name: config.brand.name },
    logger,
    datasets: [
      assistantDatasets.visaLeads(db.models["visa-lead"]),
      assistantDatasets.visaApplications(db.models["visa-application"]),
      assistantDatasets.blogPosts(db.models.blog),
    ],
  });
  router.use("/assistant", assistantRouter);
} else {
  logger.warn("[assistant] ANTHROPIC_API_KEY not configured — admin assistant disabled");
}

export { runReminderSweep as runVisaReminderSweep };

export default router;
