import { BACKEND } from '../config';
import { apiFetch } from './apiClient';

const URL = `/api/blogs`;

export async function getPublishedBlogsApi({ page = 1, limit = 9, tag, author } = {}) {
  return await getAllBlogsApi({ page, limit, status: 'published', tag, author });
}

export async function getAllBlogsApi({ page = 1, limit = 10, status, tag, search, author } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  if (tag) params.append('tag', tag);
  if (search) params.append('search', search);
  if (author) params.append('author', author);

  return apiFetch(`${URL}?${params.toString()}`);
}

export function getBlogBySlugApi(slug) {
  return apiFetch(`${URL}/slug/${encodeURIComponent(slug)}`);
}

export function getBlogByIdApi(id) {
  return fetch(`${BACKEND}${URL}/${id}`, {
    method: 'GET',
    credentials: 'include',
  }).then(async (res) => {
    if (!res.ok) {
      let message = 'Failed to fetch blog';
      try {
        const err = await res.json();
        message = err.message || err.error || message;
      } catch (error) {
        void error;
      }
      throw new Error(message);
    }

    const json = await res.json();
    const payload = json?.data ?? json;
    return payload?.blog ?? payload ?? null;
  });
}

export async function createBlogApi(formData) {
  const res = await fetch(`${BACKEND}${URL}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    let message = 'Failed to create blog';
    try {
      const err = await res.json();
      message = err.message || message;
    } catch (error) {
      void error;
    }
    throw new Error(message);
  }

  const data = await res.json();
  return data?.data ?? null;
}

export function updateBlogApi({ id, blogData }) {
  return apiFetch(`${URL}/${id}`, {
    method: 'PATCH',
    body: blogData,
  });
}

export function deleteBlogApi(id) {
  return apiFetch(`${URL}/${id}`, {
    method: 'DELETE',
  });
}

export function publishBlogApi(id) {
  return apiFetch(`${URL}/${id}/publish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
}

export function duplicateBlogApi(id) {
  return apiFetch(`${URL}/${id}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}
