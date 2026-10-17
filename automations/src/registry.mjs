import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateTarget } from './config-schema.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TARGETS_DIR = join(HERE, '..', 'targets');
const JOBS_DIR = join(HERE, '..', 'jobs');

export const JOBS = {
  'blog-generate': {
    describe: 'Generate and publish one blog post from the target\'s topic schedule',
    module: join(JOBS_DIR, 'blog-generate', 'index.mjs'),
    needsTarget: true,
    env: ['ANTHROPIC_API_KEY'],
    optionalEnv: ['RECRAFT_API_KEY'],
    dryRunEnv: [],
  },
  'blog-schedule': {
    describe: 'Space existing draft posts one per day, oldest first',
    module: join(JOBS_DIR, 'blog-schedule', 'index.mjs'),
    needsTarget: true,
    env: [],
    dryRunEnv: [],
  },
  'hotel-cancellations': {
    describe: 'Cancel refundable hotel reservations before their free window closes',
    module: join(JOBS_DIR, 'hotel-cancellations', 'index.mjs'),
    needsTarget: false,
    env: ['MONGO_URI', 'LITEAPI_API_KEY', 'BREVO_API_KEY'],
    dryRunEnv: ['MONGO_URI'],
  },
  'pricing-sync': {
    describe: 'Sync limo pricing rules from the Google Sheet',
    module: join(JOBS_DIR, 'pricing-sync', 'index.mjs'),
    needsTarget: false,
    env: ['MONGO_URI', 'PRICING_SHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON'],
    optionalEnv: ['PRICING_SHEET_TAB'],
    dryRunEnv: ['MONGO_URI', 'PRICING_SHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON'],
  },
};

export function listTargets() {
  if (!existsSync(TARGETS_DIR)) return [];
  return readdirSync(TARGETS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(TARGETS_DIR, d.name, 'config.mjs')))
    .map((d) => d.name)
    .sort();
}

export async function loadTarget(key, { job = null } = {}) {
  const available = listTargets();
  if (!available.includes(key)) {
    throw new Error(`Unknown target "${key}". Available: ${available.join(', ') || '(none)'}`);
  }
  const dir = join(TARGETS_DIR, key);
  const mod = await import(join(dir, 'config.mjs'));
  const target = { ...(mod.TARGET ?? mod.BRAND ?? mod.default), dir };
  return validateTarget(target, { job });
}

export function assertEnv(job, target = null, { dryRun = false } = {}) {
  const spec = JOBS[job];
  const required = dryRun ? (spec.dryRunEnv ?? []) : (spec.env ?? []);
  const missing = required.filter((k) => !process.env[k]);
  if (target && !dryRun) {
    for (const k of [target.adminEmailEnv, target.adminPasswordEnv]) {
      if (k && !process.env[k]) missing.push(k);
    }
  }
  if (missing.length) {
    throw new Error(`Missing required env for ${job}: ${[...new Set(missing)].join(', ')}`);
  }
}
