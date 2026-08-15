import { Router } from "express";
import { createAuthRouter } from "@travel-suite/auth";
import { createAdminUsersRouter } from "@travel-suite/admin-users";
import { createBlogRouter, createBlogTagRouter } from "@travel-suite/blog";
import { createCloudinaryStorage } from "@travel-suite/cloudinary";
import { createCurrenciesRouter } from "@travel-suite/currencies";
import { createAirportsRouter } from "@travel-suite/flights";
import { createAirLabsClient } from "@travel-suite/airlabs";
import { createBookingsRouter } from "@travel-suite/bookings";
import { createLocationsRouter } from "@travel-suite/locations";
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
import { db } from "../utils/db.js";
import { sendEmail } from "../utils/email.js";
import { createBrevoClient } from "@travel-suite/brevo";
import { logger } from "@travel-suite/utils";
import config from "../utils/config.js";

const router = Router();
const brevo = createBrevoClient({ apiKey: config.brevoApiKey, logger });


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
  apiKey: config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: "airportrides/blog",
});
router.use("/blogs", createBlogRouter({ db, auth, imageStorage }));
router.use("/blog-tags", createBlogTagRouter({ db, auth }));

// -- Currencies ----------------------------------------------------------------
router.use("/currencies", createCurrenciesRouter({ db, auth }));

// -- Airports -------------------------------------------------------------------
const airlabs = createAirLabsClient({ apiKey: config.airlabs.apiKey });
router.use("/airports", createAirportsRouter({ airlabs }));

// -- Locations (Google Maps autocomplete, coordinates, distance, IP geo) -------
router.use(
  "/locations",
  createLocationsRouter({
    googleMapsApiKey: config.googleMaps.apiKey,
    ipInfoApiKey: config.ipInfo.apiKey,
  }),
);

// -- Notifications -------------------------------------------------------------
const notifications = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: "Airport Rides",
    teamName: "Airport Rides Team",
    adminEmail: config.adminEmail,
    website: "https://www.airportrides.com",
    paymentsSenderName: "Airport Rides Payments",
    deliverySenderName: "Airport Rides Delivery",
    customerSenderName: "Airport Rides",
    theme: {
      primaryColor: "#1e60a6",
      accentColor: "#ff603a",
      linkColor: "#1e60a6",
    },
  },
});

// -- Stripe --------------------------------------------------------------------
const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

// -- Bookings ------------------------------------------------------------------
const {
  router: bookingsRouter,
  service: bookingService,
  controller: bookingController,
} = createBookingsRouter({ db, stripe, auth });
router.use("/bookings", bookingsRouter);

// Admin surfaces, mounted here rather than inside the shared bookings router
// because only this brand has them. They MUST carry the same guards as every
// other admin route in this file — without them the list hands the entire
// booking table (names, emails, phones, addresses) to anonymous callers, and
// the status route lets anyone mark a ride paid or cancelled.
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

// -- Contact form --------------------------------------------------------------
router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    await notifications.sendContactFormToAdmin({ name, email, subject, message });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// -- Launch notify signup (Brevo contact capture) -----------------------------
router.post('/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    await brevo.subscribeContact({ email, attributes: { SOURCE: 'launch-notify' } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// -- Payments (admin: revenue dashboard + custom payment links) ---------------
const paymentService = createPaymentService({
  stripe,
  db,
  PaymentLinkSchema,
  ProductSchema,
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
    booking: handleBookingPaymentSuccess,
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
  appBaseUrl: config.frontendUrl,
});

router.use("/users", usersRouter);

export default router;
