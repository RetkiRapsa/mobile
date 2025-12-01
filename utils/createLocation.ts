import { apiCreateLocation } from './client';

export default async function createLocation({
  name,
  type,
  latitude,
  longitude,
  device,
}: {
  name: string;
  type: string;
  latitude: number | undefined;
  longitude: number | undefined;
  device: string;
}) {
  const { data } = await apiCreateLocation({
    name,
    type,
    latitude,
    longitude,
    device,
  });

  return data;
}
