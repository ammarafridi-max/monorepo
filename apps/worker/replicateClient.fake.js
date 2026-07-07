/**
 * In-memory fake of the Replicate client (same 4-function interface as
 * replicateClient.js). It exists to prove the worker's crash-reattach and
 * per-slot idempotency without touching real Replicate, real money, or the
 * network. Wired into the worker via USE_FAKE_REPLICATE=1; used directly by the
 * crash tests in test/.
 *
 * It:
 *   - returns ids instantly (no waiting)
 *   - lets the test script SCRIPT the status sequence per resource, e.g.
 *     ['processing', 'processing', 'succeeded'] (each poll of a given resource
 *     consumes the next entry, then sticks on the last)
 *   - COUNTS how many times each function was called (startTraining /
 *     startGeneration are the ones the idempotency guarantees are about)
 *   - can inject a one-shot "crash" on the Nth call of a given function, so a
 *     test can stop the pipeline mid-flight and then restart it
 *
 * All state is module-level (a single fake per process). Call resetFake() at the
 * start of each test to get a clean slate.
 */

/** @typedef {'processing'|'succeeded'|'failed'} FakeStatus */

let state;

/**
 * Reset (and optionally configure) the fake.
 *
 * @param {Object} [config]
 * @param {FakeStatus[]} [config.trainingStatusSeq]   - per-training poll sequence
 * @param {FakeStatus[]} [config.generationStatusSeq] - per-generation poll sequence
 * @param {string} [config.trainedModelVersion]       - returned once training succeeds
 * @param {number} [config.trainingCostUsd]
 * @param {number} [config.generationCostUsd]
 * @param {Object<string, number>} [config.crashOn]   - e.g. { pollTraining: 1 } throws
 *        (once) on the 1st pollTraining call
 */
export function resetFake(config = {}) {
  state = {
    counts: { startTraining: 0, pollTraining: 0, startGeneration: 0, pollGeneration: 0 },
    trainingStatusSeq: config.trainingStatusSeq ?? ['succeeded'],
    generationStatusSeq: config.generationStatusSeq ?? ['succeeded'],
    trainedModelVersion: config.trainedModelVersion ?? 'fakeowner/fakemodel:v1',
    trainingCostUsd: config.trainingCostUsd ?? 1.5,
    generationCostUsd: config.generationCostUsd ?? 0.02,
    crashOn: { ...(config.crashOn ?? {}) },
    // Per-resource poll cursors so each training/prediction walks its own sequence.
    trainingPolls: new Map(),
    generationPolls: new Map(),
    nextTrainingId: 1,
    nextPredictionId: 1,
  };
}
resetFake();

/** Snapshot of call counts. */
export function getCounts() {
  return { ...state.counts };
}

/** One-shot crash: throw on the configured Nth call of `op`, then disarm. */
function maybeCrash(op) {
  if (state.crashOn[op] && state.counts[op] === state.crashOn[op]) {
    const at = state.crashOn[op];
    state.crashOn[op] = null; // fire once only; a "restart" past this point succeeds
    throw new Error(`SIMULATED_CRASH: ${op} at call ${at}`);
  }
}

/** Advance and read a per-resource status sequence (sticks on the last entry). */
function nextStatus(map, key, seq) {
  const n = map.get(key) ?? 0;
  map.set(key, n + 1);
  return seq[Math.min(n, seq.length - 1)];
}

export async function startTraining(_imageZipUrl) {
  state.counts.startTraining += 1;
  maybeCrash('startTraining');
  const trainingId = `train_${state.nextTrainingId++}`;
  return { trainingId };
}

export async function pollTraining(trainingId) {
  state.counts.pollTraining += 1;
  maybeCrash('pollTraining');
  const status = nextStatus(state.trainingPolls, trainingId, state.trainingStatusSeq);
  return {
    status,
    trainedModelVersion: status === 'succeeded' ? state.trainedModelVersion : undefined,
    costUsd: status === 'succeeded' ? state.trainingCostUsd : undefined,
  };
}

export async function startGeneration(_modelVersion, _prompt) {
  state.counts.startGeneration += 1;
  maybeCrash('startGeneration');
  const predictionId = `pred_${state.nextPredictionId++}`;
  return { predictionId };
}

export async function pollGeneration(predictionId) {
  state.counts.pollGeneration += 1;
  maybeCrash('pollGeneration');
  const status = nextStatus(state.generationPolls, predictionId, state.generationStatusSeq);
  return {
    status,
    imageUrl: status === 'succeeded' ? `https://fake.local/img/${predictionId}.jpg` : undefined,
    costUsd: status === 'succeeded' ? state.generationCostUsd : undefined,
  };
}

// Static config parity with the real client. The worker imports PROMPTS from the
// real module, but exporting a stub keeps the interface uniform for direct use.
export const PROMPTS = Object.freeze(['fake prompt']);
