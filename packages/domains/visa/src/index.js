import VisaSchema from './schemas/visa.schema.js';
import VisaOverlaySchema from './schemas/visaOverlay.schema.js';
import { createVisaService } from './service.js';
import { createVisaController } from './controller.js';
import { createVisaRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createVisaRouter({ db, auth, imageStorage }) {
  const Visa = getOrRegisterModel(db, 'Visa', VisaSchema);
  const VisaOverlay = getOrRegisterModel(db, 'visa-overlay', VisaOverlaySchema);
  const service = createVisaService({ Visa, VisaOverlay, imageStorage });
  const controller = createVisaController({ service });
  return createVisaRouterFromParts({ controller, auth });
}

export { VisaOverlaySchema };
export { resolveVisaForResidence } from './resolveForResidence.js';
