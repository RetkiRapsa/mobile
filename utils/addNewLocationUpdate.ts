import supabase from './supabaseClient';

export async function addNewLocationUpdate({
  locationId,
  comment,
  available,
  ticks,
}: {
  locationId: string;
  comment: string;
  available: boolean;
  ticks: boolean;
}) {
  const { data, error } = await supabase.rpc('create_new_location_update', {
    location_id: locationId,
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
