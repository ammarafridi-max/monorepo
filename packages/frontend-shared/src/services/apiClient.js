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
    // Callers need to tell "this record does not exist" apart from "the backend
    // is having a bad day". Without the status they look identical and a blip
    // gets treated as a deletion.
    error.status = res.status;
    throw error;
  }
}

// Turns a genuine 404 into `null` and lets every other failure keep throwing.
//
// Server components use this to decide between notFound() and letting the
// render fail. It matters because a 404 on an ISR route is cached for the
// route's `revalidate` window: swallowing all errors means one brief backend
// outage takes a live, ranking URL out of the index for minutes at a time. A
// thrown error is not cached, so the next request retries.
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

// Fetches a raw binary body (with auth cookies) and returns a Blob — used to
// render private documents inline without exposing a URL or writing to disk.
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
