import { apiCreateLocation } from './client';

export default async function createLocation({
  name,
  type,
  latitude,
  longitude,
  device,
  username,
}: {
  name: string;
  type: string;
  latitude: number | undefined;
  longitude: number | undefined;
  device: string;
  username: string | null;
}) {
  const { data } = await apiCreateLocation({
    name,
    type,
    latitude,
    longitude,
    device,
    username,
  });

  return data;
}
