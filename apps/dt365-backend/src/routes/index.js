import { Router } from 'express';
import { createAuthRouter } from '@travel-suite/auth';
import { createAdminUsersRouter } from '@travel-suite/admin-users';
import { createAffiliatesRouter, AffiliateSchema } from '@travel-suite/affiliates';
import { createBlogRouter, createBlogTagRouter } from '@travel-suite/blog';
import { createCloudinaryStorage } from '@travel-suite/cloudinary';
import { createCurrenciesRouter } from '@travel-suite/currencies';
import { createFlightRouter, createAirportsRouter, createAmadeusClient } from '@travel-suite/flights';
import { createTicketsRouter } from '@travel-suite/tickets';
import { createUsersRouter } from '@travel-suite/users';
import { createNotificationsService } from '@travel-suite/notifications';
import { createStripeClient, createStripeWebhookHandler } from '@travel-suite/payments';
import { db } from '../utils/db.js';
import { sendEmail } from '../utils/email.js';
import config from '../utils/config.js';
import { logger } from '@travel-suite/utils';

// -- Model pre-registration (ORDER CRITICAL) -----------------------------------
function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}
const AffiliateModel = getOrRegisterModel(db, 'Affiliate', AffiliateSchema);

const router = Router();

// -- Auth ----------------------------------------------------------------------
const { router: authRouter, middleware: auth, AdminUser } = createAuthRouter({
  db,
  jwtSecret:           config.jwtSecret,
  jwtExpiresIn:        config.jwtExpiresIn,
  cookieExpiresInDays: config.jwtCookieExpiresInDays,
  nodeEnv:             config.nodeEnv,
});

router.use('/auth', authRouter);

// -- Admin Users ---------------------------------------------------------------
router.use('/admin-users', createAdminUsersRouter({ AdminUser, auth }));

// -- Blog ----------------------------------------------------------------------
const imageStorage = createCloudinaryStorage({
  cloudName: config.cloudinary.cloudName,
  apiKey:    config.cloudinary.apiKey,
  apiSecret: config.cloudinary.apiSecret,
  logger,
  folder: 'dt365/blog',
});
router.use('/blogs', createBlogRouter({ db, auth, imageStorage }));
router.use('/blog-tags', createBlogTagRouter({ db, auth }));

// -- Currencies ----------------------------------------------------------------
router.use('/currencies', createCurrenciesRouter({ db, auth }));

// -- Flights -------------------------------------------------------------------
const amadeus = createAmadeusClient({
  apiKey:    config.amadeus.apiKey,
  apiSecret: config.amadeus.apiSecret,
});
router.use('/flights', createFlightRouter({ db, amadeus, auth }));
router.use('/airports', createAirportsRouter({ amadeus }));

// -- Notifications -------------------------------------------------------------
const notifications = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: 'Dummy Ticket 365',
    teamName: 'Dummy Ticket 365 Team',
    adminEmail: config.adminEmail,
    website: 'https://dummyticket365.com',
    paymentsSenderName: 'Dummy Ticket 365 Payments',
    deliverySenderName: 'Dummy Ticket 365 Delivery',
    customerSenderName: 'Dummy Ticket 365',
    theme: { primaryColor: '#1e60a6', accentColor: '#ff603a', linkColor: '#1e60a6' },
  },
});

// -- Stripe --------------------------------------------------------------------
const stripe = createStripeClient({ secretKey: config.stripe.secretKey });

// -- Tickets -------------------------------------------------------------------
const { router: ticketsRouter, pricingRouter, handleStripeSuccess, TicketModel } = createTicketsRouter({
  db, auth, stripe, notifications, frontendUrl: config.frontendUrl, AffiliateModel,
});
router.use('/tickets', ticketsRouter);
router.use('/pricing', pricingRouter);

// -- Affiliates ----------------------------------------------------------------
router.use('/affiliates', createAffiliatesRouter({ db, auth, TicketModel }));

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
  jwtSecret:           config.userJwtSecret,
  jwtExpiresIn:        config.userJwtExpiresIn,
  cookieExpiresInDays: config.userCookieExpiresInDays,
  nodeEnv:             config.nodeEnv,
  notifications,
});

router.use('/users', usersRouter);

export default router;
