import { Router } from "express";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createVisaRouter } from "@travel-suite/visa";
import { createVisaLeadRouter } from "@travel-suite/visa-leads";
import { createVisaRequirementsRouter } from "@travel-suite/visa-requirements";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import { createUsersRouter } from "@travel-suite/users";
import { createVisaApplicationsRouter } from "@travel-suite/visa-applications";
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
import { sendEmail } from "../utils/email.js";
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

const imageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "visawadi/blog",
});
router.use("/blogs", createBlogRouter({ db, auth, imageStorage, anthropicApiKey: config.anthropicApiKey }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

const visaImageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "visawadi/visa",
});
router.use("/visas", createVisaRouter({ db, auth, imageStorage: visaImageStorage }));
router.use("/currencies", createCurrenciesRouter({ db, auth }));

const notifications = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: "VisaWadi",
    teamName: "VisaWadi Team",
    adminEmail: config.adminEmail,
    website: config.siteUrl,
    paymentsSenderName: "VisaWadi Payments",
    deliverySenderName: "VisaWadi Delivery",
    customerSenderName: "VisaWadi",
    // Cobalt & Stone, matching the site. An email that looks nothing like the
    // page the customer just came from reads as a phishing attempt.
    theme: { primaryColor: "#254b8e", accentColor: "#F26B4E", linkColor: "#2b5cb0" },
  },
});

router.use("/visa-leads", createVisaLeadRouter({ db, auth, notificationsService: notifications }));

// Visa requirement checker. Runs on our own curated rules. The service takes an
// ordered provider list, so a third-party source can be added later without
// touching the tool. servicedSlugs decides which answers push the consultation
// CTA rather than just informing.
const { router: visaRequirementsRouter } = createVisaRequirementsRouter({
  db,
  auth,
  servicedSlugs: [
    "schengen", "united-kingdom", "usa", "canada",
    "france-visa", "germany-visa", "italy-visa", "spain-visa",
  ],
  logger,
});
router.use("/visa-requirements", visaRequirementsRouter);

const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

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

// -- Schengen visa application system -----------------------------------------
// Private customer documents (passport/bank statements) go to a SEPARATE
// authenticated Cloudinary space; reads are always via signed short-lived URLs.
const visaApplicationStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "visawadi/visa-applications",
});

const { router: visaApplicationsRouter, runReminderSweep } = createVisaApplicationsRouter({
  db,
  auth,          // admin protect/restrictTo
  userAuth,      // customer (userJwt) protect
  User,
  storage: visaApplicationStorage,
  notifications,
  apiBaseUrl: config.backendUrl,
  appBaseUrl: config.frontendUrl,
  logger,
});
router.use("/visa-applications", visaApplicationsRouter);

// Exposed so server.js can schedule the daily reminder sweep (node-cron).
export { runReminderSweep as runVisaReminderSweep };

export default router;
