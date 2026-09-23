import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { createStorage } from '@travel-suite/picturesk-shared';
import { startTraining, pollTraining } from './src/pipeline/replicateClient.js';

const S = process.env.SCRATCH;
const dir = path.join(S, 'train');
const zip = new JSZip();
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.jpg')).sort()) zip.file(f, fs.readFileSync(path.join(dir, f)));
const body = await zip.generateAsync({ type: 'nodebuffer' });
const storage = createStorage();
const zipUrl = await storage.putObject(`training/experiment-${Date.now()}.zip`, body, 'application/zip');
console.log('zip', zipUrl);
const { trainingId } = await startTraining(zipUrl);
console.log('training', trainingId);
fs.writeFileSync(path.join(S, 'exp-training.json'), JSON.stringify({ trainingId, zipUrl }));
for (;;) {
  const r = await pollTraining(trainingId);
  console.log(new Date().toISOString().slice(11, 19), r.status, r.allocated ? 'allocated' : 'queued');
  if (r.status === 'succeeded') { fs.writeFileSync(path.join(S, 'exp-training.json'), JSON.stringify({ trainingId, zipUrl, version: r.trainedModelVersion, weightsUrl: r.weightsUrl, costUsd: r.costUsd })); console.log('DONE', r.trainedModelVersion, 'cost', r.costUsd, 'weights', !!r.weightsUrl); break; }
  if (r.status === 'failed') { console.log('FAILED'); process.exit(1); }
  await new Promise((res) => setTimeout(res, 30000));
}
