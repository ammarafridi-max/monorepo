import fs from 'node:fs';
import path from 'node:path';
import { buildPrompts, buildSubject } from '@travel-suite/picturesk-shared/catalog';
import { TRIGGER_WORD } from './src/pipeline/replicateClient.js';

const S = process.env.SCRATCH;
const { version } = JSON.parse(fs.readFileSync(path.join(S, 'exp-training.json'), 'utf8'));
const TOKEN = process.env.REPLICATE_API_TOKEN;
const hash = version.split(':').pop();
const subject = buildSubject({ gender: 'man', ageRange: 'age_25_34', race: 'south_asian', facialHair: 'full_beard', build: 'average', height: 'h_170_180' });
const anchor = `${TRIGGER_WORD}, ${subject}`;

const SCENES = [
  ['coffee_shop', 'linen_summer', 'sitting sideways at a small cafe table by a big window, elbow on the table, laughing at someone just out of frame', 'hard morning sun through the window lighting one side of the face'],
  ['rooftop_golden_hour', 'smart_casual_shirt', 'leaning back against a rooftop railing, three-quarter turn, looking off into the distance, city behind', 'low golden sun from behind and to the side, warm rim light on the hair'],
  ['city_street_evening', 'bomber_jacket', 'walking towards the camera mid-stride on a busy street at dusk, hands in jacket pockets, half smile', 'mixed neon and shop light, slightly underexposed, motion in the background'],
  ['hiking_trail', 'fitted_tee_jeans', 'sitting on a rock at a viewpoint, forearms on knees, squinting slightly into the wind, candid', 'flat overcast daylight, no shadows'],
  ['beach_sunset', 'linen_summer', 'walking along the waterline away from the camera and glancing back over the shoulder', 'strong orange backlight, face partly in shadow, lens flare'],
  ['park_picnic', 'knit_sweater', 'lying propped on one elbow on a picnic blanket, mid-laugh, eyes closed', 'dappled afternoon light through leaves'],
  ['cosy_kitchen', 'fitted_tee_jeans', 'standing at the counter chopping vegetables, looking down at the board, concentrating', 'soft window light from the left, warm kitchen lamps'],
  ['bookshop', 'denim_jacket', 'standing between shelves reading a book, head tilted down, three-quarter profile', 'warm tungsten light, slightly grainy'],
  ['dinner_table', 'blazer_no_tie', 'seated at a restaurant table, leaning in, mid-sentence with a hand gesture, wine glass in front', 'candlelight and a warm pendant lamp, dark background'],
  ['dog_park', 'athleisure', 'crouched down beside a medium dog, ruffling its ears, looking at the dog not the camera', 'bright soft daylight'],
];

const TAIL_B = 'shot on a phone by a friend, candid, unposed, natural realistic skin texture with pores and slight unevenness, visible film grain, imperfect framing, no studio lighting, no retouching';

async function create(input, model) {
  const res = await fetch(model ? `https://api.replicate.com/v1/models/${model}/predictions` : 'https://api.replicate.com/v1/predictions', {
    method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', Prefer: 'wait=60' },
    body: JSON.stringify(model ? { input } : { version: hash, input }),
  });
  const p = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(p));
  return p;
}
async function wait(p) {
  while (p.status !== 'succeeded' && p.status !== 'failed' && p.status !== 'canceled') {
    await new Promise((r) => setTimeout(r, 4000));
    p = await (await fetch(p.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  }
  if (p.status !== 'succeeded') throw new Error(`prediction ${p.id} ${p.status}: ${p.error}`);
  return { url: Array.isArray(p.output) ? p.output[0] : p.output, t: p.metrics?.predict_time ?? 0 };
}
async function save(url, name) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(path.join(S, 'out', name), buf);
}
fs.mkdirSync(path.join(S, 'out'), { recursive: true });

const results = [];
async function runScene([look, attire, pose, light], i) {
  // Arm A: exactly what the pipeline sends today.
  const promptA = buildPrompts({ looks: [look], attire: [attire], count: 1, subjectAnchor: anchor, product: 'dating', gender: 'man' })[0];
  const a = create({ prompt: promptA, num_outputs: 1, aspect_ratio: '1:1', output_format: 'jpg', lora_scale: 1.15, seed: 1000 + i });
  // Arm B: plate without the LoRA, then img2img with it.
  const sceneFrag = promptA.split(', ').slice(2).join(', ').split(', smiling naturally')[0].split(', laughing')[0].split(', caught')[0].split(', relaxed')[0].split(', looking away')[0];
  const platePrompt = `candid photo of a bearded man in his early thirties, ${pose}, ${sceneFrag}, ${light}, ${TAIL_B}`;
  const plate = await wait(await create({ prompt: platePrompt, aspect_ratio: '4:5', output_format: 'jpg', seed: 2000 + i, guidance: 3 }, 'black-forest-labs/flux-dev'));
  await save(plate.url, `plate_${i}.jpg`);
  const promptB = `${anchor}, ${pose}, ${sceneFrag}, ${light}, ${TAIL_B}`;
  const b = create({ prompt: promptB, image: plate.url, prompt_strength: 0.8, num_outputs: 1, aspect_ratio: '4:5', output_format: 'jpg', lora_scale: 1.0, seed: 3000 + i, guidance: 3 });
  const [ra, rb] = await Promise.all([a.then(wait), b.then(wait)]);
  await save(ra.url, `A_${i}.jpg`);
  await save(rb.url, `B_${i}.jpg`);
  results.push({ i, look, promptA, promptB, tA: ra.t, tB: rb.t, tPlate: plate.t });
  console.log('scene', i, look, 'done', `A ${ra.t.toFixed(0)}s`, `plate ${plate.t.toFixed(0)}s`, `B ${rb.t.toFixed(0)}s`);
}

for (let i = 0; i < SCENES.length; i += 3) {
  await Promise.all(SCENES.slice(i, i + 3).map((s, k) => runScene(s, i + k).catch((e) => console.log('scene', i + k, 'ERR', e.message.slice(0, 200)))));
}
fs.writeFileSync(path.join(S, 'exp-results.json'), JSON.stringify(results, null, 1));
console.log('ALL DONE');
