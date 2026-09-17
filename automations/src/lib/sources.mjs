import Anthropic from "@anthropic-ai/sdk";
import { isCitationUrl, findDeadCitations } from "./blog-utils.mjs";

/**
 * Find real, current official sources for a topic using the web_search server
 * tool, so the writer cites pages that were actually retrieved instead of URLs
 * recalled from training data.
 *
 * This exists because the generator kept inventing plausible canada.ca deep
 * links that 404, losing the whole day's post. Searching is restricted to the
 * target's own citationDomains, so the result can only contain approved
 * official sources, and every URL is checked for life before it is handed on.
 *
 * Deliberately non-fatal: if search is unavailable or finds nothing, the caller
 * carries on and the model cites from memory as it always did. A worse post is
 * better than no post.
 */

const SEARCH_TOOL = "web_search_20260209";
/**
 * Enforced here, not by the API: on 2026-09-11 one response carried 54
 * server_tool_use blocks against max_uses: 4, and the run spent 710k input
 * tokens finding nothing. The stream is aborted the moment the cap is crossed.
 */
const MAX_USES = 4;
/** pause_turn means the server hit its own iteration limit; resume once. */
const MAX_RESUMES = 1;
/** Hard wall-clock budget across every resume. */
const BUDGET_MS = 3 * 60 * 1000;

export async function gatherSources({ apiKey, model, topic, brand, maxUses = MAX_USES }) {
  const domains = brand.citationDomains ?? [];
  if (!apiKey || domains.length === 0) return [];

  // Streamed, and not by preference: the SDK caps a non-streaming request at
  // ten minutes, and this call blew through it on every CI run between
  // 2026-09-01 and 2026-09-03, silently degrading to "cite from memory" — the
  // exact failure mode this function exists to prevent. Streaming removes the
  // cap; the budget below replaces it with one we control.
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
  // Every result the search returned, whether or not the model went on to list
  // it. An aborted search still leaves these to work with.
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
              // The allowlist is enforced at search time, so a forbidden domain
              // cannot reach the draft in the first place.
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
      // Resume by replaying the paused assistant turn. No extra user message:
      // the API sees the trailing server_tool_use block and continues.
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
  // The model's own picks first, with its one-line summaries; then anything
  // else the search surfaced, so a cut-off run still has candidates.
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

  // Never hand on a dead URL: that is the failure this whole step exists to stop.
  const dead = new Set((await findDeadCitations(found.map((f) => f.url))).map((d) => d.url));
  const live = found.filter((f) => !dead.has(f.url));
  console.log(`✓ ${live.length} live official source(s) found${dead.size ? `, ${dead.size} discarded as dead` : ""}`);
  return live;
}

/** The prompt block listing the verified sources the writer may cite. */
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
