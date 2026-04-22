import { BACKEND } from "@/config";
import { apiFetch } from "./apiClient";

export async function loginApi(credentials) {
  return await apiFetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
}

export async function getMeApi() {
  return await apiFetch("/api/users/me");
}

export async function getAdminMeApi() {
  return await apiFetch("/api/admin-users/me");
}

export async function exchangeOAuthSessionApi() {
  const tokenRes = await fetch("/api/auth/oauth-token", {
    credentials: "include",
  });

  if (!tokenRes.ok) {
    let message = "Could not prepare sign-in session";
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
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let message = "Could not complete sign-in";
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

export async function logoutUserSessionApi() {
  const res = await fetch(`${BACKEND}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    let message = "Could not sign out";
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
