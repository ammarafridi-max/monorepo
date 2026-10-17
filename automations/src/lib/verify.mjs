
import Anthropic from "@anthropic-ai/sdk";

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

const WEB_FETCH_TOOL = {
  type: "web_fetch_20260209",
  name: "web_fetch",
  allowed_callers: ["direct"],
  max_content_tokens: 3000,
  max_uses: 4,
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

function stripTags(html) {
  return (html || "")
    .replace(/<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "$2 [$1]")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildRevisionBrief(result) {
  const lines = [];
  if (result.contradicted.length) {
    lines.push("### Claims the official source CONTRADICTS — these are factually wrong, fix them");
    for (const c of result.contradicted) {
      lines.push(`- Claim: ${c.claim}\n  Source says: ${c.evidence}`);
    }
  }
  if (result.unsupported.length) {
    lines.push(
      "### Claims no cited source supports — for each, either cite an official page that actually states it, or delete the claim",
    );
    for (const c of result.unsupported) lines.push(`- ${c.claim}`);
  }
  return lines.join("\n");
}

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
    }
  }
  throw new Error(
    `Fact-checker returned no parseable verdict. Last block began: ${(texts.at(-1) ?? "").slice(0, 300)}`,
  );
}

export async function verifyDraft({ apiKey, model, title, content, citations, maxTokens = 6000 }) {
  if (!citations.length) {
    throw new Error("Nothing to verify against: the draft cites no official sources.");
  }

  const client = new Anthropic({ apiKey, timeout: 15 * 60 * 1000, maxRetries: 1 });

  const userPrompt = `Article title: ${title}

Cited official sources (fetch each one):
${citations.map((u, i) => `${i + 1}. ${u}`).join("\n")}

--- DRAFT ---
${stripTags(content)}
--- END DRAFT ---

Fetch the sources above, then return the JSON verdict object.`;

  const messages = [
    {
      role: "user",
      content: [{ type: "text", text: userPrompt, cache_control: { type: "ephemeral" } }],
    },
  ];
  let response;
  let containerId;

  for (let turn = 0; turn < 3; turn++) {
    response = await withRetry(async () => {
      const stream = client.messages.stream({
        model,
        max_tokens: maxTokens,
        system: SYSTEM,
        tools: [WEB_FETCH_TOOL],
        messages,
        ...(containerId ? { container: containerId } : {}),
      });
      return stream.finalMessage();
    });
    containerId = response.container?.id ?? containerId;
    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content });
  }

  const u = response.usage ?? {};
  console.log(
    `  tokens: ${u.input_tokens ?? 0} in, ${u.output_tokens ?? 0} out, ` +
      `${u.cache_read_input_tokens ?? 0} cached read, ${u.cache_creation_input_tokens ?? 0} cache write`,
  );

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

export function isClean(result) {
  return result.contradicted.length === 0 && result.unsupported.length === 0;
}

export function needsRevision(result) {
  return result.contradicted.length > 0;
}

export function reportVerification(result) {
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
}

export function assertVerification(result, { strict = false, maxUnsupportedRatio = null } = {}) {
  const total = result.claims.length;
  reportVerification(result);

  if (result.contradicted.length) {
    throw new Error(
      `${result.contradicted.length} claim(s) contradicted by the official source. Not publishing.`,
    );
  }
  if (total === 0) {
    throw new Error("Fact-checker found no checkable claims — the draft is probably too vague to publish.");
  }
  if (strict && result.unsupported.length) {
    throw new Error(
      `${result.unsupported.length} claim(s) still unsupported after revision. Every claim must be cited or cut. Not publishing.`,
    );
  }
  if (maxUnsupportedRatio === null) return;
  const ratio = result.unsupported.length / total;
  if (ratio > maxUnsupportedRatio) {
    throw new Error(
      `${Math.round(ratio * 100)}% of claims are unsupported by any cited source (limit ${Math.round(
        maxUnsupportedRatio * 100,
      )}%). Not publishing.`,
    );
  }
}
