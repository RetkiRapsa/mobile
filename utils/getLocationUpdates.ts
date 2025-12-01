import { apiGetLocationUpdates } from './client';

export default async function getLocationUpdates(locationId: string, limit: number) {
  const { data } = await apiGetLocationUpdates(locationId, limit);
  return data;
}
