import AirlineSchema from './schemas/airline.schema.js';
import { createFlightService } from './service.js';
import { createFlightController } from './controller.js';
import { createFlightRouterFromParts, createAirportRouterFromParts } from './router.js';

export { createAmadeusClient } from './amadeus.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createFlightRouter({ db, amadeus, auth }) {
  const Airline = getOrRegisterModel(db, 'airline', AirlineSchema);
  const service = createFlightService({ Airline, amadeus });
  const controller = createFlightController({ service });
  return createFlightRouterFromParts({ controller, auth });
}

export function createAirportsRouter({ amadeus }) {
  // Airport search is stateless — no DB model needed
  const service = createFlightService({ Airline: null, amadeus });
  const controller = createFlightController({ service });
  return createAirportRouterFromParts({ controller });
}
