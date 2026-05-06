import VisaLeadSchema from './schemas/visaLead.schema.js';
import VisaSchema from '@travel-suite/visa/schema';
import { createVisaLeadService } from './service.js';
import { createVisaLeadController } from './controller.js';
import { createVisaLeadRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createVisaLeadRouter({ db, auth, notificationsService }) {
  const VisaLead = getOrRegisterModel(db, 'VisaLead', VisaLeadSchema);
  const Visa     = getOrRegisterModel(db, 'Visa', VisaSchema);

  const service    = createVisaLeadService({ VisaLead, Visa, notificationsService });
  const controller = createVisaLeadController({ service });
  return createVisaLeadRouterFromParts({ controller, auth });
}
