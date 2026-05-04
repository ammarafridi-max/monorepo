import { Router } from "express";
import { createAuthRouter } from "@travel-suite/auth";
import { createEmailSupportFeature } from "@travel-suite/email-support";
import { createInsuranceRouter } from "@travel-suite/insurance";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createVisaRouter } from "@travel-suite/visa";
import { createVisaLeadRouter } from "@travel-suite/visa-leads";
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
  ProductSchema,
} from "@travel-suite/payments";
import { createCloudinaryStorage } from "@travel-suite/cloudinary";
import { logger } from "@travel-suite/utils";
import { db } from "../utils/db.js";
import { wis } from "../utils/wis.js";
import * as brevo from "../utils/brevo.js";
import { sendEmail } from "../utils/email.js";
import { insurancePaymentCompletionEmail } from "../notifications/insurance.js";
import config from "../utils/config.js";

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}
const AffiliateModel = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);

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
router.use("/blogs", createBlogRouter({ db, auth, imageStorage }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

const visaImageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "travl/visa",
});
router.use("/visas", createVisaRouter({ db, auth, imageStorage: visaImageStorage }));
router.use("/currencies", createCurrenciesRouter({ db, auth }));

const amadeus = createAmadeusClient({
  apiKey: config.amadeus.apiKey,
  apiSecret: config.amadeus.apiSecret,
});

router.use("/flights", createFlightRouter({ db, amadeus, auth }));
router.use("/airports", createAirportsRouter({ amadeus }));

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

router.use("/visa-leads", createVisaLeadRouter({ db, auth, notificationsService: notifications }));

const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

const { router: ticketsRouter, pricingRouter, handleStripeSuccess, TicketModel } = createTicketsRouter({
  db, auth, stripe, notifications, frontendUrl: config.frontendUrl, AffiliateModel,
});
router.use("/tickets", ticketsRouter);
router.use("/pricing", pricingRouter);

router.use("/affiliates", createAffiliatesRouter({ db, auth, TicketModel }));

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

const brandContext = `Travl.ae is a UAE-based travel services platform offering flight reservation documents (dummy tickets) for visa applications, hotel reservations, and travel insurance. Flight reservations are valid for Schengen, US, UK, and other visa applications. They are verifiable on GDS systems. Customers sometimes worry when airline websites don't show the booking as confirmed — reassure them this is normal for reservation documents.`;

const { router: emailSupportRouter, pollAndProcess } = createEmailSupportFeature({
  db,
  auth,
  anthropicApiKey: config.anthropicApiKey,
  brandContext,
  gmailConfig: config.gmail,
  logger,
});
router.use('/email-support', emailSupportRouter);
export { pollAndProcess };

export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: {
    ticket: handleStripeSuccess,
    "payment-link": handlePaymentLinkSuccess,
  },
});

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
