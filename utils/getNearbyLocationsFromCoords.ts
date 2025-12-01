import Location from '@/types/Location';

import { apiGetNearbyLocations } from './client';

export default async function getNearbyLocationsFromCoords(
  latitude: number,
  longitude: number,
  radiusInMeters: number = 100 * 1000,
  limit: number = 1000
) {
  const { data } = await apiGetNearbyLocations(latitude, longitude, radiusInMeters, limit);
  return data;
}

export const hasNearbyLocations = (
  locations: Location[],
  lat: number,
  lng: number,
  distance: number = 10
) => {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  return locations.some(
    (location) =>
      location.latitude !== undefined &&
      location.longitude !== undefined &&
      getDistance(lat, lng, location.latitude, location.longitude) <= distance
  );
};

export const isTooFarFromLocation = (
  location: Location,
  lat: number,
  lng: number,
  maxDistanceFromLocation: number = 100
): boolean => {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  if (location.latitude === undefined || location.longitude === undefined) return true;
  return getDistance(lat, lng, location.latitude, location.longitude) > maxDistanceFromLocation;
};
