/**
 * READ-ONLY diagnostic: face-stage comparison harness.
 *
 * WHY: delivered headshots can look over-filtered / "AI". The delivery chain
 * stacks several stages (generate -> [cull] -> face swap -> realism enhance ->
 * persist). This script RUNS THE EXISTING code paths (the very same
 * startGeneration/pollGeneration, swapFace, enhanceFace, and PuLID client the
 * worker injects) in isolated configurations against ONE reference face, then lays
 * the outputs out in a single contact sheet so you can eyeball which stage causes
 * the filtered look.
 *
 * IT CHANGES NOTHING. No pipeline edits, no default flips, no Mongo/Redis/queue,
 * no Order writes. It only: (optionally) uploads your reference selfies to R2 as
 * throwaway training input, calls Replicate through the real worker functions, and
 * downloads the outputs locally. Everything it reuses is imported, never
 * reimplemented.
 *
 * CONFIGURATIONS (same face, same prompts):
 *   LoRA backend (trained ONCE, reused across A-D):
 *     A  LoRA generate only              (no cull, no swap, no enhance)
 *     B  LoRA + face swap                (swap on, enhance off)
 *     C  LoRA + realism enhance          (swap off, enhance on)
 *     D  LoRA + swap + enhance           (the current stacked chain)
 *   PuLID backend (no training):
 *     E  PuLID generate only             (native path)
 *     F  PuLID + realism enhance
 *
 * Stage isolation without a seed: neither startGeneration exposes a seed, so we do
 * NOT pin seeds. Instead each derived config reuses the EXACT base image of the
 * config below it: C = enhance(A), D = enhance(swap(A)) [B's output], F = enhance(E).
 * So within a backend the swap/enhance effect is compared against an IDENTICAL base
 * (perfect isolation); only across backends (LoRA vs PuLID) do base seeds differ.
 *
 * USAGE
 *   # 1) report only (no compute, no spend): prints the env chain + estimate
 *   node scripts/face-compare.js --dry-run
 *
 *   # 2) real run from a local folder of ~10-15 selfies (uploaded to R2 for you)
 *   node scripts/face-compare.js --images /path/to/selfies
 *
 *   # or bring your own public URLs (skips the R2 upload):
 *   node scripts/face-compare.js --zip https://.../train.zip --ref https://.../face.jpg
 *
 * Useful flags:
 *   --configs A,C,E        only run these (default: all reachable)
 *   --gender man --age age_25_34 --race south_asian --facialHair full_beard
 *                          demographics fed to the SHARED buildSubject (same as prod)
 *   --lora-scale 1.0       overrides GEN_LORA_SCALE for A-D
 *   --yes                  proceed even if the estimate exceeds ~40 predictions
 *
 * ENV/CREDS (root .env, same as the worker):
 *   REPLICATE_API_TOKEN            required (all configs)
 *   REPLICATE_DESTINATION_MODEL    required for the LoRA train (A-D)
 *   REPLICATE_FACE_SWAP_MODEL      needed for B and D (else they SKIP)
 *   REPLICATE_ENHANCE_MODEL        optional (enhanceFace falls back to its default)
 *   R2_* (bucket creds)            needed only for --images (to upload your selfies)
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname } from 'node:path';
import { mkdirSync, writeFileSync, readdirSync, statSync, rmSync, readFileSync as readFile } from 'node:fs';
import dotenv from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../../../.env') });

import * as lora from '../replicateClient.js';
import * as pulid from '../replicateClient.pulid.js';
import { swapFace } from '../swapFace.js';
import { enhanceFace } from '../enhanceFace.js';
import { buildPrompts, buildSubject } from '@picturesk/shared/catalog';
import { createStorage } from '@picturesk/shared';
import JSZip from 'jszip';

const OUT_DIR = resolve(here, '../../../scripts/face-compare');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- args --------------------------------------------------------------------

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
const args = parseArgs(process.argv.slice(2));
const DRY_RUN = args['dry-run'] === 'true' || args.report === 'true';

// ---- the configuration matrix -----------------------------------------------

const ALL_CONFIGS = [
  { id: 'A', backend: 'lora', swap: false, enhance: false, label: 'LoRA generate only' },
  { id: 'B', backend: 'lora', swap: true, enhance: false, label: 'LoRA + face swap' },
  { id: 'C', backend: 'lora', swap: false, enhance: true, label: 'LoRA + realism enhance' },
  { id: 'D', backend: 'lora', swap: true, enhance: true, label: 'LoRA + swap + enhance (current stacked chain)' },
  { id: 'E', backend: 'pulid', swap: false, enhance: false, label: 'PuLID generate only' },
  { id: 'F', backend: 'pulid', swap: false, enhance: true, label: 'PuLID + realism enhance' },
];

// 3 representative styles, built through the SHARED buildPrompts (prod's builder),
// so each column is a real production-shaped prompt, not a hand-written stand-in.
const PROMPT_SPECS = [
  { slug: 'corporate-studio', col: 'Corporate studio', look: 'corporate_studio', attire: 'business_suit' },
  { slug: 'business-casual', col: 'Business casual', look: 'office_environment', attire: 'business_casual' },
  { slug: 'outdoor', col: 'Outdoor', look: 'outdoor_professional', attire: 'business_casual' },
];

// ---- env report (the "FIRST: REPORT, DON'T CHANGE" step) --------------------

function bool(v) {
  return Boolean(v && String(v).trim());
}

function reportEnv() {
  const backend = (process.env.GENERATION_BACKEND || 'lora').toLowerCase();
  const isPulid = backend === 'pulid';
  const swapModel = process.env.REPLICATE_FACE_SWAP_MODEL;
  const enhanceModel = process.env.REPLICATE_ENHANCE_MODEL;
  const embedModel = process.env.REPLICATE_FACE_EMBED_MODEL;
  const persist = (process.env.PERSIST_DELIVERED ?? 'on') !== 'off';

  // Mirror index.js's gating exactly.
  const cullOn = !isPulid && bool(embedModel);
  const swapOn = !isPulid && bool(swapModel);
  const enhanceGateOn = bool(enhanceModel); // the pipeline gate (function has a default)

  const rows = [
    ['GENERATION_BACKEND', process.env.GENERATION_BACKEND || '(unset)', backend],
    ['Identity culling (REPLICATE_FACE_EMBED_MODEL)', bool(embedModel) ? 'set' : '(unset)', cullOn ? 'ON' : 'OFF'],
    ['Face swap (REPLICATE_FACE_SWAP_MODEL)', bool(swapModel) ? 'set' : '(unset)', swapOn ? 'ON' : 'OFF'],
    ['Realism enhance (REPLICATE_ENHANCE_MODEL)', bool(enhanceModel) ? 'set' : '(unset)', enhanceGateOn ? 'ON' : 'OFF'],
    ['PERSIST_DELIVERED', process.env.PERSIST_DELIVERED || '(unset)', persist ? 'ON' : 'OFF'],
    ['GEN_LORA_SCALE', process.env.GEN_LORA_SCALE || '(unset)', String(lora.defaultLoraScale())],
    ['PULID_ID_WEIGHT', process.env.PULID_ID_WEIGHT || '(unset)', isPulid ? 'in use' : 'n/a (lora backend)'],
  ];

  console.log('\n=== FACE PIPELINE CONFIG (from this machine\'s .env) ===\n');
  const w0 = Math.max(...rows.map((r) => r[0].length));
  const w1 = Math.max(...rows.map((r) => String(r[1]).length), 'raw'.length);
  console.log(`${'flag'.padEnd(w0)}  ${'raw'.padEnd(w1)}  effect`);
  console.log(`${'-'.repeat(w0)}  ${'-'.repeat(w1)}  ------`);
  for (const [k, raw, eff] of rows) console.log(`${k.padEnd(w0)}  ${String(raw).padEnd(w1)}  ${eff}`);

  const idWeight = process.env.PULID_ID_WEIGHT || '1.2 (default)';
  const chain = isPulid
    ? `PuLID generate (id_weight ${idWeight}) -> ${enhanceGateOn ? 'enhance' : 'no enhance'} -> ${persist ? 'persist(R2)' : 'no persist'}`
    : `LoRA generate -> ${cullOn ? 'CULL' : 'no cull'} -> ${swapOn ? 'SWAP' : 'no swap'} -> ${enhanceGateOn ? 'ENHANCE' : 'no enhance'} -> ${persist ? 'persist(R2)' : 'no persist'}`;

  console.log(`\nProduction chain implied by THIS .env:\n  ${chain}`);
  console.log(
    '\nNOTE: this reflects the LOCAL .env only. The DEPLOYED worker (Fly) may have\n' +
      'different secrets. Check the deployed chain with:  fly secrets list -a picturesk-worker\n' +
      '(that lists NAMES only, not values). Whatever the filtered image you saw came\n' +
      'from, this harness lets you run each stage in isolation regardless.'
  );

  return { isPulid, swapOn, enhanceGateOn, cullOn, persist };
}

// ---- helpers: poll, download -------------------------------------------------

async function pollUntilDone(pollFn, id, { intervalMs = 5000, maxWaitMs = 6 * 60 * 1000, label = 'prediction' } = {}) {
  const deadline = Date.now() + maxWaitMs;
  while (true) {
    const snap = await pollFn(id);
    if (snap.status !== 'processing') return snap;
    if (Date.now() > deadline) throw new Error(`${label} ${id} did not finish within ${maxWaitMs}ms`);
    await sleep(intervalMs);
  }
}

const EXT_FROM_CT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Download a remote image to <configDir>/<slug>.<ext>; returns the relative path. */
async function download(url, configId, slug) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  const ct = (res.headers.get('content-type') || '').split(';')[0].trim();
  const ext = EXT_FROM_CT[ct] || (extname(new URL(url).pathname).replace('.', '') || 'jpg');
  const buf = Buffer.from(await res.arrayBuffer());
  const dir = join(OUT_DIR, configId);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${slug}.${ext}`);
  writeFileSync(file, buf);
  return `${configId}/${slug}.${ext}`;
}

// ---- input resolution (reference face + LoRA training zip) -------------------

const IMG_RE = /\.(jpe?g|png|webp)$/i;

/**
 * Turn the CLI inputs into { trainingZipUrl, referenceUrl }. With --images we
 * upload the folder to R2 (reusing createStorage.putObject) and build the training
 * zip exactly like the worker (JSZip). With --zip/--ref we use the given public
 * URLs untouched. TEST_IMAGE_ZIP_URL is honored as a zip fallback.
 */
async function resolveInputs(needLora, needRef) {
  let trainingZipUrl = args.zip || process.env.TEST_IMAGE_ZIP_URL || null;
  let referenceUrl = args.ref || null;

  if (args.images && args.images !== 'true') {
    const dir = resolve(process.cwd(), args.images);
    const files = readdirSync(dir)
      .filter((f) => IMG_RE.test(f) && statSync(join(dir, f)).isFile())
      .sort();
    if (files.length === 0) throw new Error(`no images (.jpg/.png/.webp) found in ${dir}`);

    const storage = createStorage(); // throws a clear error if R2 env is missing
    const prefix = `face-compare/${Date.now()}`;
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const buf = readFile(join(dir, files[i]));
      const ext = extname(files[i]).slice(1).toLowerCase() || 'jpg';
      const ct = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const url = await storage.putObject(`${prefix}/img_${String(i).padStart(2, '0')}.${ext}`, buf, ct);
      urls.push(url);
    }
    console.log(`[inputs] uploaded ${urls.length} reference selfies to R2 under ${prefix}/`);

    if (needLora && !trainingZipUrl) {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        zip.file(files[i], readFile(join(dir, files[i])));
      }
      const body = await zip.generateAsync({ type: 'nodebuffer' });
      trainingZipUrl = await storage.putObject(`${prefix}/train.zip`, body, 'application/zip');
      console.log(`[inputs] built + uploaded training zip: ${trainingZipUrl}`);
    }
    if (!referenceUrl) referenceUrl = urls[0];
  }

  if (needLora && !trainingZipUrl) {
    throw new Error('LoRA configs need training images: pass --images <dir> or --zip <publicZipUrl> (or set TEST_IMAGE_ZIP_URL).');
  }
  if (needRef && !referenceUrl) {
    throw new Error('Swap/PuLID configs need a reference face: pass --images <dir> or --ref <publicImageUrl>.');
  }
  return { trainingZipUrl, referenceUrl };
}

// ---- prompt construction (shared builder, prod-shaped) ----------------------

function subjectFromArgs() {
  return buildSubject({
    gender: args.gender,
    ageRange: args.age,
    race: args.race,
    facialHair: args.facialHair,
  });
}

function promptFor(backend, spec, subject) {
  const subjectAnchor =
    backend === 'pulid'
      ? `${subject}, a calm, subtle closed-mouth expression`
      : `${lora.TRIGGER_WORD}, ${subject}`;
  const [prompt] = buildPrompts({ looks: [spec.look], attire: [spec.attire], count: 1, subjectAnchor });
  return prompt;
}

// ---- generation primitives (reusing the real client functions) --------------

async function loraGenerate(modelVersion, prompt, loraScale) {
  const { predictionId } = await lora.startGeneration(modelVersion, prompt, loraScale);
  const final = await pollUntilDone((id) => lora.pollGeneration(id), predictionId, { label: 'lora-gen' });
  if (final.status !== 'succeeded' || !final.imageUrl) throw new Error(`lora generation ${predictionId} ${final.status}`);
  return final.imageUrl;
}

async function pulidGenerate(referenceUrl, prompt) {
  const { predictionId } = await pulid.startGeneration(referenceUrl, prompt);
  const final = await pollUntilDone((id) => pulid.pollGeneration(id), predictionId, { label: 'pulid-gen' });
  if (final.status !== 'succeeded' || !final.imageUrl) throw new Error(`pulid generation ${predictionId} ${final.status}`);
  return final.imageUrl;
}

// ---- contact sheet -----------------------------------------------------------

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function writeContactSheet(configs, results, meta) {
  const cell = (rel, note) => {
    if (rel) return `<figure><img src="./${esc(rel)}" loading="lazy" alt=""><figcaption>${esc(note)}</figcaption></figure>`;
    return `<div class="miss"><span>${esc(note)}</span></div>`;
  };

  const headCols = PROMPT_SPECS.map((p) => `<th>${esc(p.col)}</th>`).join('');
  const rows = configs
    .map((c) => {
      const on = [c.swap ? 'swap' : null, c.enhance ? 'enhance' : null].filter(Boolean).join(' + ') || 'none';
      const cells = PROMPT_SPECS.map((p) => {
        const r = results[c.id]?.[p.slug];
        return `<td>${r?.rel ? cell(r.rel, c.id) : cell(null, r?.error ? 'FAILED' : r?.skipped ? 'skipped' : 'n/a')}</td>`;
      }).join('');
      return `<tr><th class="rowh"><b>${esc(c.id)}</b> ${esc(c.label)}<small>backend: ${esc(c.backend)} · post: ${esc(on)}</small></th>${cells}</tr>`;
    })
    .join('\n');

  const refCell = meta.referenceRel
    ? `<figure><img src="./${esc(meta.referenceRel)}" alt=""><figcaption>reference</figcaption></figure>`
    : '<div class="miss"><span>reference</span></div>';

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Face stage comparison</title>
<style>
  :root { --bone:#faf9f6; --ink:#0b0b0c; --ash:#6b6b70; --line:#e6e4df; }
  * { box-sizing:border-box; }
  body { margin:0; padding:28px; background:var(--bone); color:var(--ink);
         font:14px/1.5 ui-sans-serif,-apple-system,Inter,sans-serif; }
  h1 { font-size:22px; margin:0 0 4px; }
  p.sub { color:var(--ash); margin:0 0 20px; }
  table { border-collapse:separate; border-spacing:8px; }
  th, td { vertical-align:top; }
  thead th { font-size:13px; color:var(--ash); font-weight:600; text-align:center; }
  th.rowh { text-align:left; width:200px; font-weight:500; }
  th.rowh small { display:block; color:var(--ash); font-weight:400; margin-top:4px; }
  figure { margin:0; width:240px; }
  img { width:240px; height:300px; object-fit:cover; border:1px solid var(--line); border-radius:6px; display:block; background:var(--line); }
  figcaption { font-size:12px; color:var(--ash); margin-top:4px; }
  .miss { width:240px; height:300px; border:1px dashed var(--line); border-radius:6px; display:flex;
          align-items:center; justify-content:center; color:var(--ash); font-size:12px; }
  .corner figure { width:240px; }
  .corner img { height:auto; max-height:300px; }
</style></head>
<body>
  <h1>Face stage comparison</h1>
  <p class="sub">${esc(meta.subtitle)}</p>
  <table>
    <thead><tr><th class="rowh corner">${refCell}</th>${headCols}</tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body></html>`;

  const file = join(OUT_DIR, 'index.html');
  writeFileSync(file, html);
  return file;
}

