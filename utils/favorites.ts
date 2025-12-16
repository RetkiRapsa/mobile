import axios from 'axios';

import Location from '@/types/Location';

import { getValidToken } from './auth';
import { devLog } from './logger';

const RETKIRAPSA_API_DOMAIN = process.env.EXPO_PUBLIC_RETKIRAPSA_API_DOMAIN || 'localhost';
const isLocalDevelopment =
  RETKIRAPSA_API_DOMAIN.includes('localhost') ||
  RETKIRAPSA_API_DOMAIN.match(/^\d+\.\d+\.\d+\.\d+/) ||
  RETKIRAPSA_API_DOMAIN.includes('192.168.') ||
  RETKIRAPSA_API_DOMAIN.includes('10.0.');
const protocol = isLocalDevelopment ? 'http' : 'https';
const API_BASE_URL = `${protocol}://${RETKIRAPSA_API_DOMAIN}`;

export async function getFavoriteLocations(): Promise<Location[]> {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_BASE_URL}/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    devLog('Favorites fetched:', response.data);
    return response.data;
  } catch (error) {
    devLog('Error fetching favorites:', error);
    throw error;
  }
}

export async function addFavoriteLocation(locationId: string): Promise<void> {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_BASE_URL}/favorites/${locationId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    devLog('Location added to favorites:', response.data);
  } catch (error) {
    devLog('Error adding favorite:', error);
    throw error;
  }
}

export async function removeFavoriteLocation(locationId: string): Promise<void> {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.delete(`${API_BASE_URL}/favorites/${locationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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

    const response = await axios.get(`${API_BASE_URL}/favorites/${locationId}/check`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    devLog('Favorite check:', response.data);
    return response.data.isFavorite;
  } catch (error) {
    devLog('Error checking favorite:', error);
    return false;
  }
}
