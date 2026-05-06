import VisaSchema from './schemas/visa.schema.js';
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

/**
 * @param {{
 *   db: import('mongoose').Connection,
 *   auth: { protect: Function, restrictTo: Function },
 *   imageStorage?: { saveImage(buffer: Buffer, id: string): Promise<string>, deleteImage(url: string): Promise<void>, deleteFolder(path: string): Promise<void> }
 * }} deps
 * @returns {import('express').Router}
 */
export function createVisaRouter({ db, auth, imageStorage }) {
  const Visa = getOrRegisterModel(db, 'Visa', VisaSchema);
  const service = createVisaService({ Visa, imageStorage });
  const controller = createVisaController({ service });
  return createVisaRouterFromParts({ controller, auth });
}
