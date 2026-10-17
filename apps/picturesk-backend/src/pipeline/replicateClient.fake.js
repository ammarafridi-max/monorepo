

let state;

export function resetFake(config = {}) {
  state = {
    counts: {
      startTraining: 0,
      pollTraining: 0,
      startGeneration: 0,
      pollGeneration: 0,
      cancelTraining: 0,
      deleteTrainedModel: 0,
    },
    unallocatedTrainings: config.unallocatedTrainings ?? 0,
    allocateAfterPolls: config.allocateAfterPolls ?? 0,
    trainingAllocPolls: new Map(),
    trainingStatusSeq: config.trainingStatusSeq ?? ['succeeded'],
    generationStatusSeq: config.generationStatusSeq ?? ['succeeded'],
    trainedModelVersion: config.trainedModelVersion ?? 'fakeowner/fakemodel:v1',
    weightsUrl: config.weightsUrl ?? undefined,
    trainingCostUsd: config.trainingCostUsd ?? 1.5,
    generationCostUsd: config.generationCostUsd ?? 0.02,
    crashOn: { ...(config.crashOn ?? {}) },
    trainingPolls: new Map(),
    generationPolls: new Map(),
    nextTrainingId: 1,
    nextPredictionId: 1,
  };
}
resetFake();

export function getCounts() {
  return { ...state.counts };
}

function maybeCrash(op) {
  if (state.crashOn[op] && state.counts[op] === state.crashOn[op]) {
    const at = state.crashOn[op];
    state.crashOn[op] = null; 
    throw new Error(`SIMULATED_CRASH: ${op} at call ${at}`);
  }
}

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
  const num = Number(String(trainingId).split('_')[1]);
  if (num <= state.unallocatedTrainings) {
    return { status: 'processing', allocated: false };
  }
  const seen = state.trainingAllocPolls.get(trainingId) ?? 0;
  state.trainingAllocPolls.set(trainingId, seen + 1);
  if (seen < state.allocateAfterPolls) {
    return { status: 'processing', allocated: false };
  }
  const status = nextStatus(state.trainingPolls, trainingId, state.trainingStatusSeq);
  return {
    status,
    allocated: true,
    trainedModelVersion: status === 'succeeded' ? state.trainedModelVersion : undefined,
    weightsUrl: status === 'succeeded' ? state.weightsUrl : undefined,
    costUsd: status === 'succeeded' ? state.trainingCostUsd : undefined,
  };
}

export async function cancelTraining(_trainingId) {
  state.counts.cancelTraining += 1;
}

export async function deleteTrainedModel(_modelVersion) {
  state.counts.deleteTrainedModel += 1;
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

