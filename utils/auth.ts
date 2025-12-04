import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import getOrCreateUUID from './identity';
import { devLog, logError } from './logger';

const API_IP = process.env.EXPO_PUBLIC_RETKIRAPSA_API_IP || 'localhost';
const API_URL = `http://${API_IP}:8080`;
const TOKEN_KEY = 'retkirapsa_jwt_token';

export async function registerDeviceAndGetToken(): Promise<string> {
  try {
    const deviceId = await getOrCreateUUID();
    devLog('Registering device with ID:', deviceId);

    const response = await axios.post(`${API_URL}/auth/device`, { deviceId });
    const token = response.data.token;

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    devLog('Device registered, token stored');
    return token;
  } catch (error) {
    logError('Failed to register device:', error);
    throw error;
  }
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  devLog('Token cleared from storage');
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
