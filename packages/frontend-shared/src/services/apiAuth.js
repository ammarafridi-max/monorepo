import { apiFetch } from './apiClient.js';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function loginApi(credentials) {
  return await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
}

/** Admin panel auth — /api/admin-users/me */
export async function getAdminMeApi() {
  return await apiFetch('/api/admin-users/me');
}

/** Alias kept for backward compatibility */
export async function getMeApi() {
  return await getAdminMeApi();
}

/** Public user auth (travelshield) — /api/users/me */
export async function getUserMeApi() {
  return await apiFetch('/api/users/me');
}

/** Exchange NextAuth OAuth token for a backend cookie session (travelshield) */
export async function exchangeOAuthSessionApi() {
  const tokenRes = await fetch('/api/auth/oauth-token', {
    credentials: 'include',
  });

  if (!tokenRes.ok) {
    let message = 'Could not prepare sign-in session';
    try {
      const json = await tokenRes.json();
      message = json.message || message;
    } catch (error) {
      void error;
    }
    throw new Error(message);
  }

  const { token } = await tokenRes.json();

  const res = await fetch(`${BACKEND}/api/users/oauth-login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let message = 'Could not complete sign-in';
    try {
      const json = await res.json();
      message = json.message || message;
    } catch (error) {
      void error;
    }
    throw new Error(message);
  }

  const json = await res.json();
  return json.data || null;
}

/** Logout user session (travelshield) */
export async function logoutUserSessionApi() {
  const res = await fetch(`${BACKEND}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    let message = 'Could not sign out';
    try {
      const json = await res.json();
      message = json.message || message;
    } catch (error) {
      void error;
    }
    throw new Error(message);
  }

  return true;
}
