import supabase from './supabaseClient';

export default async function getLocationUpdates(locationId: string, limit: number = 1000) {
  const { data, error } = await supabase.rpc('get_location_updates', {
    p_location_id: locationId,
    p_limit_count: limit,
  });

  if (error) {
    throw error;
  }

  return data;
}
