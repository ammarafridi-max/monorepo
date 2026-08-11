import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createAuthRouter } from "@travel-suite/auth";
import { createInsuranceRouter } from "@travel-suite/insurance";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import { createItinerariesRouter } from "@travel-suite/itineraries";
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
import * as brevo from "../utils/brevo.js";
import { sendEmail } from "../utils/email.js";
import { insurancePaymentCompletionEmail } from "../notifications/insurance.js";
import { itineraryPaymentCustomerEmail } from "../notifications/itinerary.js";
import config from "../utils/config.js";

const router = Router();

const { router: authRouter, middleware: auth, AdminUser } = createAuthRouter({
  db,
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
  cookieExpiresInDays: config.jwtCookieExpiresInDays,
  nodeEnv: config.nodeEnv,
});

router.use("/auth", authRouter);

router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

router.use(
  "/insurance",
  createInsuranceRouter({
    db,
    wis,
    brevo,
    auth,
    notifications: { insurancePaymentCompletionEmail },
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

router.use("/currencies", createCurrenciesRouter({ db, auth }));


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
    theme: { primaryColor: "#1a1a2e", accentColor: "#e94560", linkColor: "#0f3460" },
  },
});


const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

// -- Travel itinerary generator ------------------------------------------------
// AI writes content only -> code validates -> watermarked preview -> pay to unlock.
// Per-IP limiter on generation routes (each generation is a paid AI call);
// per-session regeneration caps live inside the domain service.
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

// Email support is temporarily unmounted for Travl. The feature package is
// untouched; re-enable by restoring the createEmailSupportFeature block.

export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: {
    itinerary: handleItinerarySuccess,
    "payment-link": handlePaymentLinkSuccess,
  },
});


export default router;
