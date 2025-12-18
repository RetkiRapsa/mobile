import Location from '@/types/Location';

import { getValidToken } from './auth';
import { api } from './client';
import { devLog } from './logger';

export async function getFavoriteLocations(): Promise<Location[]> {
  try {
    const response = await api.get('/favorites');
    devLog('Favorites fetched:', response.data);
    return response.data;
  } catch (error) {
    devLog('Error fetching favorites:', error);
    throw error;
  }
}

export async function addFavoriteLocation(locationId: string): Promise<void> {
  try {
    const response = await api.post(`/favorites/${locationId}`, {});
    devLog('Location added to favorites:', response.data);
  } catch (error) {
    devLog('Error adding favorite:', error);
    throw error;
  }
}

export async function removeFavoriteLocation(locationId: string): Promise<void> {
  try {
    const response = await api.delete(`/favorites/${locationId}`);
    devLog('Location removed from favorites:', response.data);
  } catch (error) {
    devLog('Error removing favorite:', error);
    throw error;
  }
}

export async function checkFavoriteLocation(locationId: string): Promise<boolean> {
  try {
    const token = await getValidToken();
    if (!token) {
      return false;
    }

    const response = await api.get(`/favorites/${locationId}/check`);
    devLog('Favorite check:', response.data);
    return response.data.isFavorite;
  } catch (error) {
    devLog('Error checking favorite:', error);
    return false;
  }
}
