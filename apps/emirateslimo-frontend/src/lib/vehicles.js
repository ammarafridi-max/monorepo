import { apiFetchPublic, nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';

// The backend answers 404 when the collection is empty, which is not an error here.
export async function getVehicles() {
  const vehicles = await apiFetchPublic('/api/vehicles', { next: { revalidate: 300 } }).catch(nullOn404);
  return Array.isArray(vehicles) ? vehicles : vehicles?.vehicles || [];
}
