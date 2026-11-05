import { apiFetch, apiFetchEnvelope } from './apiClient.js';
import { getAttribution } from '../utils/attribution.js';

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
      attribution: getAttribution(),
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
  fbp,
  fbc,
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
      fbp,
      fbc,
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
    const json = await apiFetchEnvelope(`${URL}?${queryString}`, {
      errorMessage: 'Error fetching data',
    });

    return {
      data: Array.isArray(json?.data) ? json.data : [],
      pagination: json?.pagination || emptyResponse.pagination,
    };
  } catch (err) {
    if (err instanceof TypeError || err instanceof SyntaxError) return emptyResponse;
    if ([502, 503, 504].includes(err?.status)) return emptyResponse;
    throw err;
  }
}

export async function getInsuranceApplicationsSummaryApi(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return await apiFetch(`${URL}/summary${queryString ? `?${queryString}` : ''}`);
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

export async function resendPolicyEmailApi(sessionId) {
  return await apiFetch(`${URL}/${sessionId}/resend-policy-email`, { method: 'POST' });
}
