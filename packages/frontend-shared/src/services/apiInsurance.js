import { apiFetch } from './apiClient.js';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const URL = `/api/insurance`;

export async function getNationalities() {
  return await apiFetch(`${URL}/nationalities`);
}

export async function getQuotesApi({ journeyType, startDate, endDate, region, quantity }) {
  return await apiFetch(`${URL}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ journeyType, startDate, endDate, region, quantity }),
  });
}

export async function createInsuranceApplicationApi({
  sessionId,
  quoteId,
  schemeId,
  journeyType,
  startDate,
  endDate,
  region,
  quantity,
  passengers,
  email,
  mobile,
  streetAddress,
  addressLine2,
  city,
  country,
}) {
  return await apiFetch(`${URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      quoteId,
      schemeId,
      journeyType,
      startDate,
      endDate,
      region,
      quantity,
      passengers,
      email,
      mobile,
      streetAddress,
      addressLine2,
      city,
      country,
    }),
  });
}

export async function finalizeInsuranceApi({
  sessionId,
  quoteId,
  schemeId,
  journeyType,
  startDate,
  endDate,
  region,
  quantity,
  passengers,
  email,
  mobile,
  streetAddress,
  addressLine2,
  city,
  country,
  currency,
}) {
  return await apiFetch(`${URL}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      quoteId,
      schemeId,
      journeyType,
      startDate,
      endDate,
      region,
      quantity,
      passengers,
      email,
      mobile,
      streetAddress,
      addressLine2,
      city,
      country,
      currency,
    }),
  });
}

export async function getInsuranceApplicationApi(sessionId) {
  return await apiFetch(`${URL}/${sessionId}`);
}

export async function getInsuranceApplicationsApi(params = {}) {
  const emptyResponse = {
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: Math.max(1, parseInt(params.limit, 10) || 100),
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
  const queryString = new URLSearchParams(params).toString();

  try {
    const res = await fetch(`${BACKEND}${URL}?${queryString}`, {
      credentials: 'include',
    });

    if (res.status === 204) return emptyResponse;

    if (!res.ok) {
      let errorMessage = 'Error fetching data';

      try {
        const error = await res.json();
        errorMessage = error.message || errorMessage;
      } catch (err) {
        void err;
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error(errorMessage);
      }

      if ([502, 503, 504].includes(res.status)) {
        return emptyResponse;
      }

      throw new Error(errorMessage);
    }

    try {
      const json = await res.json();
      return {
        data: Array.isArray(json?.data) ? json.data : [],
        pagination: json?.pagination || emptyResponse.pagination,
      };
    } catch (err) {
      void err;
      return emptyResponse;
    }
  } catch (err) {
    if (err instanceof TypeError) return emptyResponse;
    throw err;
  }
}

export async function getInsuranceApplicationsSummaryApi() {
  return await apiFetch(`${URL}/summary`);
}

export async function confirmInsurancePaymentApi(sessionId, paymentSyncToken, paymentStatus = 'PAID') {
  return await apiFetch(`${URL}/confirm-payment/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentSyncToken, paymentStatus }),
  });
}

export async function getInsuranceDocumentsApi(policyId) {
  return await apiFetch(`${URL}/documents/${policyId}`);
}

export async function downloadInsurancePolicyApi(policyOrPayload, index = 0) {
  const policyId = typeof policyOrPayload === 'object' ? policyOrPayload?.policyId : policyOrPayload;
  const docIndex = typeof policyOrPayload === 'object' ? policyOrPayload?.index ?? 0 : index;
  return await apiFetch(`${URL}/download/${policyId}/${docIndex}`);
}

export async function deleteInsuranceApplicationApi(sessionId) {
  return await apiFetch(`${URL}/${sessionId}`, {
    method: 'DELETE',
  });
}

export async function updateInsuranceApplicationApi({ sessionId, paymentStatus }) {
  return await apiFetch(`${URL}/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentStatus }),
  });
}
