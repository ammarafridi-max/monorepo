const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

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

// A 404 on an ISR route gets cached, so only swallow genuine 404s and let other errors throw.
export function nullOn404(error) {
  if (error?.status === 404) return null;
  throw error;
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

export async function apiFetchPublic(path, options = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
    signal: options.signal ?? AbortSignal.timeout(8000),
  });

  await checkError(res);
  return await returnData(res);
}

export async function apiFetchBlob(path, options = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: { ...(options.headers || {}) },
    credentials: 'include',
  });
  await checkError(res);
  return await res.blob();
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
