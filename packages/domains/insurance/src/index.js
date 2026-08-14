import InsuranceApplicationSchema from './schemas/InsuranceApplicationSchema.js';
import NationalitySchema from './schemas/NationalitySchema.js';
import { createInsuranceService } from './service.js';
import { createInsuranceController } from './controller.js';
import { createInsuranceRouterFromController } from './router.js';
import { logger } from '@travel-suite/utils';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createInsuranceRouter({ db, wis, brevo, auth, notifications, logger: injectedLogger, Affiliate = null }) {
  const log = injectedLogger ?? logger;

  const InsuranceApplication = getOrRegisterModel(db, 'insurance-application', InsuranceApplicationSchema);
  const Nationality          = getOrRegisterModel(db, 'Nationality',           NationalitySchema);

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
