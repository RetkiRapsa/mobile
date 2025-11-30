import supabase from './supabaseClient';

export default async function createNewUpdate({
  spotId,
  updateText,
  available,
  ticks,
  device,
}: {
  spotId: string;
  updateText: string;
  available: boolean;
  ticks: boolean;
  device: string;
}) {
  const { data, error } = await supabase.rpc('create_new_spot_update', {
    p_spot_id: spotId,
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
