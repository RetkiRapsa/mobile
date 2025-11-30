import supabase from './supabaseClient';

export default async function createNewUpdate({
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
  const { data, error } = await supabase.rpc('create_new_location_update', {
    p_location_id: locationId,
    p_update_text: updateText,
    p_available: available,
    p_ticks: ticks,
    p_device: device,
  });

  if (error) {
    console.error('Error from Supabase:', error);
    throw error;
  }

  return data;
}
