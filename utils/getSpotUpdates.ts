import supabase from './supabaseClient';

export default async function getSpotUpdates(spotId: string, limit: number = 1000) {
  const { data, error } = await supabase.rpc('get_spot_updates', {
    p_spot_id: spotId,
    p_limit_count: limit,
  });

  if (error) {
    throw error;
  }

  return data;
}
