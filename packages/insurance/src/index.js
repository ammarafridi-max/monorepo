import InsuranceApplicationSchema from './schemas/InsuranceApplicationSchema.js';
import NationalitySchema from './schemas/NationalitySchema.js';
import AffiliateSchema from './schemas/AffiliateSchema.js';
import { createInsuranceService } from './service.js';
import { createInsuranceController } from './controller.js';
import { createInsuranceRouterFromController } from './router.js';
import { logger } from '@travel-suite/utils';

export { createWisClient } from './wis.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

/**
 * Factory that wires the full insurance feature and returns a mounted Express router.
 *
 * @param {{
 *   db: import('mongoose').Connection,
 *   wis: ReturnType<import('./wis.js').createWisClient>,
 *   brevo: { createContact: Function, updateContactAttribute: Function },
 *   auth: { protect: Function, restrictTo: Function },
 *   notifications: { insurancePaymentCompletionEmail: Function },
 *   logger?: object,
 * }} deps
 */
export function createInsuranceRouter({ db, wis, brevo, auth, notifications, logger: injectedLogger }) {
  const log = injectedLogger ?? logger;

  const InsuranceApplication = getOrRegisterModel(db, 'insurance-application', InsuranceApplicationSchema);
  const Nationality          = getOrRegisterModel(db, 'Nationality',           NationalitySchema);
  const Affiliate            = getOrRegisterModel(db, 'Affiliate',             AffiliateSchema);

  const service = createInsuranceService({
    InsuranceApplication,
    Affiliate,
    wis,
    brevo,
    logger: log,
    notifications,
  });

  const controller = createInsuranceController({
    service,
    wis,
    Nationality,
    InsuranceApplication,
    logger: log,
    brevo,
  });

  return createInsuranceRouterFromController({ controller, auth });
}
