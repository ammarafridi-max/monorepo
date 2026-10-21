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
import { createFlightRouter, createAirportsRouter } from "@travel-suite/flights";
import { createSerpApiClient } from "@travel-suite/serpapi";
import { createTicketsRouter } from "@travel-suite/tickets";
import { createAffiliatesRouter, AffiliateSchema } from "@travel-suite/affiliates";
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
import { createCloudinaryStorage } from "@travel-suite/cloudinary";
import { logger } from "@travel-suite/utils";
import { db } from "../utils/db.js";
import { wis } from "../utils/wis.js";
import { createBrevoClient } from "@travel-suite/brevo";
import { createMetaCapiClient } from "@travel-suite/meta-capi";
import { sendEmail } from "../utils/email.js";
import { insurancePaymentCompletionEmail, policyIssuedEmail } from "../notifications/insurance.js";
import { itineraryPaymentCustomerEmail } from "../notifications/itinerary.js";
import config from "../utils/config.js";

// -- Model pre-registration (ORDER CRITICAL) ----------------------------------
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


const { router: authRouter, middleware: auth, AdminUser } = createAuthRouter({
  db,
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
  cookieExpiresInDays: config.jwtCookieExpiresInDays,
  nodeEnv: config.nodeEnv,
  // Without sendEmail the OTP service reports itself disabled and every
  // /auth/otp/* call answers 503, which is what these routes did until now.
  sendEmail,
  brandName: "Travl",
  loginUrl: `${config.frontendUrl}/admin/login`,
  logger,
});

router.use("/auth", authRouter);

router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

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
    notifications: { insurancePaymentCompletionEmail, policyIssuedEmail },
    metaCapi,
    frontendUrl: config.frontendUrl,
  }),
);

const imageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "travl/blog",
});
router.use("/blogs", createBlogRouter({ db, auth, imageStorage, anthropicApiKey: config.anthropicApiKey }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));


const airlabs = createAirLabsClient({ apiKey: config.airlabs.apiKey });
const citiesOnlyLocations = Router();
citiesOnlyLocations.get("/cities", createLocationsRouter({ airlabs }));
router.use("/locations", citiesOnlyLocations);
router.use("/airports", createAirportsRouter({ airlabs }));
const serpapi = createSerpApiClient({ apiKey: config.serpapi.apiKey });
const airlineLogoStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "travl/airlines",
});
router.use("/flights", createFlightRouter({ db, airlabs, serpapi, auth, logoStorage: airlineLogoStorage }));


const notifications = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: "Travl",
    teamName: "Travl Team",
    adminEmail: config.adminEmail,
    website: "https://travl.ae",
    paymentsSenderName: "Travl Payments",
    deliverySenderName: "Travl Delivery",
    customerSenderName: "Travl",
    productNoun: "flight reservation",
    theme: { primaryColor: "#1a1a2e", accentColor: "#e94560", linkColor: "#0f3460" },
  },
});


const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

const itineraryGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many itinerary generations from this network. Please try again later." },
});

const itineraryStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "travl/travel-itineraries",
});

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

const reservationStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "travl/flight-reservations",
});

const {
  router: ticketsRouter,
  pricingRouter,
  handleStripeSuccess: handleTicketSuccess,
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

const paymentService = createPaymentService({ stripe, db, PaymentLinkSchema, ProductSchema });
const paymentsController = createPaymentsController({ service: paymentService });
router.use("/payments", createPaymentsAdminRouter({ controller: paymentsController, auth }));

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
    brand: { name: "Travl" },
    logger,
    datasets: [
      assistantDatasets.insuranceApplications(db.models["insurance-application"]),
      assistantDatasets.dummyTickets(TicketModel, { detailPath: '/admin/flight-reservations/{sessionId}' }),
      assistantDatasets.itineraryOrders(db.models["itinerary-order"]),
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
    ticket: handleTicketSuccess,
    itinerary: handleItinerarySuccess,
    "payment-link": handlePaymentLinkSuccess,
  },
});


export default router;
