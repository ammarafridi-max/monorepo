import { Router } from "express";
import { createAuthRouter } from "@travel-suite/auth";
import { createInsuranceRouter } from "@travel-suite/insurance";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import { createFlightRouter, createAirportsRouter, createAmadeusClient } from "@travel-suite/flights";
import { createAffiliatesRouter, AffiliateSchema } from "@travel-suite/affiliates";
import { createTicketsRouter } from "@travel-suite/tickets";
import { createUsersRouter } from "@travel-suite/users";
import { createNotificationsService } from "@travel-suite/notifications";
import {
  createStripeClient,
  createStripeWebhookHandler,
  createPaymentService,
  createPaymentsController,
  createPaymentsAdminRouter,
  PaymentLinkSchema,
} from "@travel-suite/payments";
import { createCloudinaryStorage } from "@travel-suite/cloudinary";
import { logger } from "@travel-suite/utils";
import { db } from "../utils/db.js";
import { wis } from "../utils/wis.js";
import * as brevo from "../utils/brevo.js";
import { sendEmail } from "../utils/email.js";
import { insurancePaymentCompletionEmail } from "../notifications/insurance.js";
import config from "../utils/config.js";

// -- Model pre-registration (ORDER CRITICAL) -----------------------------------
// Must happen before ANY package factory is called. Insurance, Tickets, and
// Affiliates all share the Affiliate model — whoever registers first wins.
// Pre-register the full schema here so all three get the version with statics.
function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}
const AffiliateModel = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);

const router = Router();

// -- Auth ---------------------------------------------------------------------
const { router: authRouter, middleware: auth, AdminUser } = createAuthRouter({
  db,
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
  cookieExpiresInDays: config.jwtCookieExpiresInDays,
  nodeEnv: config.nodeEnv,
});

router.use("/auth", authRouter);

// -- Admin Users ---------------------------------------------------------------
router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

// -- Insurance -----------------------------------------------------------------
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

// -- Blog ----------------------------------------------------------------------
const imageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "travl/blog",
});
router.use("/blogs", createBlogRouter({ db, auth, imageStorage }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));
router.use("/currencies", createCurrenciesRouter({ db, auth }));

// -- Flights -------------------------------------------------------------------
const amadeus = createAmadeusClient({
  apiKey: config.amadeus.apiKey,
  apiSecret: config.amadeus.apiSecret,
});

router.use("/flights", createFlightRouter({ db, amadeus, auth }));
router.use("/airports", createAirportsRouter({ amadeus }));

// -- Notifications -------------------------------------------------------------
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

// -- Stripe --------------------------------------------------------------------
const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

// -- Tickets -------------------------------------------------------------------
// AffiliateModel already pre-registered above. Tickets receives it and returns
// its own TicketModel (full schema with handledBy for populate).
const { router: ticketsRouter, pricingRouter, handleStripeSuccess, TicketModel } = createTicketsRouter({
  db, auth, stripe, notifications, frontendUrl: config.frontendUrl, AffiliateModel,
});
router.use("/tickets", ticketsRouter);
router.use("/pricing", pricingRouter);

// -- Affiliates ----------------------------------------------------------------
// Receives the full TicketModel so affiliate stats/tickets queries hit dummytickets.
router.use("/affiliates", createAffiliatesRouter({ db, auth, TicketModel }));

// -- Payments (admin: revenue dashboard + custom payment links) ---------------
const paymentService = createPaymentService({ stripe, db, PaymentLinkSchema });
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

// -- Stripe webhook handler (exported for mounting in app.js before JSON middleware) --
export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: {
    ticket: handleStripeSuccess,
    "payment-link": handlePaymentLinkSuccess,
  },
});

// -- Users (public-facing accounts) -------------------------------------------
const { router: usersRouter } = createUsersRouter({
  db,
  jwtSecret: config.userJwtSecret,
  jwtExpiresIn: config.userJwtExpiresIn,
  cookieExpiresInDays: config.userCookieExpiresInDays,
  nodeEnv: config.nodeEnv,
  notifications,
});

router.use("/users", usersRouter);

export default router;
