import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@travel-suite/utils';
import { inclusiveDayCount, buildExpectedDates } from './dates.js';

// Server-side only. The model produces the day-by-day plan as strict JSON.
// Our code owns the template, the validation, and the final file. The model
// never invents flights, hotels, prices, or booking references — it only
// references the cities and dates it is given.
const MODEL = 'claude-sonnet-4-6';
// Headroom for long trips: a full 60-day plan is ~4-5k output tokens of JSON, so
// 4096 truncated it mid-object (→ parse failure → FAILED). 8192 covers the max.
const MAX_TOKENS = 8192;

function buildSystemPrompt({ visaCountry, purpose }) {
  return [
    'You are a travel-itinerary writer that produces embassy-ready, day-by-day travel plans for visa applicants.',
    `This itinerary supports a ${purpose} visa application for ${visaCountry}.`,
    '',
    'STRICT RULES:',
    '1. Output ONLY a single JSON object. No prose, no explanations, no markdown code fences.',
    '2. Use ONLY the cities, countries, and dates provided in the user message. Never introduce a city, country, or date that was not given.',
    '3. NEVER invent flight numbers, airline names, hotel names, booking references, confirmation numbers, or prices.',
    '4. Give each day a short "title" (e.g. "Arrival in Zurich") and a "description": ONE short, specific sentence of roughly 12 to 22 words about what the traveller does that day. No bullet lists, no second sentence.',
    `5. Tailor the emphasis to a ${purpose} trip and to what a ${visaCountry} visa officer expects to see (clear daily intent, realistic pacing, return logic).`,
    '6. Give each day a short "type" label for the schedule: one of Arrival, Departure, Tourism, Sightseeing, Business, Meeting, Conference, Transit, Leisure, Medical, or Study. Day 1 is usually Arrival and the final day is usually Departure.',
    '',
    'OUTPUT SHAPE (exact keys):',
    '{',
    '  "summary": "2-3 sentence overview of the trip",',
    '  "days": [',
    '    { "day": 1, "date": "YYYY-MM-DD", "city": "City", "country": "Country", "type": "Arrival", "title": "Arrival in City", "description": "1-2 concise sentences about the day." }',
    '  ]',
    '}',
  ].join('\n');
}

function buildUserMessage({ input, validationFeedback }) {
  const { arrival, departure, otherCountries, startDate, endDate, purpose, visaCountry, travellers } = input;
  const dayCount = inclusiveDayCount(startDate, endDate);
  const expectedDates = buildExpectedDates(startDate, dayCount);

  const lines = [
    `Purpose of itinerary: ${purpose} (for a ${visaCountry} visa application).`,
    `Number of travellers: ${travellers}.`,
    `Trip window: ${startDate} to ${endDate} inclusive — exactly ${dayCount} days.`,
    `Day 1 must be in the arrival city: ${arrival.city}, ${arrival.country}.`,
    `The final day (day ${dayCount}) must be in the departure city: ${departure.city}, ${departure.country}.`,
    otherCountries?.length
      ? `The trip also visits: ${otherCountries.join(', ')}. Plan a sensible geographic route that begins in ${arrival.city} (${arrival.country}) and ends in ${departure.city} (${departure.country}), visiting each of these countries along the way. Group each country's days together where it makes geographic sense; the trip may pass back through a country to reach the departure city.`
      : 'There are no additional countries between arrival and departure.',
    input.segments?.length
      ? `The traveller's flight segments are:\n${input.segments
          .map((s) => `  ${s.from.city}, ${s.from.country} -> ${s.to.city}, ${s.to.country} on ${s.date}`)
          .join('\n')}\nThe traveller stays in each destination city from the day they arrive there until their next departure flight. Match the day-by-day cities to these segments.`
      : '',
    '',
    'You MUST output exactly one day for each of these dates, in order:',
    expectedDates.map((d, i) => `  day ${i + 1}: ${d}`).join('\n'),
  ];

  if (validationFeedback) {
    lines.push(
      '',
      'Your previous attempt was rejected by automated validation. Fix these problems and regenerate:',
      validationFeedback,
    );
  }

  lines.push('', 'Return ONLY the JSON object.');
  return lines.join('\n');
}

