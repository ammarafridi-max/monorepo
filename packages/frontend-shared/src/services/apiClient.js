import { CSRF_HEADER, CSRF_HEADER_VALUE, isStateChangingMethod } from '@travel-suite/utils/csrf';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

// Server-only: never NEXT_PUBLIC_, so it is not inlined into the client bundle.
const internalHeaders = () => {
  const token = typeof window === 'undefined' ? process.env.INTERNAL_API_TOKEN : '';
  return token ? { 'x-internal-token': token } : {};
};

async function checkError(res) {
  if (!res.ok) {
    let message = 'Something went wrong';
    try {
      const json = await res.json();
      message = json.message || json.error || message;
    } catch (error) {
      void error;
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
}

export function nullOn404(error) {
  if (error?.status === 404) return null;
  throw error;
}

async function returnData(res) {
  if (res.status === 204) return null;
  const json = await res.json();
  return json.data || null;
}

export const csrfHeader = (method = 'POST') =>
  isStateChangingMethod(method) ? { [CSRF_HEADER]: CSRF_HEADER_VALUE } : {};

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      ...csrfHeader(options.method ?? 'GET'),
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  await checkError(res);
  return await returnData(res);
}

export async function apiFetchPublic(path, { timeoutMs = 8000, ...options } = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      ...internalHeaders(),
      ...(options.headers || {}),
    },
    signal: options.signal ?? AbortSignal.timeout(timeoutMs),
  });

  await checkError(res);
  return await returnData(res);
}

export async function apiFetchBlob(path, options = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: { ...csrfHeader(options.method ?? 'GET'), ...(options.headers || {}) },
    credentials: 'include',
  });
  await checkError(res);
  return await res.blob();
}

export async function apiUpload(path, formData, method = 'POST') {
  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers: { ...csrfHeader(method) },
    credentials: 'include',
    body: formData,
  });

  await checkError(res);
  return await returnData(res);
}
