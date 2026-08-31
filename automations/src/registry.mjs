import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateTarget } from './config-schema.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TARGETS_DIR = join(HERE, '..', 'targets');
const JOBS_DIR = join(HERE, '..', 'jobs');

/**
 * The index of what can run. Adding an automation means adding one entry here
 * and one thin caller workflow; nothing else in this package changes.
 *
 * `env` is what the job needs beyond the target's own credential vars, and is
 * checked before the job starts so a missing secret fails in the first second
 * rather than halfway through a paid API call.
 */
export const JOBS = {
  'blog-generate': {
    describe: 'Generate and publish one blog post from the target\'s topic schedule',
    module: join(JOBS_DIR, 'blog-generate', 'index.mjs'),
    needsTarget: true,
    env: ['ANTHROPIC_API_KEY'],
    optionalEnv: ['RECRAFT_API_KEY'],
    // A dry run renders the prompt and exits without calling anything.
    dryRunEnv: [],
  },
  'blog-schedule': {
    describe: 'Space existing draft posts one per day, oldest first',
    module: join(JOBS_DIR, 'blog-schedule', 'index.mjs'),
    needsTarget: true,
    env: [],
    // Reads the backend to compute the schedule even when it writes nothing.
    dryRunEnv: [],
  },
  'pricing-sync': {
    describe: 'Sync limo pricing rules from the Google Sheet',
    module: join(JOBS_DIR, 'pricing-sync', 'index.mjs'),
    needsTarget: false,
    env: ['MONGO_URI', 'PRICING_SHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON'],
    optionalEnv: ['PRICING_SHEET_TAB'],
    // A dry run still reads the sheet and the database; it only skips the writes.
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

/**
 * Load and validate one target. `dir` is injected so a job resolves its data
 * files from the target's own folder rather than a filename in shared code.
 */
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

/**
 * Fail before doing any work (or spending anything) if a secret is missing.
 *
 * A dry run is checked against `dryRunEnv` instead, so `--dry-run` stays runnable
 * with no credentials at all. That is what lets CI exercise it on every PR.
 */
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
