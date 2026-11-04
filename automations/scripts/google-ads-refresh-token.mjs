// Usage: node --env-file=.env.local automations/scripts/google-ads-refresh-token.mjs [--port 8713] [--print]
// Runs the Google OAuth loopback flow against GOOGLE_ADS_CLIENT_ID/SECRET and rewrites
// GOOGLE_ADS_REFRESH_TOKEN in .env.local in place. The token is never printed unless --print.

import { createServer } from 'node:http';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

const SCOPE = 'https://www.googleapis.com/auth/adwords';
const ENV_FILE = resolve(process.cwd(), 'automations/.env.local');
const ENV_KEY = 'GOOGLE_ADS_REFRESH_TOKEN';

function flagValue(name, fallback = null) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : fallback;
}

const PORT = Number(flagValue('port', '8713'));
const PRINT = process.argv.includes('--print');

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET must be set. Run with --env-file=.env.local');
  process.exit(1);
}

const redirectUri = `http://localhost:${PORT}`;
const state = randomBytes(16).toString('hex');
const consentUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

function page(title, detail) {
  return `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="font:16px system-ui;padding:3rem;max-width:34rem">
<h1 style="font-size:1.25rem">${title}</h1><p>${detail}</p></body>`;
}

async function exchange(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.refresh_token) {
    throw new Error(
      `Token exchange failed: ${body.error ?? res.status} ${body.error_description ?? ''}`.trim() +
        (res.ok ? ' (no refresh_token returned: revoke the app under myaccount.google.com/permissions and retry)' : ''),
    );
  }
  return body.refresh_token;
}

async function persist(token) {
  let contents;
  try {
    contents = await readFile(ENV_FILE, 'utf8');
  } catch {
    console.log(`No ${ENV_FILE} to update. Token not saved.`);
    return false;
  }
  const line = `${ENV_KEY}=${token}`;
  const pattern = new RegExp(`^${ENV_KEY}=.*$`, 'm');
  const next = pattern.test(contents)
    ? contents.replace(pattern, line)
    : `${contents.replace(/\n*$/, '\n')}${line}\n`;
  await writeFile(ENV_FILE, next);
  await chmod(ENV_FILE, 0o600);
  return true;
}

console.log(`Listening on ${redirectUri}`);
console.log('\nOpen this URL, pick the Google account that owns the Ads login customer, and approve:\n');
console.log(consentUrl);
console.log('\nWaiting for the redirect... (ctrl-c to abort)');

const server = createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  if (url.pathname !== '/') {
    res.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html' }).end(page('Consent declined', error));
    console.error(`\n✗ ${error}`);
    server.close();
    process.exitCode = 1;
    return;
  }
  if (url.searchParams.get('state') !== state) {
    res.writeHead(400, { 'Content-Type': 'text/html' }).end(page('State mismatch', 'Start the script again.'));
    console.error('\n✗ state mismatch, discarded');
    server.close();
    process.exitCode = 1;
    return;
  }
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' }).end(page('No code', 'Nothing to exchange.'));
    return;
  }

  try {
    const token = await exchange(code);
    const saved = await persist(token);
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(
      page('Done', saved ? 'Refresh token saved. You can close this tab.' : 'Token obtained but not saved; see the terminal.'),
    );
    console.log(`\n✓ refresh token received (${token.length} chars)`);
    if (saved) console.log(`✓ ${ENV_KEY} updated in ${ENV_FILE}`);
    if (PRINT) console.log(`\n${ENV_KEY}=${token}`);
    console.log('\nIf the OAuth client is still in Testing status, this token expires in 7 days.');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' }).end(page('Exchange failed', err.message));
    console.error(`\n✗ ${err.message}`);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(PORT);
