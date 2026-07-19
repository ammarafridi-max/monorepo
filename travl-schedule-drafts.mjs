#!/usr/bin/env node
/**
 * travl-schedule-drafts.mjs — schedule backlog draft posts for publishing,
 * one per day at 09:00 Asia/Dubai (05:00 UTC), oldest-created first.
 *
 *   node travl-schedule-drafts.mjs            # dry run (default)
 *   node travl-schedule-drafts.mjs --apply    # PATCH status=scheduled + scheduledAt
 *
 * Auth: export TRAVL_COOKIE="jwt=<admin session>"
 *
 * Idempotent + stable: the ordering basis is every draft/scheduled post (minus
 * exclusions) sorted by createdAt, so slug→date never shifts between runs. A post
 * already scheduled to its intended time is skipped. The CMS auto-flips
 * scheduled→published when the time passes (publishDueScheduledBlogs on any GET).
 */

const BASE = process.env.TRAVL_API || 'https://api.travl.ae';
const COOKIE = process.env.TRAVL_COOKIE || '';
const APPLY = process.argv.includes('--apply');
const DRY = !APPLY;

// --- schedule parameters (confirmed) ---
const START_UTC = Date.UTC(2026, 6, 20, 5, 0, 0); // 2026-07-20 09:00 GST
const STEP_MS = 86400000;                          // one calendar day
const EXCLUDE = new Set([
  'why-you-need-travel-insurance-for-your-schengen-visa-application', // retired duplicate
]);

const iso = (ms) => new Date(ms).toISOString();
const gst = (ms) => new Date(ms + 4 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' GST';

async function fetchAdmin(status) {
  const res = await fetch(`${BASE}/api/blogs/admin/list?status=${status}&limit=1000&page=1`, {
    headers: { Cookie: COOKIE },
  });
  if (!res.ok) throw new Error(`read (${status}) failed: ${res.status} ${await res.text()}`);
  return (await res.json()).data.blogs || [];
}

async function patch(id, body) {
  const res = await fetch(`${BASE}/api/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: COOKIE },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${id} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  if (!COOKIE) throw new Error('TRAVL_COOKIE not set');
  console.log(`\n=== schedule-drafts [${DRY ? 'DRY RUN' : 'APPLY'}] ===\n`);

  // Stable basis: drafts + already-scheduled, minus exclusions, oldest-created first.
  const [drafts, scheduled] = await Promise.all([fetchAdmin('draft'), fetchAdmin('scheduled')]);
  const basis = [...drafts, ...scheduled]
    .filter((b) => !EXCLUDE.has(b.slug))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  console.log(`Basis: ${basis.length} posts (drafts ${drafts.length} + scheduled ${scheduled.length}, excluded ${EXCLUDE.size})\n`);

  let changed = 0, skipped = 0;
  for (let i = 0; i < basis.length; i++) {
    const b = basis[i];
    const targetMs = START_UTC + i * STEP_MS;
    const target = iso(targetMs);
    const already =
      b.status === 'scheduled' && b.scheduledAt && new Date(b.scheduledAt).toISOString() === target;
    if (already) {
      skipped++;
      console.log(`  = ${gst(targetMs)}  ${b.slug}  (already scheduled)`);
      continue;
    }
    console.log(`  ${DRY ? '·' : '✓'} ${gst(targetMs)}  ${b.slug}`);
    if (APPLY) {
      await patch(b._id, { status: 'scheduled', scheduledAt: target });
      await new Promise((r) => setTimeout(r, 1000));
    }
    changed++;
  }
  console.log(`\n=== ${DRY ? 'WOULD SCHEDULE' : 'SCHEDULED'} ${changed}, skipped ${skipped} ===`);
  if (basis.length) console.log(`Window: ${gst(START_UTC)}  →  ${gst(START_UTC + (basis.length - 1) * STEP_MS)}`);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
