import { apiFetch, apiFetchPublic } from './apiClient.js';

const URL = `/api/visa-leads`;

export function createVisaLeadApi(data) {
  return apiFetchPublic(`${URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function getAdminVisaLeadsApi({
  page = 1,
  limit = 20,
  status,
  visaSlug,
  nationality,
  assignedTo,
  dateFrom,
  dateTo,
  search,
} = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status && status !== 'all')       params.append('status', status);
  if (visaSlug && visaSlug !== 'all')   params.append('visaSlug', visaSlug);
  if (nationality && nationality !== 'all') params.append('nationality', nationality);
  if (assignedTo)                        params.append('assignedTo', assignedTo);
  if (dateFrom)                          params.append('dateFrom', dateFrom);
  if (dateTo)                            params.append('dateTo', dateTo);
  if (search)                            params.append('search', search);
  return apiFetch(`${URL}/admin/list?${params.toString()}`);
}

export function getVisaLeadByIdApi(id) {
  return apiFetch(`${URL}/${id}`);
}

export function updateVisaLeadStatusApi(id, status) {
  return apiFetch(`${URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function assignVisaLeadApi(id, assignedTo) {
  return apiFetch(`${URL}/${id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignedTo }),
  });
}

export function addVisaLeadNoteApi(id, text) {
  return apiFetch(`${URL}/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export function deleteVisaLeadApi(id) {
  return apiFetch(`${URL}/${id}`, { method: 'DELETE' });
}
