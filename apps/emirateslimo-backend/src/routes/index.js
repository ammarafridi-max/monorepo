import { Router } from "express";
import { logger } from "@travel-suite/utils";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createCloudinaryStorage } from "@travel-suite/cloudinary";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import { createLocationsRouter } from "@travel-suite/locations";
import {
  createStripeClient,
  createStripeWebhookHandler,
  createPaymentService,
  createPaymentsController,
  createPaymentsAdminRouter,
  PaymentLinkSchema,
  ProductSchema,
} from "@travel-suite/payments";
import { createVehiclesRouter } from "@travel-suite/vehicles";
import { createZonesRouter } from "@travel-suite/zones";
import { createPricingRulesRouter } from "@travel-suite/pricing-rules";
import { createAvailabilityRulesRouter } from "@travel-suite/availability-rules";
import { createBookingsRouter, createBookingPaymentHandler } from "@travel-suite/limo-bookings";
import { db } from "../utils/db.js";
import { sendEmail } from "../utils/email.js";
import { createBookingNotifications } from "../notifications/booking.js";
import config from "../utils/config.js";

const router = Router();

// -- Auth (registers the shared admin-user model; returns protect/restrictTo) ---
const { router: authRouter, middleware: auth, AdminUser } = createAuthRouter({
  db,
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
  cookieExpiresInDays: config.jwtCookieExpiresInDays,
  nodeEnv: config.nodeEnv,
});
router.use("/auth", authRouter);

// -- Admin users (mounted at /admin-users to match the shared admin frontend) ---
router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

// -- Cloudinary (shared image store) -------------------------------------------
const blogImageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "emirateslimo/blog",
});

// Vehicle images need full-folder upload + folder cleanup, so adapt the shared
// store to the { uploadImage, deleteImage, deleteFolder } contract the vehicles
// package expects. Base folder "emirateslimo" namespaces all assets.
const vehicleStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "emirateslimo",
});
const vehicleImages = {
  uploadImage: (buffer, folder) => vehicleStorage.saveImage(buffer, folder),
  deleteImage: (url) => vehicleStorage.deleteImage(url),
  deleteFolder: (folder) => vehicleStorage.deleteFolder(`emirateslimo/${folder}`),
};

// -- Blog ----------------------------------------------------------------------
router.use("/blogs", createBlogRouter({ db, auth, imageStorage: blogImageStorage }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

// -- Currencies ----------------------------------------------------------------
router.use("/currencies", createCurrenciesRouter({ db, auth }));

// -- Locations (Google Maps autocomplete, coordinates, distance, IP geo) -------
router.use(
  "/locations",
  createLocationsRouter({
    googleMapsApiKey: config.googleMaps.apiKey,
    ipInfoApiKey: config.ipInfo.apiKey,
  }),
);

// -- Fleet: vehicles, zones, pricing & availability rules ----------------------
router.use("/vehicles", createVehiclesRouter({ db, auth, images: vehicleImages }));
router.use("/zones", createZonesRouter({ db, auth }));
router.use("/pricing-rules", createPricingRulesRouter({ db, auth }));
router.use("/availability-rules", createAvailabilityRulesRouter({ db, auth }));

// -- Stripe --------------------------------------------------------------------
const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

// -- Bookings (limo) -----------------------------------------------------------
router.use(
  "/bookings",
  createBookingsRouter({ db, auth, stripe, frontendUrl: config.frontendUrl }),
);

// -- Payments (admin: revenue dashboard + custom payment links) ----------------
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
  }
}

// -- Notifications -------------------------------------------------------------
const bookingNotifications = createBookingNotifications({ sendEmail, config });

// -- Stripe webhook handler (mounted in app.js before JSON middleware) ----------
export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: {
    booking: createBookingPaymentHandler({ db, notifications: bookingNotifications }),
    "payment-link": handlePaymentLinkSuccess,
  },
});

export default router;
