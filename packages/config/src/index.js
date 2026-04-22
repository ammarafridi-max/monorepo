import { validateBrand } from './schema.js';
import mdt from './brands/mdt.js';
import dt365 from './brands/dt365.js';
import travelshield from './brands/travelshield.js';
import travl from './brands/travl.js';

const brands = { mdt, dt365, travelshield, travl };

// Validate every brand at module load time — misconfigured brands fail at startup, not at runtime
for (const config of Object.values(brands)) {
  validateBrand(config);
}

export function getBrandKey() {
  const key = process.env.NEXT_PUBLIC_BRAND ?? process.env.BRAND;
  if (!key) {
    throw new Error(
      'Brand not configured. Set BRAND (backend/Node) or NEXT_PUBLIC_BRAND (Next.js) env var.'
    );
  }
  return key;
}

export function getBrand(key) {
  const resolvedKey = key ?? getBrandKey();
  const brand = brands[resolvedKey];
  if (!brand) {
    throw new Error(
      `Unknown brand key "${resolvedKey}". Valid keys: ${Object.keys(brands).join(', ')}`
    );
  }
  return brand;
}

export { brands };
export default getBrand;