function extractJson(text) {
  // Tolerate accidental code fences or stray prose around the object.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export function createItineraryGenerator({ anthropicApiKey }) {
  if (!anthropicApiKey) {
    throw new Error('createItineraryGenerator: anthropicApiKey is required');
  }
  const client = new Anthropic({ apiKey: anthropicApiKey });

  async function callModel({ input, validationFeedback }) {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystemPrompt(input),
      messages: [{ role: 'user', content: buildUserMessage({ input, validationFeedback }) }],
    });

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return extractJson(text);
  }

  /**
   * Generates the itinerary JSON. On a parse failure, retries exactly once.
   * Validation (and the validation-driven regenerate) is handled by the caller.
   *
   * @param {{ input: object, validationFeedback?: string }} args
   * @returns {Promise<{ summary: string, days: Array }>}
   */
  async function generate({ input, validationFeedback = null }) {
    let parsed = await callModel({ input, validationFeedback });
    if (!parsed || !Array.isArray(parsed.days)) {
      logger.warn('[itineraries] Model returned unparseable JSON, retrying once');
      parsed = await callModel({ input, validationFeedback });
    }
    if (!parsed || !Array.isArray(parsed.days)) {
      throw new Error('Itinerary model did not return valid JSON after retry');
    }
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      days: parsed.days,
    };
  }

  // -- Conversational edit ---------------------------------------------------

  function buildChatSystemPrompt() {
    return [
      'You are an itinerary editor. You are given the current trip parameters, the current day-by-day itinerary, the recent conversation, and a new instruction from the user.',
      'Apply the user\'s requested change. You MAY change trip parameters (dates, arrival/departure cities, countries, purpose, number of travellers) when the user asks — and you must then rebuild the day-by-day plan to match.',
      '',
      'STRICT RULES:',
      '1. Output ONLY a single JSON object. No prose, no markdown fences.',
      '2. NEVER invent flight numbers, airline names, hotel names, booking references, or prices. Each day has a short "title" and a "description" of ONE short sentence (no bullet lists, no second sentence).',
      '3. The plan must have exactly one day per date from startDate to endDate inclusive, dated sequentially. Day 1 is in the arrival city; the final day is in the departure city. Use only the cities and countries implied by the trip parameters.',
      '4. The "reply" field is ONE short sentence to the user describing what you changed (e.g. "Done — I moved Day 3 to Lyon."). NEVER put the day-by-day itinerary text in "reply".',
      '5. If the request is unrelated to the itinerary or impossible, keep the itinerary unchanged (echo it) and explain briefly in "reply".',
      '',
      'OUTPUT SHAPE (exact keys):',
      '{',
      '  "updatedInput": { "arrival": {"city","country"}, "departure": {"city","country"}, "visaCountry", "purpose", "otherCountries": [], "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "travellers": 1 },',
      '  "itinerary": { "summary": "...", "days": [ { "day": 1, "date": "YYYY-MM-DD", "city": "...", "country": "...", "type": "Arrival|Tourism|Business|Departure|...", "title": "...", "description": "1-2 concise sentences" } ] },',
      '  "reply": "one short sentence"',
      '}',
    ].join('\n');
  }

  function buildChatUserMessage({ input, itineraryData, history, message, validationFeedback }) {
    const lines = [
      'CURRENT TRIP PARAMETERS:',
      JSON.stringify(input),
      '',
      'CURRENT ITINERARY:',
      JSON.stringify(itineraryData),
    ];
    if (history?.length) {
      lines.push('', 'RECENT CONVERSATION:');
      for (const m of history.slice(-6)) lines.push(`${m.role}: ${m.text}`);
    }
    lines.push('', `USER INSTRUCTION: ${message}`);
    if (validationFeedback) {
      lines.push('', 'Your previous attempt was rejected by automated validation. Fix these and try again:', validationFeedback);
    }
    lines.push('', 'Return ONLY the JSON object.');
    return lines.join('\n');
  }

  async function callChat(args) {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildChatSystemPrompt(),
      messages: [{ role: 'user', content: buildChatUserMessage(args) }],
    });
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return extractJson(text);
  }

  /**
   * Applies one conversational edit. Retries once on parse failure. Validation
   * of the returned itinerary against updatedInput is the caller's job.
   *
   * @returns {Promise<{ updatedInput: object, itinerary: object, reply: string }>}
   */
  async function chat({ input, itineraryData, history = [], message, validationFeedback = null }) {
    let parsed = await callChat({ input, itineraryData, history, message, validationFeedback });
    if (!parsed || !parsed.itinerary || !Array.isArray(parsed.itinerary.days) || !parsed.updatedInput) {
      logger.warn('[itineraries] Chat returned unparseable JSON, retrying once');
      parsed = await callChat({ input, itineraryData, history, message, validationFeedback });
    }
    if (!parsed || !parsed.itinerary || !Array.isArray(parsed.itinerary.days) || !parsed.updatedInput) {
      throw new Error('Itinerary chat did not return valid JSON after retry');
    }
    return {
      updatedInput: parsed.updatedInput,
      itinerary: {
        summary: typeof parsed.itinerary.summary === 'string' ? parsed.itinerary.summary : '',
        days: parsed.itinerary.days,
      },
      reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : 'Updated your itinerary.',
    };
  }

  // -- Document parsing (auto-fill the form from uploaded reservations) -------

  function buildParseSystemPrompt() {
    return [
      'You extract travel details from uploaded documents (flight tickets, e-tickets, hotel bookings, itineraries).',
      'Return ONLY a single JSON object. No prose, no markdown fences.',
      'Extract every flight/travel segment you can find, in chronological order. For each segment give the origin and destination CITY and COUNTRY (resolve airport codes to their city and country, e.g. DXB -> Dubai, United Arab Emirates; ZRH -> Zurich, Switzerland; CDG -> Paris, France) and the travel DATE as YYYY-MM-DD.',
      'Also report whether the documents indicate a flight reservation and a hotel reservation, and whether each appears confirmed.',
      'NEVER invent segments that are not present in the documents.',
      '',
      'OUTPUT SHAPE (exact keys):',
      '{',
      '  "segments": [ { "from": {"city": "...", "country": "..."}, "to": {"city": "...", "country": "..."}, "date": "YYYY-MM-DD" } ],',
      '  "flightReservation": "confirmed" | "unconfirmed" | "none",',
      '  "hotelReservation": "confirmed" | "unconfirmed" | "none"',
      '}',
      'If nothing can be determined, return an empty segments array and "none" for the reservation fields.',
    ].join('\n');
  }

  /**
   * Reads uploaded documents and extracts travel segments + reservation status.
   * @param {{ files: Array<{ buffer: Buffer, mimetype: string }> }} args
   * @returns {Promise<{ segments: Array, flightReservation: string, hotelReservation: string }>}
   */
  async function parseDocuments({ files }) {
    const content = [];
    for (const f of files || []) {
      const data = f.buffer.toString('base64');
      if (f.mimetype === 'application/pdf') {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } });
      } else if (typeof f.mimetype === 'string' && f.mimetype.startsWith('image/')) {
        content.push({ type: 'image', source: { type: 'base64', media_type: f.mimetype, data } });
      }
    }

    const empty = { segments: [], flightReservation: 'none', hotelReservation: 'none' };
    if (content.length === 0) return empty;

    content.push({ type: 'text', text: 'Extract the travel segments and reservation status from these documents as JSON.' });

    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: buildParseSystemPrompt(),
        messages: [{ role: 'user', content }],
      });
      const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      const parsed = extractJson(text);
      if (!parsed) return empty;
      return {
        segments: Array.isArray(parsed.segments) ? parsed.segments : [],
        flightReservation: parsed.flightReservation,
        hotelReservation: parsed.hotelReservation,
      };
    } catch (err) {
      logger.warn('[itineraries] Document parse failed', { error: err.message });
      return empty;
    }
  }

  return { generate, chat, parseDocuments };
}
