import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

// The rubric for the LinkedIn photo analyzer. One frozen system prompt (cached
// across calls) and a strict output shape, so the page always gets the same
// fields back. The browser measures what can be measured and passes it in as
// facts; the model judges what needs judgment and writes the fixes.
const SYSTEM = `You review LinkedIn profile photos for Picturesk, an AI photo studio. You are a candid, kind studio photographer, not a chatbot.

You will receive one photo plus measurements taken in the visitor's browser (face size, position, sharpness, exposure). Treat the measurements as facts. Judge only what they cannot measure: background, expression, attire, and overall impression. Do not comment on the person's looks, age, weight, ethnicity or attractiveness. Judge the photograph.

LinkedIn shows the photo small and cropped to a circle. What works: one person, face filling roughly a third to half of the frame, eyes in the upper third, even soft light on the face, a plain or softly blurred background that is not busy, a relaxed genuine expression with eyes open, clothes you would wear to meet a client in that field. What hurts: cropped group shots, sunglasses, hats, heavy filters, harsh shadows, a distracting background, a selfie angle from below, blur, and photos that are clearly a holiday or party snap.

Scoring: 90 to 100 is a photo a recruiter would not think twice about. 70 to 89 is fine with one clear thing to improve. 50 to 69 is holding the profile back. Under 50 needs replacing. Be honest; most phone photos land between 45 and 75.

Write in plain, conversational English. No em dashes. All scores are integers from 0 to 100. Give one to three fixes, each one concrete sentence a person could act on today, and up to two strengths. Verdict is one sentence.`;

const SUB = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'note'],
  properties: { score: { type: 'integer' }, note: { type: 'string' } },
};

// Structured outputs accept the shape but not numeric or length bounds, so the
// ranges live in the prompt and are clamped below.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'verdict', 'background', 'expression', 'attire', 'fixes', 'strengths'],
  properties: {
    score: { type: 'integer' },
    verdict: { type: 'string' },
    background: SUB,
    expression: SUB,
    attire: SUB,
    fixes: { type: 'array', items: { type: 'string' } },
    strengths: { type: 'array', items: { type: 'string' } },
  },
};

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
function tidy(r) {
  const sub = (x) => ({ score: clamp(x?.score), note: String(x?.note || '') });
  return {
    score: clamp(r.score),
    verdict: String(r.verdict || ''),
    background: sub(r.background),
    expression: sub(r.expression),
    attire: sub(r.attire),
    fixes: (Array.isArray(r.fixes) ? r.fixes : []).map(String).filter(Boolean).slice(0, 3),
    strengths: (Array.isArray(r.strengths) ? r.strengths : []).map(String).filter(Boolean).slice(0, 2),
  };
}

let client;
function anthropic() {
  if (!client) client = new Anthropic();
  return client;
}

/**
 * @param {{ data: string, mediaType: string }} image - base64 image
 * @param {object} metrics - the browser's measurements (see lib/photoMetrics.js)
 */
export async function analyzeLinkedInPhoto(image, metrics) {
  const facts = [
    `Face detected: ${metrics.faceCount ?? 'unknown'} face(s).`,
    metrics.faceRatio != null ? `Face height is ${Math.round(metrics.faceRatio * 100)}% of the frame height.` : null,
    metrics.eyeLine != null ? `Eyes sit at ${Math.round(metrics.eyeLine * 100)}% from the top.` : null,
    metrics.sharpness != null ? `Sharpness: ${metrics.sharpness} (low under 60, good above 150).` : null,
    metrics.brightness != null ? `Mean brightness ${metrics.brightness} of 255, contrast ${metrics.contrast}.` : null,
    metrics.width ? `Resolution ${metrics.width}x${metrics.height}.` : null,
    `Framing score from measurements: ${metrics.framingScore}. Lighting score from measurements: ${metrics.lightingScore}.`,
  ]
    .filter(Boolean)
    .join('\n');

  const response = await anthropic().messages.create({
    model: 'claude-opus-5',
    max_tokens: 1500,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
          {
            type: 'text',
            text: `Measurements:\n${facts}\n\nScore this photo for LinkedIn. Fold the framing and lighting scores into the overall score alongside your own judgment of background, expression and attire.`,
          },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') return null;
  const text = response.content.find((b) => b.type === 'text')?.text;
  return text ? tidy(JSON.parse(text)) : null;
}
