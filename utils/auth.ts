import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

import getOrCreateUUID from './identity';
import { devLog, logError } from './logger';

const API_DOMAIN = process.env.EXPO_PUBLIC_RETKIRAPSA_API_DOMAIN || 'localhost';
const API_URL = `https://${API_DOMAIN}`;
const TOKEN_KEY = 'retkirapsa_jwt_token';
const REQUEST_TIMEOUT = 15000; // 15 seconds

/**
 * Format axios error for better logging
 */
function formatAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      return `Server error ${axiosError.response.status}: ${JSON.stringify(axiosError.response.data)}`;
    } else if (axiosError.request) {
      return `Network error: No response from server (${axiosError.message})`;
    } else {
      return `Request error: ${axiosError.message}`;
    }
  }
  return String(error);
}

export async function registerDeviceAndGetToken(): Promise<string> {
  try {
    const deviceId = await getOrCreateUUID();
    devLog('Registering device with ID:', deviceId);

    const response = await axios.post(
      `${API_URL}/auth/device`,
      { deviceId },
      { timeout: REQUEST_TIMEOUT }
    );

    if (!response.data?.token) {
      throw new Error('No token received from server');
    }

    const token = response.data.token;

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    devLog('Device registered, token stored');
    return token;
  } catch (error) {
    const errorMessage = formatAxiosError(error);
    logError('Failed to register device:', errorMessage);

    // Re-throw with more user-friendly message
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Palvelimeen yhdistäminen aikakatkaistiin. Tarkista internet-yhteytesi.');
      } else if (!error.response) {
        throw new Error('Ei yhteyttä palvelimeen. Tarkista internet-yhteytesi.');
      } else if (error.response.status >= 500) {
        throw new Error('Palvelinvirhe. Yritä myöhemmin uudelleen.');
      }
    }

    throw error;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    devLog('Token cleared from storage');
  } catch (error) {
    logError('Failed to clear token:', error);
    // Don't throw - clearing token is not critical
  }
}

export async function getValidToken(): Promise<string> {
  try {
    let token = await SecureStore.getItemAsync(TOKEN_KEY);

    if (!token) {
      devLog('No token found, registering device...');
      token = await registerDeviceAndGetToken();
      return token;
    }

    devLog('Using existing token');
    return token;
  } catch (error) {
    logError('Error in getValidToken:', error);
    throw error;
  }
}
