import { Router } from "express";
import { createAssistantRouter, assistantDatasets } from "@travel-suite/assistant";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import { createAirportsRouter } from "@travel-suite/flights";
import { createAirLabsClient } from "@travel-suite/airlabs";
import { createTransferBookingsRouter } from "@travel-suite/transfer-bookings";
import { createLocationsRouter } from "@travel-suite/locations";
import { createBrandStorage } from "@travel-suite/backend-app/storage";
import { createBrandNotifications } from "@travel-suite/backend-app/notifications";
import { createPaymentLinkSuccessHandler } from "@travel-suite/backend-app/payment-link";
import {
  createStripeClient,
  createStripeWebhookHandler,
  createPaymentService,
  createPaymentsController,
  createPaymentsAdminRouter,
  PaymentLinkSchema,
  StripeProductSchema,
} from "@travel-suite/payments";
import { db } from "../utils/db.js";
import { sendEmail } from "../utils/email.js";
import { logger } from "@travel-suite/utils";
import config from "../utils/config.js";

const router = Router();


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
  sendEmail,
  brandName: config.brand.name,
  loginUrl: `${config.frontendUrl}/admin/login`,
  logger,
});

router.use("/auth", authRouter);

router.use("/admin-users", createAdminUsersRouter({ AdminUser, auth }));

const imageStorage = createBrandStorage({ config })("blog");
router.use("/blogs", createBlogRouter({ db, auth, imageStorage }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

const PAID_TRANSFER_STATUSES = ["paid", "confirmed", "completed"];

const currencyInUseReason = async (code) => {
  const paidBookings = await db
    .collection("transfer-bookings")
    .countDocuments({ status: { $in: PAID_TRANSFER_STATUSES }, "vehicle.price.currency": code });
  if (paidBookings > 0) {
    return `${code} cannot be removed: ${paidBookings} paid booking${paidBookings === 1 ? " was" : "s were"} charged in it and would drop out of revenue totals.`;
  }
  return null;
};

router.use(
  "/currencies",
  createCurrenciesRouter({ db, auth, isCurrencyInUse: currencyInUseReason }),
);

const airlabs = createAirLabsClient({ apiKey: config.airlabs.apiKey });
router.use("/airports", createAirportsRouter({ airlabs }));

router.use(
  "/locations",
  createLocationsRouter({
    googleMapsApiKey: config.googleMaps.apiKey,
    ipInfoApiKey: config.ipInfo.apiKey,
  }),
);

const notifications = createBrandNotifications({
  config,
  sendEmail,
  website: `https://www.${config.brand.domain}`,
});

const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

const {
  router: bookingsRouter,
  service: bookingService,
  controller: bookingController,
} = createTransferBookingsRouter({ db, stripe, auth });
router.use("/bookings", bookingsRouter);

router.get(
  "/bookings",
  auth.protect,
  auth.restrictTo("admin", "agent"),
  bookingController.list,
);
router.patch(
  "/bookings/:id/status",
  auth.protect,
  auth.restrictTo("admin", "agent"),
  bookingController.updateStatus,
);

const paymentService = createPaymentService({
  stripe,
  db,
  PaymentLinkSchema,
  StripeProductSchema,
});
const paymentsController = createPaymentsController({
  service: paymentService,
});
router.use(
  "/payments",
  createPaymentsAdminRouter({ controller: paymentsController, auth }),
);

async function handleBookingPaymentSuccess(session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    logger.warn("[booking] No bookingId in webhook metadata", {
      sessionId: session.id,
    });
    return;
  }
  const booking = await bookingService.getBookingById(bookingId);
  if (!booking) {
    logger.warn("[booking] Booking not found for webhook", { bookingId });
    return;
  }
  await bookingService.updateBookingStatus(bookingId, "paid");

  const bookingRef = booking.bookingRef
    ? `AR-${booking.bookingRef}`
    : `AR-${String(bookingId).slice(-6).toUpperCase()}`;

  const emailData = {
    email: booking.passenger.email,
    firstName: booking.passenger.firstName,
    lastName: booking.passenger.lastName,
    countryCode: booking.passenger.countryCode || null,
    phone: booking.passenger.phone || null,
    flightNumber: booking.passenger.flightNumber || null,
    specialRequests: booking.passenger.specialRequests || null,
    bookingRef,
    bookingId,
    pickup: booking.trip.pickup?.label,
    dropoff: booking.trip.dropoff?.label,
    date: booking.trip.date,
    time: booking.trip.time,
    passengers: booking.trip.passengers,
    luggage: booking.trip.luggage,
    vehicleName: booking.vehicle.name,
    vehicleClass: booking.vehicle.class,
    price: booking.vehicle.price,
  };

  const [adminSent, customerSent] = await Promise.all([
    notifications.sendBookingPaymentToAdmin(emailData),
    notifications.sendBookingConfirmationToCustomer(emailData),
  ]);

  if (!adminSent) {
    logger.warn(
      "[booking] Admin notification email not sent — check BREVO_API_KEY and sender verification",
      {
        bookingRef,
        bookingId,
      },
    );
  }
  if (!customerSent) {
    logger.warn(
      "[booking] Customer confirmation email not sent — check BREVO_API_KEY and sender verification",
      {
        bookingRef,
        email: emailData.email,
      },
    );
  }
}

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
      assistantDatasets.transferBookings(db.models["transfer-booking"]),
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
    booking: handleBookingPaymentSuccess,
    "payment-link": handlePaymentLinkSuccess,
  },
});

export default router;
