import { apiFetchPublic, nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';

export async function getVehicles() {
  const vehicles = await apiFetchPublic('/api/vehicles', { next: { revalidate: 300 } }).catch(nullOn404);
  return Array.isArray(vehicles) ? vehicles : vehicles?.vehicles || [];
}
