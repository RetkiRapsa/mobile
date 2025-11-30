import supabase from './supabaseClient';

export default async function createNewSpot({
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
  const { data, error } = await supabase.rpc('create_new_spot', {
    p_name: name,
    p_type: type,
    p_latitude: latitude,
    p_longitude: longitude,
    p_device: device,
  });

  if (error) {
    console.error('Error from Supabase:', error);
    throw error;
  }

  return data;
}
