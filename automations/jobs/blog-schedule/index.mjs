
let BASE = '';
let COOKIE = '';
let DRY = true;

const STEP_MS = 86400000; 

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

export async function run({ target, dryRun }) {
  const cookieEnv = `${target.key.toUpperCase()}_COOKIE`;
  BASE = process.env[`${target.key.toUpperCase()}_API`] || target.backendUrl;
  COOKIE = process.env[cookieEnv] || '';
  DRY = dryRun || !process.argv.includes('--apply');

  if (!COOKIE) throw new Error(`${cookieEnv} not set`);

  const settings = target.blogSchedule ?? {};
  const startMs = Date.parse(settings.start ?? '');
  if (Number.isNaN(startMs)) {
    throw new Error(
      `Target "${target.key}" needs blogSchedule.start (an ISO timestamp) to schedule its backlog.`,
    );
  }
  const exclude = new Set(settings.excludeSlugs ?? []);

  console.log(`\n=== schedule-drafts [${DRY ? 'DRY RUN' : 'APPLY'}] ===\n`);

  const [drafts, scheduled] = await Promise.all([fetchAdmin('draft'), fetchAdmin('scheduled')]);
  const basis = [...drafts, ...scheduled]
    .filter((b) => !exclude.has(b.slug))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  console.log(`Basis: ${basis.length} posts (drafts ${drafts.length} + scheduled ${scheduled.length}, excluded ${exclude.size})\n`);

  let changed = 0, skipped = 0;
  for (let i = 0; i < basis.length; i++) {
    const b = basis[i];
    const targetMs = startMs + i * STEP_MS;
    const slot = iso(targetMs);
    const already =
      b.status === 'scheduled' && b.scheduledAt && new Date(b.scheduledAt).toISOString() === slot;
    if (already) {
      skipped++;
      console.log(`  = ${gst(targetMs)}  ${b.slug}  (already scheduled)`);
      continue;
    }
    console.log(`  ${DRY ? '·' : '✓'} ${gst(targetMs)}  ${b.slug}`);
    if (!DRY) {
      await patch(b._id, { status: 'scheduled', scheduledAt: slot });
      await new Promise((r) => setTimeout(r, 1000));
    }
    changed++;
  }
  console.log(`\n=== ${DRY ? 'WOULD SCHEDULE' : 'SCHEDULED'} ${changed}, skipped ${skipped} ===`);
  if (basis.length) console.log(`Window: ${gst(startMs)}  →  ${gst(startMs + (basis.length - 1) * STEP_MS)}`);
}

export default run;
