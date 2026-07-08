import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import dotenv from 'dotenv';

// Load the monorepo-root .env (same explicit-path pattern as the services).
const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../../../.env') });

import {
  PROMPTS,
  SUBJECT,
  defaultLoraScale,
  startGeneration,
  pollGeneration,
} from '../replicateClient.js';

/**
 * DEV-ONLY generation tuning. Runs the REAL startGeneration/pollGeneration from
 * replicateClient.js against an ALREADY-TRAINED model version, so you can iterate
 * on headshot quality (prompt anchoring, lora_scale) for cents WITHOUT retraining
 * and WITHOUT touching the order pipeline. It never creates an Order and never
 * connects to Mongo, Redis, or Stripe. Pure generate loop.
 *
 * Usage:
 *   node scripts/tune-generation.js --version <owner/name:hash> [--scale 1.05] [--count 3]
 *   TRAINED_MODEL_VERSION=<...> GEN_LORA_SCALE=1.05 node scripts/tune-generation.js
 */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    out[key] = next && !next.startsWith('--') ? (i++, next) : 'true';
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wait one prediction to a terminal state (reusing the real pollGeneration). */
async function pollUntilDone(predictionId, { intervalMs = 5000, maxWaitMs = 5 * 60 * 1000 } = {}) {
  const deadline = Date.now() + maxWaitMs;
  while (true) {
    const snap = await pollGeneration(predictionId);
    if (snap.status !== 'processing') return snap;
    if (Date.now() > deadline) {
      throw new Error(`generation ${predictionId} did not finish within ${maxWaitMs}ms`);
    }
    await sleep(intervalMs);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const version = args.version || process.env.TRAINED_MODEL_VERSION;
  if (!version) {
    console.error(
      'Missing trained model version. Pass --version <owner/name:hash> or set TRAINED_MODEL_VERSION.\n' +
        'Grab it from a prior order: db.orders.findOne(...).replicate.trainedModelVersion'
    );
    process.exit(1);
  }
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN is required (in the root .env).');
    process.exit(1);
  }

  const loraScale = args.scale ? parseFloat(args.scale) : defaultLoraScale();
  const count = args.count ? Math.max(1, Math.min(Number(args.count), PROMPTS.length)) : PROMPTS.length;
  const prompts = PROMPTS.slice(0, count);

  console.log(`Tuning generation (dev, no training, no pipeline)`);
  console.log(`  model:      ${version}`);
  console.log(`  subject:    ${SUBJECT}`);
  console.log(`  lora_scale: ${loraScale}`);
  console.log(`  prompts:    ${count} of ${PROMPTS.length}\n`);

  const results = [];
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    process.stdout.write(`[${i + 1}/${prompts.length}] generating... `);
    try {
      const { predictionId } = await startGeneration(version, prompt, loraScale);
      const final = await pollUntilDone(predictionId);
      const ok = final.status === 'succeeded' && final.imageUrl;
      console.log(ok ? final.imageUrl : `FAILED (${final.status})`);
      results.push({
        index: i,
        prompt,
        loraScale,
        predictionId,
        status: final.status,
        imageUrl: final.imageUrl ?? null,
        costUsd: final.costUsd ?? null,
      });
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ index: i, prompt, loraScale, status: 'error', error: err.message });
    }
  }

  // Write a timestamped record so you can compare runs at different scales.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = resolve(here, 'results');
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `tune-${stamp}.json`);
  writeFileSync(
    outFile,
    JSON.stringify({ version, subject: SUBJECT, loraScale, count, results }, null, 2)
  );

  const good = results.filter((r) => r.status === 'succeeded').length;
  console.log(`\nDone: ${good}/${results.length} succeeded. Wrote ${outFile}`);
  process.exit(0);
}

main();
