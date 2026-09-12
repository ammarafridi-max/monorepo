/**
 * Usage, from automations/:
 *   node scripts/post-drafts.mjs --target travl --dir <drafts/> --start 2026-09-12T05:00:00Z          # dry run
 *   node scripts/post-drafts.mjs --target travl --dir <drafts/> --start 2026-09-12T05:00:00Z --apply
 *
 * Posts hand-written drafts (one <slug>.json per topic, in the shape
 * blog-generate produces) as scheduled posts, one per day from --start, in
 * topics.json order. Auth is the target's admin JWT in <TARGET>_COOKIE.
 * Env: RECRAFT_API_KEY for cover images (falls back to a placeholder).
 *
 * Idempotent: a topic whose title already exists on the site is skipped.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadTarget } from "../src/registry.mjs";
import { createApiClient, fetchCoverImage } from "../src/lib/blog-utils.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : null;
};
const APPLY = process.argv.includes("--apply");
const STEP_MS = 86400000;

const targetKey = arg("target");
const dir = arg("dir");
const startMs = Date.parse(arg("start") ?? "");
if (!targetKey || !dir || Number.isNaN(startMs)) {
  console.error("Usage: post-drafts.mjs --target <key> --dir <drafts/> --start <ISO> [--apply]");
  process.exit(2);
}

const brand = await loadTarget(targetKey, { job: "blog-generate" });
const api = createApiClient(brand);
const cookieEnv = `${targetKey.toUpperCase()}_COOKIE`;
const raw = process.env[cookieEnv] ?? "";
let token = raw.replace(/^jwt=/, "");
if (!token && process.env[brand.adminEmailEnv]) token = await api.login();
if (!token) {
  console.error(`${cookieEnv} not set, and no ${brand.adminEmailEnv} to log in with`);
  process.exit(2);
}
const existing = await api.fetchExistingTitles(token);
const allTags = await api.fetchBlogTags(token);
const topics = JSON.parse(readFileSync(join(brand.dir, "topics.json"), "utf8"));

const queue = topics.filter((t) => t.slug && existsSync(join(dir, `${t.slug}.json`)));
console.log(`\n=== post-drafts → ${brand.name} [${APPLY ? "APPLY" : "DRY RUN"}] ===\n`);
console.log(`${queue.length} draft(s) found for ${topics.length} topic(s)\n`);

let slot = 0;
for (const topic of queue) {
  if (existing.has(topic.title.trim().toLowerCase())) {
    console.log(`  = already on site        ${topic.slug}`);
    continue;
  }
  const scheduledAt = new Date(startMs + slot * STEP_MS).toISOString();
  slot++;
  console.log(`  ${APPLY ? "✓" : "·"} ${scheduledAt.slice(0, 16)}Z  ${topic.slug}`);
  if (!APPLY) continue;

  const draft = JSON.parse(readFileSync(join(dir, `${topic.slug}.json`), "utf8"));
  const tags = draft.tags.filter((t) => allTags.includes(t));
  const cover = await fetchCoverImage(topic.title, brand);

  const form = new FormData();
  form.append("title", topic.title);
  form.append("slug", topic.slug);
  form.append("content", `${draft.content}\n${draft.ctaBlock}`);
  form.append("excerpt", draft.excerpt);
  form.append("quickAnswer", draft.quickAnswer);
  form.append("metaTitle", draft.metaTitle);
  form.append("metaDescription", draft.metaDescription);
  form.append("status", "scheduled");
  form.append("scheduledAt", scheduledAt);
  form.append("faqs", JSON.stringify(draft.faqs));
  form.append("coverImage", cover, "cover.jpg");
  for (const tag of tags) form.append("tags[]", tag);

  const res = await fetch(`${api.BACKEND_URL}/api/blogs`, {
    method: "POST",
    headers: { Cookie: `jwt=${token}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST ${topic.slug} -> ${res.status} ${JSON.stringify(body)}`);
  const got = body?.data?.slug;
  if (got !== topic.slug) {
    throw new Error(`Requested slug "${topic.slug}" but the post was created as "${got}". Post ${body?.data?._id} needs checking.`);
  }
  console.log(`      posted ${body?.data?._id} → ${brand.adminBlogUrl(body?.data?._id)}`);
}

if (!APPLY) console.log(`\nNothing posted. Re-run with --apply.`);
