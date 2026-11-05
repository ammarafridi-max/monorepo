import { Router } from "express";
import { createAssistantRouter, assistantDatasets } from "@travel-suite/assistant";
import { logger } from "@travel-suite/utils";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createBrandStorage } from "@travel-suite/backend-app/storage";
import {
  createGoogleAdsConversions,
  createMetaCapi,
} from "@travel-suite/backend-app/tracking";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import { createLocationsRouter } from "@travel-suite/locations";
import {
  createStripeClient,
  createStripeWebhookHandler,
  createPaymentService,
  createPaymentsController,
  createPaymentsAdminRouter,
  PaymentLinkSchema,
  StripeProductSchema,
} from "@travel-suite/payments";
import { createVehiclesRouter } from "@travel-suite/vehicles";
import { createZonesRouter } from "@travel-suite/zones";
import { createPricingRulesRouter } from "@travel-suite/pricing-rules";
import { createAvailabilityRulesRouter } from "@travel-suite/availability-rules";
import { createBookingsRouter, createBookingPaymentHandler } from "@travel-suite/limo-bookings";
import { createMetaCapiClient } from "@travel-suite/meta-capi";
import { createGoogleAdsConversionsClient } from "@travel-suite/google-ads-conversions";
import { db } from "../utils/db.js";
import { sendEmail } from "../utils/email.js";
import { createLimoNotifications, bookingNotifications } from "../notifications/booking.js";
import config from "../utils/config.js";

const router = Router();

const storage = createBrandStorage({ config });

const googleAds = createGoogleAdsConversions({
  create: createGoogleAdsConversionsClient,
  config: config.googleAds,
  logger,
});
const bookingConversions = googleAds.forAction(config.googleAds.booking);


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

const blogImageStorage = storage("blog");

const vehicleStorage = storage();
const vehicleImages = {
  uploadImage: (buffer, folder) => vehicleStorage.saveImage(buffer, folder),
  deleteImage: (url) => vehicleStorage.deleteImage(url),
  deleteFolder: (folder) =>
    vehicleStorage.deleteFolder(`${config.brand.cloudinaryFolder}/${folder}`),
};

router.use("/blogs", createBlogRouter({ db, auth, imageStorage: blogImageStorage, anthropicApiKey: config.anthropicApiKey }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

const currencyInUseReason = async (code) => {
  const paidBookings = await db
    .collection("bookings")
    .countDocuments({ "payment.status": "paid", "payment.currency": code });
  if (paidBookings > 0) {
    return `${code} cannot be removed: ${paidBookings} paid booking${paidBookings === 1 ? " was" : "s were"} charged in it and would drop out of revenue totals.`;
  }
  return null;
};

router.use(
  "/currencies",
  createCurrenciesRouter({ db, auth, isCurrencyInUse: currencyInUseReason }),
);

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

const paymentService = createPaymentService({ stripe, db, PaymentLinkSchema, StripeProductSchema });
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

const metaCapi = createMetaCapi({
  create: createMetaCapiClient,
  config: config.meta,
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
      assistantDatasets.limoBookings(db.models.booking),
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
    booking: createBookingPaymentHandler({
      db,
      notifications: bookingNotifications(notifications),
      metaCapi,
      googleAds: bookingConversions,
      frontendUrl: config.frontendUrl,
    }),
    "payment-link": handlePaymentLinkSuccess,
  },
});

export default router;
