import { apiFetch, apiFetchPublic, apiUpload } from './apiClient.js';

const URL = `/api/visas`;

function buildVisaFormData({ data, file, fileFieldName = 'heroImage' }) {
  const fd = new FormData();

  const scalars = [
    'countryName',
    'slug',
    'excerpt',
    'heroHeadline',
    'heroSubheadline',
    'heroCtaText',
    'finalCtaHeadline',
    'finalCtaText',
    'metaTitle',
    'metaDescription',
  ];

  for (const key of scalars) {
    if (data[key] !== undefined && data[key] !== null) {
      fd.append(key, data[key]);
    }
  }

  if (data.qualifierItems !== undefined) {
    fd.append('qualifierItems', JSON.stringify(data.qualifierItems ?? []));
  }

  if (data.sectionGuides !== undefined) {
    fd.append('sectionGuides', JSON.stringify(data.sectionGuides ?? {}));
  }

  const jsonArrayFields = [
    'packages',
    'processSteps',
    'requirementSections',
    'pricingBreakdown',
    'whyUs',
    'faqs',
  ];

  for (const key of jsonArrayFields) {
    if (data[key] !== undefined) {
      fd.append(key, JSON.stringify(data[key] ?? []));
    }
  }

  if (file) fd.append(fileFieldName, file);

  return fd;
}

export function getPublicVisasApi() {
  return apiFetchPublic(`${URL}`, { next: { revalidate: 300 } });
}

/**
 * Visa pages served in one country, each already resolved for it. Returns only
 * destinations that country has a published overlay for, so a country cannot
 * accidentally advertise a destination nobody has written local detail for.
 */
export function getPublicVisasForResidenceApi(residence) {
  return apiFetchPublic(`${URL}/residence/${encodeURIComponent(residence)}`, {
    next: { revalidate: 300 },
  });
}

/** One page, resolved for a country when `residence` is given. */
export function getPublicVisaForResidenceApi(slug, residence) {
  const qs = residence ? `?residence=${encodeURIComponent(residence)}` : '';
  return apiFetchPublic(`${URL}/slug/${encodeURIComponent(slug)}${qs}`, {
    next: { revalidate: 300 },
  });
}

export function getPublicVisaBySlugApi(slug) {
  return apiFetchPublic(`${URL}/slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300 },
  });
}

export function getAdminVisasApi({ page = 1, limit = 20, status, search } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);
  return apiFetch(`${URL}/admin/list?${params.toString()}`);
}

export function getVisaByIdApi(id) {
  return apiFetch(`${URL}/${id}`);
}

export function createVisaApi({ data, file }) {
  const fd = buildVisaFormData({ data, file, fileFieldName: 'heroImage' });
  return apiUpload(`${URL}`, fd, 'POST');
}

export function updateVisaApi({ id, data, file }) {

  const fd = buildVisaFormData({ data, file, fileFieldName: 'newHeroImage' });
  return apiUpload(`${URL}/${id}`, fd, 'PATCH');
}

export function deleteVisaApi(id) {
  return apiFetch(`${URL}/${id}`, { method: 'DELETE' });
}

export function publishVisaApi(id) {
  return apiFetch(`${URL}/${id}/publish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
}

export function unpublishVisaApi(id) {
  return apiFetch(`${URL}/${id}/unpublish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
}

export function duplicateVisaApi(id) {
  return apiFetch(`${URL}/${id}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Residence overlays ───────────────────────────────────────────────────────
// The country-specific half of a visa page. `null` on any field means "inherit
// from the base" — see the backend's upsertOverlay for why null and not omission.

export function getOverlaysApi({ visaSlug, residence } = {}) {
  const params = new URLSearchParams();
  if (visaSlug) params.append('visaSlug', visaSlug);
  if (residence) params.append('residence', residence);
  const qs = params.toString();
  return apiFetch(`${URL}/overlays/all${qs ? `?${qs}` : ''}`);
}

export function getOverlayApi({ residence, visaSlug }) {
  return apiFetch(
    `${URL}/overlays/${encodeURIComponent(residence)}/${encodeURIComponent(visaSlug)}`,
  );
}

export function upsertOverlayApi(payload) {
  return apiFetch(`${URL}/overlays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteOverlayApi({ residence, visaSlug }) {
  return apiFetch(
    `${URL}/overlays/${encodeURIComponent(residence)}/${encodeURIComponent(visaSlug)}`,
    { method: 'DELETE' },
  );
}
