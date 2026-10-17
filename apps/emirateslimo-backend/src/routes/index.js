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
import { createMetaCapiClient } from "@travel-suite/meta-capi";
import { db } from "../utils/db.js";
import { sendEmail } from "../utils/email.js";
import { createLimoNotifications, bookingNotifications } from "../notifications/booking.js";
import config from "../utils/config.js";

const router = Router();

const { router: authRouter, middleware: auth, AdminUser } = createAuthRouter({
  db,
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
  cookieExpiresInDays: config.jwtCookieExpiresInDays,
  nodeEnv: config.nodeEnv,
  // Without sendEmail the OTP service reports itself disabled and every
  // /auth/otp/* call answers 503, which is what these routes did until now.
  sendEmail,
  brandName: "Emirates Limo",
  loginUrl: `${config.frontendUrl}/admin/login`,
  logger,
});
router.use("/auth", authRouter);

router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

const blogImageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "emirateslimo/blog",
});

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

router.use("/blogs", createBlogRouter({ db, auth, imageStorage: blogImageStorage, anthropicApiKey: config.anthropicApiKey }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

router.use("/currencies", createCurrenciesRouter({ db, auth }));

router.use(
  "/locations",
  createLocationsRouter({
    googleMapsApiKey: config.googleMaps.apiKey,
    ipInfoApiKey: config.ipInfo.apiKey,
  }),
);

router.use("/vehicles", createVehiclesRouter({ db, auth, images: vehicleImages }));
router.use("/zones", createZonesRouter({ db, auth }));
router.use("/pricing-rules", createPricingRulesRouter({ db, auth }));
router.use("/availability-rules", createAvailabilityRulesRouter({ db, auth }));

const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

router.use(
  "/bookings",
  createBookingsRouter({ db, auth, stripe, frontendUrl: config.frontendUrl }),
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
  }
}

const notifications = createLimoNotifications({ sendEmail });

const metaCapi = createMetaCapiClient({
  pixelId: config.meta.pixelId,
  accessToken: config.meta.capiAccessToken,
  testEventCode: config.meta.testEventCode,
  logger,
});
if (!metaCapi.isConfigured()) {
  logger.warn("[meta-capi] Pixel ID or access token not configured — server-side purchase events disabled");
}

export const stripeWebhookHandler = createStripeWebhookHandler({
  stripe,
  webhookSecret: config.stripe.webhookSecret,
  db,
  handlers: {
    booking: createBookingPaymentHandler({
      db,
      notifications: bookingNotifications(notifications),
      metaCapi,
      frontendUrl: config.frontendUrl,
    }),
    "payment-link": handlePaymentLinkSuccess,
  },
});

export default router;
