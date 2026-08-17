/**
 * Fact-check pass.
 *
 * The draft is written from a site-context file and the model's own knowledge,
 * neither of which is a source. This pass re-reads the official pages the draft
 * cites and checks each factual claim against what those pages actually say.
 *
 * It uses the Anthropic web_fetch server tool, which will only fetch URLs
 * already present in the conversation — so the model cannot wander off and
 * "verify" a claim against something it found later.
 */

import Anthropic from "@anthropic-ai/sdk";

/**
 * The verify pass is the last step before publishing, so a transient 429/5xx
 * here would waste the whole generation. Back off and try again.
 */
async function withRetry(fn, attempts = 4) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = [429, 500, 502, 503, 529].includes(err?.status);
      if (!retryable || i === attempts) throw err;
      const wait = i * 20_000;
      console.warn(`⚠  Fact-check API ${err.status} — retrying in ${wait / 1000}s (${i}/${attempts - 1})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/** Dynamic filtering is built into this version; do not also declare code_execution. */
const WEB_FETCH_TOOL = {
  type: "web_fetch_20260209",
  name: "web_fetch",
  max_uses: 12,
};

const SYSTEM = `You are a fact-checker for a visa advice publisher. Visa advice is YMYL content: a wrong fee, timeline, or eligibility rule costs a reader money or a refused application.

You will receive a draft article and the official source URLs it cites. Fetch those sources and check the draft's factual claims against them.

A factual claim is anything checkable: a fee, a processing time, a validity period, a document requirement, an eligibility rule, a named form or paragraph, an office or visa centre, a legal reference.

Do NOT treat these as claims to verify: the publisher's own service descriptions and prices, marketing copy, general advice ("apply early"), or anything about the publisher's own packages.

For each claim return one verdict:
- "supported"   — a fetched source states this, or states something it follows from directly
- "contradicted" — a fetched source states something different
- "unsupported" — no fetched source addresses it either way

Be strict. If a source does not actually say it, the verdict is "unsupported" even when the claim sounds plausible. Quote the supporting sentence from the source in "evidence"; leave it empty when unsupported.

Return ONLY a JSON object, no code fences, no commentary:
{"claims":[{"claim":"...","sourceUrl":"...","verdict":"supported|contradicted|unsupported","evidence":"..."}]}`;

/**
 * With server tools the model narrates between fetches, so the response is
 * several text blocks and only the last one is the verdict. Take that, then
 * fall back to the widest brace-delimited span across the whole response.
 */
function parseVerdict(blocks) {
  const texts = blocks.filter((b) => b.type === "text").map((b) => b.text.trim()).filter(Boolean);
  const strip = (t) =>
    t.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  const candidates = [];
  if (texts.length) candidates.push(strip(texts[texts.length - 1]));
  const joined = strip(texts.join("\n"));
  const first = joined.indexOf("{");
  const last = joined.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(joined.slice(first, last + 1));

  for (const c of candidates) {
    try {
      const obj = JSON.parse(c);
      if (Array.isArray(obj?.claims)) return obj;
    } catch {
      // try the next candidate
    }
  }
  throw new Error(
    `Fact-checker returned no parseable verdict. Last block began: ${(texts.at(-1) ?? "").slice(0, 300)}`,
  );
}

/**
 * @returns {{claims: Array, contradicted: Array, unsupported: Array, supported: Array}}
 */
export async function verifyDraft({ apiKey, model, title, content, citations, maxTokens = 8000 }) {
  if (!citations.length) {
    throw new Error("Nothing to verify against: the draft cites no official sources.");
  }

  // Reading a dozen government pages routinely runs past the SDK's 10-minute
  // default, and a timeout here throws away a whole generation.
  const client = new Anthropic({ apiKey, timeout: 20 * 60 * 1000, maxRetries: 3 });

  const userPrompt = `Article title: ${title}

Cited official sources (fetch each one):
${citations.map((u, i) => `${i + 1}. ${u}`).join("\n")}

--- DRAFT ---
${content}
--- END DRAFT ---

Fetch the sources above, then return the JSON verdict object.`;

  const messages = [{ role: "user", content: userPrompt }];
  let response;

  // The server-side tool loop can stop early with pause_turn; re-send to resume.
  for (let turn = 0; turn < 6; turn++) {
    response = await withRetry(() =>
      client.messages.create({
        model,
        max_tokens: maxTokens,
        system: SYSTEM,
        tools: [WEB_FETCH_TOOL],
        messages,
      }),
    );
    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content });
  }

  const parsed = parseVerdict(response.content);

  const claims = parsed.claims ?? [];
  const by = (v) => claims.filter((c) => c.verdict === v);
  return {
    claims,
    supported: by("supported"),
    contradicted: by("contradicted"),
    unsupported: by("unsupported"),
  };
}

/**
 * A contradicted claim is always fatal. A few unsupported claims are normal
 * (not everything true is written on a government page), but a draft that is
 * mostly unsupported is one the model made up.
 */
export function assertVerification(result, { maxUnsupportedRatio = 0.25 } = {}) {
  const total = result.claims.length;
  console.log(
    `Fact check: ${result.supported.length} supported, ${result.unsupported.length} unsupported, ${result.contradicted.length} contradicted (${total} claims)`,
  );

  for (const c of result.contradicted) {
    console.error(`  ✗ CONTRADICTED: ${c.claim}`);
    console.error(`    source says: ${c.evidence}`);
  }
  for (const c of result.unsupported) {
    console.warn(`  ? unsupported: ${c.claim}`);
  }

  if (result.contradicted.length) {
    throw new Error(
      `${result.contradicted.length} claim(s) contradicted by the official source. Not publishing.`,
    );
  }
  if (total === 0) {
    throw new Error("Fact-checker found no checkable claims — the draft is probably too vague to publish.");
  }
  const ratio = result.unsupported.length / total;
  if (ratio > maxUnsupportedRatio) {
    throw new Error(
      `${Math.round(ratio * 100)}% of claims are unsupported by any cited source (limit ${Math.round(
        maxUnsupportedRatio * 100,
      )}%). Not publishing.`,
    );
  }
}