// ---- main --------------------------------------------------------------------

async function main() {
  const env = reportEnv();

  // Which configs to run.
  const want = args.configs && args.configs !== 'true' ? args.configs.split(',').map((s) => s.trim().toUpperCase()) : null;
  let configs = ALL_CONFIGS.filter((c) => !want || want.includes(c.id));

  // Reachability: swap has NO default model -> B/D need REPLICATE_FACE_SWAP_MODEL.
  const swapAvailable = bool(process.env.REPLICATE_FACE_SWAP_MODEL);
  const skipped = [];
  configs = configs.filter((c) => {
    if (c.swap && !swapAvailable) {
      skipped.push(`${c.id} (${c.label}): REPLICATE_FACE_SWAP_MODEL is unset and swapFace has no default model`);
      return false;
    }
    return true;
  });

  const needLora = configs.some((c) => c.backend === 'lora');
  const needPulid = configs.some((c) => c.backend === 'pulid');
  const needRef = configs.some((c) => c.backend === 'pulid' || c.swap);

  // Prediction estimate (per prompt, x N prompts, + 1 training if any LoRA config).
  const nP = PROMPT_SPECS.length;
  const runLoraBase = configs.some((c) => c.backend === 'lora'); // A base for A-D
  const runSwapBase = configs.some((c) => c.swap); // shared by B and D
  const enhCount = configs.filter((c) => c.enhance).length; // one enhance each (C, D, F)
  const runPulidBase = configs.some((c) => c.backend === 'pulid'); // E base for E/F
  const perPrompt = (runLoraBase ? 1 : 0) + (runSwapBase ? 1 : 0) + (runPulidBase ? 1 : 0) + enhCount;
  const estimate = (needLora ? 1 : 0) + perPrompt * nP;

  console.log('\n=== CONFIGURATIONS TO RENDER ===');
  for (const c of configs) console.log(`  ${c.id}  ${c.label}`);
  if (skipped.length) {
    console.log('\nSKIPPED (not reachable without setting env; no code changed):');
    for (const s of skipped) console.log(`  - ${s}`);
  }
  console.log(`\nEstimated Replicate predictions: ~${estimate}` + (needLora ? '  (includes 1 LoRA training)' : ''));
  console.log(`  = ${needLora ? '1 training + ' : ''}${nP} prompts x ${perPrompt} per prompt`);
  console.log('  Note: seeds are NOT pinnable (no seed param on startGeneration); C/D/F reuse');
  console.log('        the exact base image of A/B/E so each stage is compared on an identical base.');

  if (DRY_RUN) {
    console.log('\n--dry-run: reporting only. No compute, no upload, no spend. Exiting.');
    return;
  }
  if (estimate > 40 && args.yes !== 'true') {
    console.log(`\nEstimate ${estimate} exceeds ~40 predictions. Re-run with --yes to proceed.`);
    process.exit(2);
  }
  if (!process.env.REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is required (root .env).');
  if (configs.length === 0) throw new Error('No configurations to run (all filtered/skipped).');

  // Fresh output tree.
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const subject = subjectFromArgs();
  const loraScale = args['lora-scale'] ? parseFloat(args['lora-scale']) : lora.defaultLoraScale();
  console.log(`\nSubject anchor (shared buildSubject): "${subject}"`);
  console.log(`LoRA scale: ${loraScale}\n`);

  const { trainingZipUrl, referenceUrl } = await resolveInputs(needLora, needRef);

  // Save the reference face into the sheet's corner.
  let referenceRel = null;
  if (referenceUrl) {
    try {
      referenceRel = await download(referenceUrl, '_ref', 'reference');
    } catch (e) {
      console.warn(`[warn] could not save reference thumbnail: ${e.message}`);
    }
  }

  // Train the LoRA ONCE, reuse across A-D.
  let modelVersion = null;
  if (needLora) {
    console.log('[train] starting LoRA training (once, reused for A-D)...');
    const { trainingId } = await lora.startTraining(trainingZipUrl);
    console.log(`[train] trainingId ${trainingId}; polling (can take ~20-30 min)...`);
    const t = await pollUntilDone((id) => lora.pollTraining(id), trainingId, {
      intervalMs: 15000,
      maxWaitMs: 40 * 60 * 1000,
      label: 'training',
    });
    if (t.status !== 'succeeded' || !t.trainedModelVersion) throw new Error(`training ${trainingId} ${t.status}`);
    modelVersion = t.trainedModelVersion;
    console.log(`[train] done: ${modelVersion}\n`);
  }

  // results[configId][slug] = { rel?, url?, error?, skipped? }
  const results = {};
  const set = (id, slug, v) => ((results[id] ??= {})[slug] = v);

  const has = (id) => configs.some((c) => c.id === id);

  for (const spec of PROMPT_SPECS) {
    console.log(`--- prompt: ${spec.col} ---`);

    // LoRA base (A) -> reused by B/C/D.
    let loraBaseUrl = null;
    if (needLora) {
      try {
        loraBaseUrl = await loraGenerate(modelVersion, promptFor('lora', spec, subject), loraScale);
        if (has('A')) set('A', spec.slug, { rel: await download(loraBaseUrl, 'A', spec.slug), url: loraBaseUrl });
        console.log(`  A  ${loraBaseUrl}`);
      } catch (e) {
        console.log(`  A  FAILED: ${e.message}`);
        if (has('A')) set('A', spec.slug, { error: e.message });
      }
    }

    // Swap base (B) -> reused by D.
    let swapBaseUrl = null;
    if (has('B') || has('D')) {
      if (loraBaseUrl) {
        try {
          const { imageUrl } = await swapFace(loraBaseUrl, referenceUrl);
          swapBaseUrl = imageUrl;
          if (has('B')) set('B', spec.slug, { rel: await download(swapBaseUrl, 'B', spec.slug), url: swapBaseUrl });
          console.log(`  B  ${swapBaseUrl}`);
        } catch (e) {
          console.log(`  B  FAILED: ${e.message}`);
          if (has('B')) set('B', spec.slug, { error: e.message });
        }
      } else if (has('B')) {
        set('B', spec.slug, { skipped: true });
      }
    }

    // C = enhance(A).
    if (has('C')) {
      if (loraBaseUrl) {
        try {
          const { imageUrl } = await enhanceFace(loraBaseUrl);
          set('C', spec.slug, { rel: await download(imageUrl, 'C', spec.slug), url: imageUrl });
          console.log(`  C  ${imageUrl}`);
        } catch (e) {
          console.log(`  C  FAILED: ${e.message}`);
          set('C', spec.slug, { error: e.message });
        }
      } else set('C', spec.slug, { skipped: true });
    }

    // D = enhance(B) [enhance of the swapped base] -> the current stacked chain.
    if (has('D')) {
      if (swapBaseUrl) {
        try {
          const { imageUrl } = await enhanceFace(swapBaseUrl);
          set('D', spec.slug, { rel: await download(imageUrl, 'D', spec.slug), url: imageUrl });
          console.log(`  D  ${imageUrl}`);
        } catch (e) {
          console.log(`  D  FAILED: ${e.message}`);
          set('D', spec.slug, { error: e.message });
        }
      } else set('D', spec.slug, { skipped: true });
    }

    // PuLID base (E) -> reused by F.
    let pulidBaseUrl = null;
    if (needPulid) {
      try {
        pulidBaseUrl = await pulidGenerate(referenceUrl, promptFor('pulid', spec, subject));
        if (has('E')) set('E', spec.slug, { rel: await download(pulidBaseUrl, 'E', spec.slug), url: pulidBaseUrl });
        console.log(`  E  ${pulidBaseUrl}`);
      } catch (e) {
        console.log(`  E  FAILED: ${e.message}`);
        if (has('E')) set('E', spec.slug, { error: e.message });
      }
    }

    // F = enhance(E).
    if (has('F')) {
      if (pulidBaseUrl) {
        try {
          const { imageUrl } = await enhanceFace(pulidBaseUrl);
          set('F', spec.slug, { rel: await download(imageUrl, 'F', spec.slug), url: imageUrl });
          console.log(`  F  ${imageUrl}`);
        } catch (e) {
          console.log(`  F  FAILED: ${e.message}`);
          set('F', spec.slug, { error: e.message });
        }
      } else set('F', spec.slug, { skipped: true });
    }
  }

  const subtitle =
    `Reference face run through each stage. Subject: "${subject}". ` +
    `LoRA scale ${loraScale}. Rows = configs, columns = prompts. ` +
    `Generated with the worker's real functions; no pipeline changes.`;
  const sheet = writeContactSheet(configs, results, { referenceRel, subtitle });

  // ---- plain-text summary ----
  console.log('\n=== SUMMARY (no conclusions, just what ran) ===\n');
  for (const c of configs) {
    const on = [c.swap ? 'swap' : null, c.enhance ? 'enhance' : null].filter(Boolean).join(' + ') || 'none';
    console.log(`${c.id}  ${c.label}`);
    console.log(`     backend=${c.backend}  post-processing=${on}`);
    for (const spec of PROMPT_SPECS) {
      const r = results[c.id]?.[spec.slug];
      const state = r?.rel ? `scripts/face-compare/${r.rel}` : r?.error ? `FAILED: ${r.error}` : r?.skipped ? 'skipped' : 'n/a';
      console.log(`       ${spec.col.padEnd(18)} ${state}`);
    }
  }
  if (skipped.length) {
    console.log('\nSkipped configs:');
    for (const s of skipped) console.log(`  - ${s}`);
  }
  console.log(`\nContact sheet: ${sheet}`);
  console.log(`Open it with:  open ${sheet}`);
  console.log('\nDone. Read-only diagnostic complete. Nothing in the app was changed.');
}

main().catch((err) => {
  console.error(`\n[face-compare] ${err.message}`);
  process.exit(1);
});
