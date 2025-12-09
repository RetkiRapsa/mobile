import { apiCreateLocationUpdate } from './client';

export async function createLocationUpdate({
  locationId,
  updateText,
  available,
  ticks,
  device,
  username,
}: {
  locationId: string;
  updateText: string;
  available: boolean;
  ticks: boolean;
  device: string;
  username: string | null;
}) {
  const { data } = await apiCreateLocationUpdate(locationId, {
    updateText,
    available,
    ticks,
    device,
    username,
  });

  return data;
}
