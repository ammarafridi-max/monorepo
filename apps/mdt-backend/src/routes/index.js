import { Router } from "express";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createAffiliatesRouter, AffiliateSchema } from "@travel-suite/affiliates";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createCloudinaryStorage } from "@travel-suite/cloudinary";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import { createFlightRouter, createAirportsRouter, createAmadeusClient } from "@travel-suite/flights";
import { createInsuranceRouter } from "@travel-suite/insurance";
import { createTicketsRouter } from "@travel-suite/tickets";
import { createUsersRouter } from "@travel-suite/users";
import { createNotificationsService } from "@travel-suite/notifications";
import {
  createStripeClient,
  createStripeWebhookHandler,
} from "@travel-suite/payments";
import { db } from "../utils/db.js";
import { wis } from "../utils/wis.js";
import * as brevo from "../utils/brevo.js";
import { sendEmail } from "../utils/email.js";
import { insurancePaymentCompletionEmail } from "../notifications/insurance.js";
import config from "../utils/config.js";
import { logger } from "@travel-suite/utils";

// -- Model pre-registration (ORDER CRITICAL) -----------------------------------
function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}
const AffiliateModel = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);

const router = Router();

// -- Auth ----------------------------------------------------------------------
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
});

router.use("/auth", authRouter);

// -- Admin Users ---------------------------------------------------------------
router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

// -- Blog ----------------------------------------------------------------------
const imageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey:    config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "mdt/blog",
});
router.use("/blogs", createBlogRouter({ db, auth, imageStorage }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

// -- Currencies ----------------------------------------------------------------
router.use("/currencies", createCurrenciesRouter({ db, auth }));

// -- Flights -------------------------------------------------------------------
const amadeus = createAmadeusClient({
  apiKey:    config.amadeus.apiKey,
  apiSecret: config.amadeus.apiSecret,
});
router.use("/flights", createFlightRouter({ db, amadeus, auth }));
router.use("/airports", createAirportsRouter({ amadeus }));

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

// -- Notifications -------------------------------------------------------------
const notifications = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: "My Dummy Ticket",
    teamName: "My Dummy Ticket Team",
    adminEmail: config.adminEmail,
    website: "https://mydummyticket.ae",
    paymentsSenderName: "My Dummy Ticket Payments",
    deliverySenderName: "My Dummy Ticket Delivery",
    customerSenderName: "My Dummy Ticket",
    theme: {
      primaryColor: "#14948f",
      accentColor: "#ff603a",
      linkColor: "#14948f",
    },
  },
});

// -- Stripe --------------------------------------------------------------------
const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

// -- Tickets -------------------------------------------------------------------
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
});
router.use("/tickets", ticketsRouter);
router.use("/pricing", pricingRouter);

// -- Affiliates ----------------------------------------------------------------
router.use("/affiliates", createAffiliatesRouter({ db, auth, TicketModel }));

// -- Stripe webhook handler (exported for mounting in app.js before JSON middleware) --
export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: { ticket: handleStripeSuccess },
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
