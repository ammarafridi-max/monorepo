import VisaSchema from './schemas/visa.schema.js';
import VisaOverlaySchema from './schemas/visa-overlay.schema.js';
import { createVisaService } from './service.js';
import { createVisaController } from './controller.js';
import { createVisaRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createVisaRouter({ db, auth, imageStorage }) {
  const Visa = getOrRegisterModel(db, 'visa', VisaSchema);
  const VisaOverlay = getOrRegisterModel(db, 'visa-overlay', VisaOverlaySchema);
  const service = createVisaService({ Visa, VisaOverlay, imageStorage });
  const controller = createVisaController({ service });
  return createVisaRouterFromParts({ controller, auth });
}

export { VisaOverlaySchema };
export { resolveVisaForResidence } from './resolveForResidence.js';
