import { apiCreateLocationUpdate } from './client';

export async function createLocationUpdate({
  locationId,
  updateText,
  available,
  ticks,
  device,
}: {
  locationId: string;
  updateText: string;
  available: boolean;
  ticks: boolean;
  device: string;
}) {
  const { data } = await apiCreateLocationUpdate(locationId, {
    updateText,
    available,
    ticks,
    device,
  });

  return data;
}
