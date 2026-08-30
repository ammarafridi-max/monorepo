import 'server-only';
import { cookies } from 'next/headers';

/**
 * Hand-rolled OAuth 2.0 / OIDC sign-in for Google, Facebook, and LinkedIn, in the
 * same minimal style as the rest of the auth layer (no NextAuth adapter owning its
 * own collections). A successful flow upserts the same User and issues the same
 * jose session cookie as email + password; social login is just another way in.
 *
 * One code path for all three: after the token exchange we call the provider's
 * userinfo endpoint with the access token to read the email. That avoids having to
 * verify an id_token JWT signature, and every provider here exposes an email there.
 */

export const STATE_COOKIE = 'picturesk_oauth_state';

const PROVIDERS = {
  google: {
    label: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userinfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    idEnv: 'GOOGLE_CLIENT_ID',
    secretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  facebook: {
    label: 'Facebook',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    userinfoUrl: 'https://graph.facebook.com/me?fields=email',
    scope: 'email',
    idEnv: 'FACEBOOK_CLIENT_ID',
    secretEnv: 'FACEBOOK_CLIENT_SECRET',
  },
  linkedin: {
    // Uses "Sign In with LinkedIn using OpenID Connect".
    label: 'LinkedIn',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userinfoUrl: 'https://api.linkedin.com/v2/userinfo',
    scope: 'openid email profile',
    idEnv: 'LINKEDIN_CLIENT_ID',
    secretEnv: 'LINKEDIN_CLIENT_SECRET',
  },
};

function creds(p) {
  return { clientId: process.env[p.idEnv], clientSecret: process.env[p.secretEnv] };
}

export function getProvider(name) {
  return PROVIDERS[name] || null;
}

/** A provider is offered only when BOTH its id and secret are configured. */
export function isConfigured(name) {
  const p = PROVIDERS[name];
  if (!p) return false;
  const { clientId, clientSecret } = creds(p);
  return Boolean(clientId && clientSecret);
}

/** The providers we can actually offer, for the login/signup UI. */
export function configuredProviders() {
  return Object.entries(PROVIDERS)
    .filter(([name]) => isConfigured(name))
    .map(([name, p]) => ({ name, label: p.label }));
}

function baseUrl(req) {
  return (process.env.WEB_BASE_URL || new URL(req.url).origin).replace(/\/+$/, '');
}

/** The exact redirect_uri to register with the provider and reuse on callback. */
export function redirectUri(req, name) {
  return `${baseUrl(req)}/api/auth/oauth/${name}/callback`;
}

export function authorizeUrl(name, state, redirect) {
  const p = PROVIDERS[name];
  const { clientId } = creds(p);
  const u = new URL(p.authUrl);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', redirect);
  u.searchParams.set('scope', p.scope);
  u.searchParams.set('state', state);
  return u.toString();
}

/**
 * Exchange the authorization code for an access token, then read the account
 * email from the provider's userinfo endpoint. Throws on any failure so the
 * caller can fail closed (no session).
 */
export async function exchangeCodeForEmail(name, code, redirect) {
  const p = PROVIDERS[name];
  const { clientId, clientSecret } = creds(p);

  const tokenRes = await fetch(p.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!tokenRes.ok) throw new Error(`[oauth] ${name} token exchange failed: ${tokenRes.status}`);
  const accessToken = (await tokenRes.json()).access_token;
  if (!accessToken) throw new Error(`[oauth] ${name} returned no access token`);

  const infoRes = await fetch(p.userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!infoRes.ok) throw new Error(`[oauth] ${name} userinfo failed: ${infoRes.status}`);
  const email = (await infoRes.json()).email;
  if (!email) throw new Error(`[oauth] ${name} did not return an email`);
  return email;
}

/** Read the one-time CSRF state cookie and clear it (call once, on callback). */
export function readAndClearStateCookie() {
  const jar = cookies();
  const value = jar.get(STATE_COOKIE)?.value || null;
  jar.delete(STATE_COOKIE);
  return value;
}
