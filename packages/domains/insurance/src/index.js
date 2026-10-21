import InsuranceApplicationSchema from './schemas/insurance-application.schema.js';
import WisNationalitySchema from './schemas/wis-nationality.schema.js';
import { createInsuranceService } from './service.js';
import { createInsuranceController } from './controller.js';
import { createInsuranceRouterFromController } from './router.js';
import { logger } from '@travel-suite/utils';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createInsuranceRouter({ db, wis, brevo, auth, notifications, logger: injectedLogger, Affiliate = null, metaCapi, frontendUrl }) {
  const log = injectedLogger ?? logger;

  const InsuranceApplication = getOrRegisterModel(db, 'insurance-application', InsuranceApplicationSchema);
  const WisNationality          = getOrRegisterModel(db, 'wis-nationality',           WisNationalitySchema);

  const service = createInsuranceService({
    InsuranceApplication,
    Affiliate,
    wis,
    brevo,
    logger: log,
    notifications,
    metaCapi,
    frontendUrl,
  });

  const controller = createInsuranceController({
    service,
    wis,
    WisNationality,
    InsuranceApplication,
    logger: log,
    brevo,
  });

  return createInsuranceRouterFromController({ controller, auth });
}
