import { apiFetch } from './apiClient.js';

export async function getAdminBadgeCountsApi() {
  try {
    return await apiFetch('/api/admin-badges');
  } catch {
    return null;
  }
}
