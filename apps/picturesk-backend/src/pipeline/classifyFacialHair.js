
import { FACIAL_HAIR, isValidFacialHair } from '@travel-suite/picturesk-shared';

const REPLICATE_API = 'https://api.replicate.com';
const DEFAULT_VISION_MODEL =
  'lucataco/qwen2-vl-7b-instruct:bf57361c75677fc33d480d0c5f02926e621b2caa2000347cb74aeae9d2ca07ee';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function visionVersionHash() {
  const model = process.env.PULID_VISION_MODEL || DEFAULT_VISION_MODEL;
  return model.split(':').pop();
}

function mapAnswer(text) {
  const a = String(text || '').toLowerCase();
  let id = null;
  if (a.includes('clean') || a.includes('shaven')) id = 'clean_shaven';
  else if (a.includes('goatee')) id = 'goatee';
  else if (a.includes('moustache') || a.includes('mustache')) id = 'moustache';
  else if (a.includes('full beard')) id = 'full_beard';
  else if (a.includes('short beard')) id = 'short_beard';
  else if (a.includes('stubble')) id = 'stubble';
  else if (a.includes('beard')) id = 'full_beard'; 
  return id && isValidFacialHair(id) ? id : null;
}

export async function classifyFacialHair(referenceImageUrl) {
  if (!referenceImageUrl) return null;
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;

  const options = FACIAL_HAIR.map((f) => f.label.toLowerCase()).join(', ');
  const prompt = `Which one best describes this person's facial hair? Reply with ONLY one of: ${options}.`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    let body = await (
      await fetch(`${REPLICATE_API}/v1/predictions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'wait=60' },
        body: JSON.stringify({
          version: visionVersionHash(),
          input: { media: referenceImageUrl, prompt, max_new_tokens: 12 },
        }),
        signal: AbortSignal.timeout(70000),
      })
    ).json();
    const getUrl = body.urls?.get;
    const deadline = Date.now() + 120000;
    while ((body.status === 'starting' || body.status === 'processing') && getUrl && Date.now() < deadline) {
      await sleep(3000);
      body = await (await fetch(getUrl, { headers, signal: AbortSignal.timeout(30000) })).json();
    }
    if (body.status !== 'succeeded') return null;
    const text = Array.isArray(body.output) ? body.output.join('') : body.output;
    return mapAnswer(text);
  } catch {
    return null; 
  }
}
