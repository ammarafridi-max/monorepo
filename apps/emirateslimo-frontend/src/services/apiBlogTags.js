import { apiFetch } from './apiClient';

const URL = '/api/blog-tags';

export async function getBlogTagsApi(search = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const query = params.toString();
  return await apiFetch(query ? `${URL}?${query}` : URL);
}

export async function getBlogTagApi(id) {
  return await apiFetch(`${URL}/${id}`);
}

export async function getBlogTagBySlugApi(slug) {
  return await apiFetch(`${URL}/slug/${encodeURIComponent(slug)}`);
}

export async function createBlogTagApi(tagData) {
  return await apiFetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tagData),
  });
}

export async function updateBlogTagApi(id, tagData) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tagData),
  });
}

export async function deleteBlogTagApi(id) {
  return await apiFetch(`${URL}/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateBlogTagApi(id) {
  return await apiFetch(`${URL}/${id}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}
