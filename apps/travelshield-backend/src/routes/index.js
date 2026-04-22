import { Router } from 'express';
import { createAuthRouter } from '@travel-suite/auth';
import { createAdminUsersRouter } from '@travel-suite/admin-users';
import { createAffiliatesRouter } from '@travel-suite/affiliates';
import { createBlogRouter, createBlogTagRouter } from '@travel-suite/blog';
import { createCloudinaryStorage } from '@travel-suite/cloudinary';
import { createCurrenciesRouter } from '@travel-suite/currencies';
import { createInsuranceRouter } from '@travel-suite/insurance';
import { createUsersRouter } from '@travel-suite/users';
import { createNotificationsService } from '@travel-suite/notifications';
import { logger } from '@travel-suite/utils';
import { db } from '../utils/db.js';
import { wis } from '../utils/wis.js';
import * as brevo from '../utils/brevo.js';
import { sendEmail } from '../utils/email.js';
import { insurancePaymentCompletionEmail } from '../notifications/insurance.js';
import config from '../utils/config.js';

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
  folder: 'blog',
});
router.use('/blogs', createBlogRouter({ db, auth, imageStorage }));
router.use('/blog-tags', createBlogTagRouter({ db, auth }));

// -- Currencies ----------------------------------------------------------------
router.use('/currencies', createCurrenciesRouter({ db, auth }));

// -- Insurance -----------------------------------------------------------------
router.use(
  '/insurance',
  createInsuranceRouter({
    db,
    wis,
    brevo,
    auth,
    notifications: { insurancePaymentCompletionEmail },
  }),
);

// -- Affiliates ----------------------------------------------------------------
// No TicketModel — travelshield is insurance-only; ticket stats return zeros
router.use('/affiliates', createAffiliatesRouter({ db, auth }));

// -- Notifications -------------------------------------------------------------
const notifications = createNotificationsService({
  sendEmail,
  logger,
  brand: {
    name: 'Travel Shield',
    teamName: 'Travel Shield Team',
    adminEmail: config.adminEmail,
    website: 'https://travelshield.ae',
    paymentsSenderName: 'Travel Shield Payments',
    deliverySenderName: 'Travel Shield Delivery',
    customerSenderName: 'Travel Shield',
    theme: { primaryColor: '#0f766e', accentColor: '#f97316', linkColor: '#0f766e' },
  },
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
