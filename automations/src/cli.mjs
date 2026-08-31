#!/usr/bin/env node
/**
 * The one entrypoint for every automation, used identically by a human and by CI:
 *
 *   pnpm automation <job> [--target <key>] [--dry-run] [job flags...]
 *   pnpm automation list
 *   pnpm automation check          validate every target against the schema
 *
 * Anything after the recognised flags is passed through to the job untouched,
 * so a job keeps its own flags (--status, --generate-only, ...).
 */

import { JOBS, listTargets, loadTarget, assertEnv } from './registry.mjs';

const argv = process.argv.slice(2);

function flagValue(name) {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : null;
}

function usage() {
  console.log('Usage: pnpm automation <job> [--target <key>] [--dry-run] [job flags]\n');
  console.log('Jobs:');
  for (const [name, spec] of Object.entries(JOBS)) {
    console.log(`  ${name.padEnd(16)} ${spec.describe}`);
    const env = [...(spec.env ?? []), ...(spec.optionalEnv ?? []).map((e) => `${e}?`)];
    console.log(`  ${''.padEnd(16)} target: ${spec.needsTarget ? 'required' : 'none'} | env: ${env.join(', ') || 'none'}`);
  }
  console.log(`\nTargets: ${listTargets().join(', ') || '(none)'}`);
}

/** Validate every target against the schema for every job it could run. */
async function check() {
  let failed = 0;
  for (const key of listTargets()) {
    for (const [job, spec] of Object.entries(JOBS)) {
      if (!spec.needsTarget) continue;
      try {
        await loadTarget(key, { job });
        console.log(`  ok   ${key} / ${job}`);
      } catch (err) {
        failed++;
        console.log(`  FAIL ${key} / ${job}\n${err.message.split('\n').slice(1).join('\n')}`);
      }
    }
  }
  if (failed) {
    console.log(`\n${failed} target/job combination(s) invalid.`);
    process.exit(1);
  }
  console.log('\nAll targets valid.');
}

const job = argv[0];

if (!job || job === 'help' || job === '--help') {
  usage();
  process.exit(job ? 0 : 1);
}
if (job === 'list') {
  usage();
  process.exit(0);
}
if (job === 'check') {
  await check();
  process.exit(0);
}

const spec = JOBS[job];
if (!spec) {
  console.error(`Unknown job "${job}". Known: ${Object.keys(JOBS).join(', ')}`);
  process.exit(1);
}

const dryRun = argv.includes('--dry-run');
let target = null;

// Setup failures are configuration mistakes, not crashes: report them as one
// readable line, not a stack trace.
try {
  if (spec.needsTarget) {
    const key = flagValue('target');
    if (!key) {
      throw new Error(`Job "${job}" needs --target <key>. Available: ${listTargets().join(', ')}`);
    }
    target = await loadTarget(key, { job });
  }
  assertEnv(job, target, { dryRun });
} catch (err) {
  console.error(`✗ ${err.message}`);
  if (process.env.AUTOMATION_DEBUG) console.error(err);
  process.exit(1);
}

// Job flags only — the CLI's own flags are stripped so a job never sees them.
const passthrough = argv.slice(1).filter((a, i, all) => {
  if (a === '--dry-run') return false;
  if (a === '--target' || a.startsWith('--target=')) return false;
  if (all[i - 1] === '--target') return false;
  return true;
});

const mod = await import(spec.module);
const run = mod.run ?? mod.default;
if (typeof run !== 'function') {
  console.error(`Job "${job}" does not export run().`);
  process.exit(1);
}

const label = target ? `${job} → ${target.key}` : job;
console.log(`▶ ${label}${dryRun ? ' (dry run)' : ''}`);

try {
  await run({ target, dryRun, argv: passthrough });
} catch (err) {
  console.error(`✗ ${label} failed: ${err.message}`);
  if (process.env.AUTOMATION_DEBUG) console.error(err);
  process.exit(1);
}
