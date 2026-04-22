import { BACKEND } from '@/config';

async function checkError(res) {
  if (!res.ok) {
    let message = 'Something went wrong';
    try {
      const json = await res.json();
      message = json.message || json.error || message;
    } catch (error) {
      void error;
    }
    throw new Error(message);
  }
}

async function returnData(res) {
  if (res.status === 204) return null;
  const json = await res.json();
  return json.data || null;
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  await checkError(res);
  return await returnData(res);
}

// For server-side public reads — no credentials so Next.js data cache works
export async function apiFetchPublic(path, options = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  await checkError(res);
  return await returnData(res);
}

export async function apiUpload(path, formData, method = 'POST') {
  const res = await fetch(`${BACKEND}${path}`, {
    method,
    credentials: 'include',
    body: formData,
  });

  await checkError(res);
  return await returnData(res);
}
