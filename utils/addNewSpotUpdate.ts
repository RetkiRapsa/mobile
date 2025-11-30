import supabase from './supabaseClient';

export async function addNewSpotUpdate({
  spotId,
  comment,
  available,
  ticks,
}: {
  spotId: string;
  comment: string;
  available: boolean;
  ticks: boolean;
}) {
  const { data, error } = await supabase.rpc('create_new_spot_update', {
    spot_id: spotId,
    comment,
    available,
    ticks,
  });

  if (error) {
    console.error('Error from Supabase:', error);
    throw error;
  }

  return data;
}
