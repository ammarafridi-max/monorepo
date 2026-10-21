import VisaLeadSchema from './schemas/visa-lead.schema.js';
import VisaSchema from '@travel-suite/visa/schema';
import { createVisaLeadService } from './service.js';
import { createVisaLeadController } from './controller.js';
import { createVisaLeadRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createVisaLeadRouter({ db, auth, notificationsService, metaCapi, openaiCapi, frontendUrl }) {
  const VisaLead = getOrRegisterModel(db, 'visa-lead', VisaLeadSchema);
  const Visa     = getOrRegisterModel(db, 'visa', VisaSchema);

  const service    = createVisaLeadService({ VisaLead, Visa, notificationsService, metaCapi, openaiCapi, frontendUrl });
  const controller = createVisaLeadController({ service });
  return createVisaLeadRouterFromParts({ controller, auth });
}
