import { apiFetchPublic } from './apiClient.js';

const URL = '/api/admin-users/authors';

export async function getAuthorsApi() {
  return await apiFetchPublic(URL, { next: { revalidate: 3600 } });
}

export async function getAuthorBySlugApi(slug) {
  return await apiFetchPublic(`${URL}/${encodeURIComponent(slug)}`, {
    next: { revalidate: 3600 },
  });
}
