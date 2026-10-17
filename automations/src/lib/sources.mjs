import Anthropic from "@anthropic-ai/sdk";
import { isCitationUrl, findDeadCitations } from "./blog-utils.mjs";


const SEARCH_TOOL = "web_search_20260209";
const MAX_USES = 4;
const MAX_RESUMES = 1;
const BUDGET_MS = 3 * 60 * 1000;

export async function gatherSources({ apiKey, model, topic, brand, maxUses = MAX_USES }) {
  const domains = brand.citationDomains ?? [];
  if (!apiKey || domains.length === 0) return [];

  const client = new Anthropic({ apiKey, maxRetries: 2 });
  const deadline = Date.now() + BUDGET_MS;

  const prompt =
    `Find the official source pages a writer would cite for this article:\n\n` +
    `"${topic.title}"\n\n` +
    `Audience: UAE residents. Search only the official government and visa-operator ` +
    `sites available to you. Return between 4 and 8 pages that are directly relevant.\n\n` +
    `Reply with ONLY a plain list, one per line, formatted exactly as:\n` +
    `<url> — <what this page states>\n\n` +
    `No preamble, no numbering, no markdown. Every URL must be one you actually ` +
    `opened in search results, never one you remember.`;

  const messages = [{ role: "user", content: prompt }];
  let response = null;
  let searches = 0;
  let aborted = false;
  const results = new Map();

  try {
    for (let resume = 0; resume <= MAX_RESUMES; resume++) {
      if (Date.now() > deadline || searches >= maxUses) break;
      const stream = client.messages.stream(
        {
          model,
          max_tokens: 4000,
          tools: [
            {
              type: SEARCH_TOOL,
              name: "web_search",
              max_uses: maxUses,
              allowed_domains: domains,
            },
          ],
          messages,
        },
        { timeout: Math.max(60_000, deadline - Date.now()) },
      );
      const cutoff = setTimeout(() => { aborted = true; stream.abort(); }, deadline - Date.now());
      stream.on("contentBlock", (block) => {
        if (block.type === "server_tool_use") {
          searches++;
          if (searches > maxUses) { aborted = true; stream.abort(); }
        }
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) {
            if (r.type === "web_search_result" && r.url && !results.has(r.url)) results.set(r.url, r.title ?? "");
          }
        }
      });
      try {
        response = await stream.finalMessage();
      } catch (err) {
        if (!(err instanceof Anthropic.APIUserAbortError)) throw err;
        response = null;
        break;
      } finally {
        clearTimeout(cutoff);
      }

      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }
  } catch (err) {
    console.warn(`⚠  Source search unavailable (${err.message}) — the model will cite from memory`);
    return [];
  }
  if (aborted) {
    console.warn(`⚠  Source search cut off after ${searches} search(es) — using the ${results.size} result(s) it returned`);
  }

  const text = (response?.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  if (response) {
    const usage = response.usage ?? {};
    console.log(
      `  source search: ${searches} search(es), ${usage.input_tokens ?? 0} in / ${usage.output_tokens ?? 0} out`,
    );
  }

  const found = [];
  const seen = new Set();
  const add = (url, note) => {
    if (seen.has(url) || !isCitationUrl(url, brand)) return;
    seen.add(url);
    found.push({ url, note });
  };
  for (const line of text.split("\n")) {
    const m = line.match(/https?:\/\/[^\s)<>"']+/);
    if (!m) continue;
    const url = m[0].replace(/[.,;]+$/, "");
    add(url, line.slice(m.index + url.length).replace(/^\s*[—-]\s*/, "").trim());
  }
  for (const [url, title] of results) {
    if (found.length >= 8) break;
    add(url, title);
  }

  if (!found.length) {
    console.warn("⚠  Source search returned no usable URLs — the model will cite from memory");
    return [];
  }

  const dead = new Set((await findDeadCitations(found.map((f) => f.url))).map((d) => d.url));
  const live = found.filter((f) => !dead.has(f.url));
  console.log(`✓ ${live.length} live official source(s) found${dead.size ? `, ${dead.size} discarded as dead` : ""}`);
  return live;
}

export function formatSourcesBlock(sources) {
  if (!sources.length) return "";
  return (
    `\n\n## Verified sources\n\n` +
    `These pages were retrieved and confirmed to exist just now. Cite ONLY from this ` +
    `list. Do not invent a URL, do not guess a deeper path on these domains, and do ` +
    `not cite a page that is not listed here.\n\n` +
    sources.map((s) => `- ${s.url}${s.note ? ` — ${s.note}` : ""}`).join("\n")
  );
}
