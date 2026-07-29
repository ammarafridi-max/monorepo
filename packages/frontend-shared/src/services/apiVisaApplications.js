import { apiFetch, apiUpload, apiFetchBlob } from './apiClient.js';

const URL = '/api/visa-applications';
const USERS = '/api/users';

// ---- Customer auth (magic link) --------------------------------------------
export function requestMagicLinkApi(email) {
  return apiFetch(`${USERS}/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export function getCurrentUserApi() {
  return apiFetch(`${USERS}/me`);
}

export function logoutUserApi() {
  return apiFetch(`${USERS}/logout`, { method: 'POST' });
}

// ---- Customer applications --------------------------------------------------
export function getMyApplicationsApi() {
  return apiFetch(`${URL}/mine`);
}

export function getApplicationByRefApi(applicationRef) {
  return apiFetch(`${URL}/${encodeURIComponent(applicationRef)}`);
}

export function updateApplicationProfileApi({ applicationRef, patch }) {
  return apiFetch(`${URL}/${encodeURIComponent(applicationRef)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export function updateApplicantApi({ applicationRef, applicantId, patch }) {
  return apiFetch(`${URL}/${encodeURIComponent(applicationRef)}/applicants/${applicantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

// Customer uploads a file into one of THEIR CUSTOMER-source checklist rows (by row id).
export function uploadDocumentApi({ applicationRef, applicantId, documentId, file }) {
  const fd = new FormData();
  fd.append('documentId', documentId);
  fd.append('document', file);
  return apiUpload(`${URL}/${encodeURIComponent(applicationRef)}/applicants/${applicantId}/documents`, fd, 'POST');
}

// Returns { url, expiresInSeconds, filename, mimeType, version }
// `version` (optional) requests a historical version instead of the current file.
export function getDocumentViewUrlApi(documentId, version) {
  const qs = version != null ? `?version=${encodeURIComponent(version)}` : '';
  return apiFetch(`${URL}/documents/${documentId}/view${qs}`);
}

// ---- Admin ------------------------------------------------------------------
export function adminListApplicationsApi({ page = 1, limit = 20, status, assignedTo, search, queue } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  if (assignedTo) params.append('assignedTo', assignedTo);
  if (search) params.append('search', search);
  if (queue && queue !== 'all') params.append('queue', queue);
  return apiFetch(`${URL}/admin/list?${params.toString()}`);
}

export function adminCreateApplicationApi(body) {
  return apiFetch(`${URL}/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function adminGetApplicationApi(id) {
  return apiFetch(`${URL}/admin/${id}`);
}

export function adminUpdateApplicationApi({ id, patch }) {
  return apiFetch(`${URL}/admin/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export function adminAddApplicantApi({ id, data }) {
  return apiFetch(`${URL}/admin/${id}/applicants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function adminUpdateApplicantApi({ id, applicantId, patch }) {
  return apiFetch(`${URL}/admin/${id}/applicants/${applicantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export function adminReviewDocumentApi({ documentId, decision, rejectionReason }) {
  return apiFetch(`${URL}/admin/documents/${documentId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, rejectionReason }),
  });
}

export function adminGetDocumentViewUrlApi(documentId, version) {
  const qs = version != null ? `?version=${encodeURIComponent(version)}` : '';
  return apiFetch(`${URL}/admin/documents/${documentId}/view${qs}`);
}

// Streams the document inline (admin) and returns a Blob to render in-place —
// no download to disk. Optional historical `version`.
export function adminGetDocumentStreamBlobApi(documentId, version) {
  const qs = version != null ? `?version=${encodeURIComponent(version)}` : '';
  return apiFetchBlob(`${URL}/admin/documents/${documentId}/stream${qs}`);
}

// Manual reminder sweep (admin). `dryRun` reports without sending.
export function adminRunRemindersApi({ dryRun = false } = {}) {
  return apiFetch(`${URL}/admin/reminders/run${dryRun ? '?dryRun=1' : ''}`, { method: 'POST' });
}

export function adminAddNoteApi({ id, text }) {
  return apiFetch(`${URL}/admin/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

// ---- Admin document-level actions -------------------------------------------
export function adminUploadDocumentApi({ documentId, file }) {
  const fd = new FormData();
  fd.append('document', file);
  return apiUpload(`${URL}/admin/documents/${documentId}/upload`, fd, 'POST');
}

export function adminMarkInPersonApi({ documentId, note }) {
  return apiFetch(`${URL}/admin/documents/${documentId}/mark-in-person`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }),
  });
}

export function adminLinkSatisfiedByApi({ documentId, sourceDocumentId }) {
  return apiFetch(`${URL}/admin/documents/${documentId}/satisfied-by`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceDocumentId }),
  });
}

export function adminAddDocumentRowApi({ id, applicantId, docTypeKey }) {
  return apiFetch(`${URL}/admin/${id}/applicants/${applicantId}/documents`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docTypeKey }),
  });
}

export function adminRemoveDocumentRowApi({ documentId }) {
  return apiFetch(`${URL}/admin/documents/${documentId}`, { method: 'DELETE' });
}

// ---- Admin registry (document types + templates) ----------------------------
export function listDocumentTypesApi() {
  return apiFetch(`${URL}/admin/document-types`);
}
export function createDocumentTypeApi(body) {
  return apiFetch(`${URL}/admin/document-types`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export function updateDocumentTypeApi({ id, patch }) {
  return apiFetch(`${URL}/admin/document-types/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
}
export function listTemplatesApi() {
  return apiFetch(`${URL}/admin/templates`);
}
export function getTemplateApi(id) {
  return apiFetch(`${URL}/admin/templates/${id}`);
}
export function upsertTemplateApi(body) {
  return apiFetch(`${URL}/admin/templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export function previewTemplateApi(rules) {
  return apiFetch(`${URL}/admin/templates/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules }) });
}
export function updateTemplateApi({ id, patch }) {
  return apiFetch(`${URL}/admin/templates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
}
