import { createApiClient } from '../../src/lib/blog-utils.mjs';

const ENDPOINT = '/api/tickets/audience-export';

export async function run({ target, dryRun }) {
  console.log(`Target:   ${target.name} (${target.key})`);
  console.log(`Endpoint: POST ${target.backendUrl}${ENDPOINT}`);

  if (dryRun) {
    console.log('Dry run: no login, no request, nothing built or emailed.');
    return;
  }

  const api = createApiClient(target);
  const token = await api.login();

  const body = await api.apiFetch(ENDPOINT, {
    method: 'POST',
    headers: { Cookie: `jwt=${token}` },
  });

  const data = body?.data ?? {};
  const files = data.files ?? [];

  console.log(`Sent to:  ${data.sentTo ?? '?'}`);
  console.log(`Built at: ${data.generatedAt ?? '?'}`);

  if (files.length === 0) {
    console.log('No audience files were built.');
    return;
  }

  let totalRows = 0;
  for (const f of files) {
    const rows = f.rows ?? 0;
    totalRows += rows;
    console.log(`  ${f.name ?? '(unnamed)'}  ${rows} row(s)`);
  }

  console.log(`Total:    ${files.length} file(s), ${totalRows} row(s)`);
}
