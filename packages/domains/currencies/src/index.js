import CurrencySchema from './schema.js';
import { createCurrencyService } from './service.js';
import { createCurrencyController } from './controller.js';
import { createCurrencyRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';


export function createCurrenciesRouter({ db, auth, isCurrencyInUse }) {
  const Currency = getOrRegisterModel(db, 'currency', CurrencySchema);
  const service = createCurrencyService({ Currency, isCurrencyInUse });
  const controller = createCurrencyController({ service });
  return createCurrencyRouterFromParts({ controller, auth });
}

export { default as CurrencySchema } from './schema.js';
export {
  createCurrencyConversionService,
  DEFAULT_FALLBACK_BASE_CODE,
} from './conversion.service.js';
