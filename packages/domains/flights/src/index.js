import AirlineSchema from './schemas/airline.schema.js';
import { createFlightService } from './service.js';
import { createFlightController } from './controller.js';
import { createFlightRouterFromParts, createAirportRouterFromParts } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createFlightRouter({ db, airlabs, serpapi, auth }) {
  const Airline = getOrRegisterModel(db, 'airline', AirlineSchema);
  const service = createFlightService({ Airline, airlabs, serpapi });
  const controller = createFlightController({ service });
  return createFlightRouterFromParts({ controller, auth });
}

export function createAirportsRouter({ airlabs }) {
  const service = createFlightService({ Airline: null, airlabs });
  const controller = createFlightController({ service });
  return createAirportRouterFromParts({ controller });
}
