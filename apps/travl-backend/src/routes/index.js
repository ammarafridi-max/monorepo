import { Router } from "express";
import { createAssistantRouter, assistantDatasets } from "@travel-suite/assistant";
import rateLimit from "express-rate-limit";
import { createAuthRouter } from "@travel-suite/auth";
import { createInsuranceRouter } from "@travel-suite/insurance";
import { createAdminUsersRouter, createAdminBadgesRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createItinerariesRouter } from "@travel-suite/itineraries";
import { createLocationsRouter } from "@travel-suite/locations";
import { createAirLabsClient } from "@travel-suite/airlabs";
import {
  createFlightRouter,
  createAirportsRouter,
  createAirlineSellabilityGate,
} from "@travel-suite/flights";
import { createSerpApiClient } from "@travel-suite/serpapi";
import { createTicketsRouter } from "@travel-suite/tickets";
import {
  createAffiliatesRouter,
  registerAffiliateModels,
} from "@travel-suite/affiliates";
import { createBrandStorage } from "@travel-suite/backend-app/storage";
import { createBrandNotifications } from "@travel-suite/backend-app/notifications";
import { createPaymentLinkSuccessHandler } from "@travel-suite/backend-app/payment-link";
import {
  createGoogleAdsConversions,
  createMetaCapi,
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
import { wis } from "../utils/wis.js";
import { createBrevoClient } from "@travel-suite/brevo";
import { createMetaCapiClient } from "@travel-suite/meta-capi";
import { createGoogleAdsConversionsClient } from "@travel-suite/google-ads-conversions";
import { sendEmail } from "../utils/email.js";
import { insurancePaymentCompletionEmail, policyIssuedEmail, insurancePaymentReminderEmail } from "../notifications/insurance.js";
import { itineraryPaymentCustomerEmail } from "../notifications/itinerary.js";
import config from "../utils/config.js";

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

const metaCapi = createMetaCapi({
  create: createMetaCapiClient,
  config: config.meta,
  logger,
});

router.use(
  "/insurance",
  createInsuranceRouter({
    db,
    wis,
    brevo,
    auth,
    notifications: { insurancePaymentCompletionEmail, policyIssuedEmail, insurancePaymentReminderEmail },
    metaCapi,
    googleAds: insuranceConversions,
    frontendUrl: config.frontendUrl,
  }),
);

const imageStorage = storage("blog");
router.use("/blogs", createBlogRouter({ db, auth, imageStorage, anthropicApiKey: config.anthropicApiKey }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));


const airlabs = createAirLabsClient({ apiKey: config.airlabs.apiKey });
const citiesOnlyLocations = Router();
citiesOnlyLocations.get("/cities", createLocationsRouter({ airlabs }));
router.use("/locations", citiesOnlyLocations);
router.use("/airports", createAirportsRouter({ airlabs }));
const serpapi = createSerpApiClient({ apiKey: config.serpapi.apiKey });
const airlineLogoStorage = storage("airlines");
router.use("/flights", createFlightRouter({ db, airlabs, serpapi, auth, logoStorage: airlineLogoStorage }));


const notifications = createBrandNotifications({
  config,
  sendEmail,
  extras: { productNoun: "flight reservation" },
  theme: { primaryColor: "#1a1a2e", accentColor: "#e94560", linkColor: "#0f3460" },
});


const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

const itineraryGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many itinerary generations from this network. Please try again later." },
});

const itineraryStorage = storage("travel-itineraries");

const { router: itinerariesRouter, handleStripeSuccess: handleItinerarySuccess } = createItinerariesRouter({
  db,
  stripe,
  anthropicApiKey: config.anthropicApiKey,
  frontendUrl: config.frontendUrl,
  frontendPathBase: "/itinerary-booking",
  brand: {
    name: "Travl",
    companyName: "TRAVL Technologies",
    domain: "travl.ae",
    primaryColor: "#0d6a66",
    accentColor: "#ff603a",
  },
  storage: itineraryStorage,
  sendItineraryEmail: itineraryPaymentCustomerEmail,
  auth,
  generateLimiter: itineraryGenerateLimiter,
});
router.use("/itineraries", itinerariesRouter);

const reservationStorage = storage("flight-reservations");

const {
  router: ticketsRouter,
  pricingRouter,
  handleStripeSuccess: handleTicketSuccess,
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

const paymentService = createPaymentService({ stripe, db, PaymentLinkSchema, StripeProductSchema });
const paymentsController = createPaymentsController({ service: paymentService });
router.use("/payments", createPaymentsAdminRouter({ controller: paymentsController, auth }));

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
    brand: { name: config.brand.name },
    logger,
    datasets: [
      assistantDatasets.insuranceApplications(db.models["insurance-application"]),
      assistantDatasets.dummyTickets(TicketModel, { detailPath: '/admin/flight-reservations/{sessionId}' }),
      assistantDatasets.itineraryOrders(db.models["itinerary-order"]),
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
    ticket: handleTicketSuccess,
    itinerary: handleItinerarySuccess,
    "payment-link": handlePaymentLinkSuccess,
  },
});


export default router;
