import CurrencySchema from './schema.js';
import { createCurrencyService } from './service.js';
import { createCurrencyController } from './controller.js';
import { createCurrencyRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createCurrenciesRouter({ db, auth }) {
  const Currency = getOrRegisterModel(db, 'Currency', CurrencySchema);
  const service = createCurrencyService({ Currency });
  const controller = createCurrencyController({ service });
  return createCurrencyRouterFromParts({ controller, auth });
}
