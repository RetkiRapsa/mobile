import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import getOrCreateUUID from './identity';

const API_IP = process.env.EXPO_PUBLIC_RETKIRAPSA_API_IP || 'localhost';
const API_URL = `http://${API_IP}:8080`;
const TOKEN_KEY = 'retkirapsa_jwt_token';

export async function registerDeviceAndGetToken(): Promise<string> {
  try {
    const deviceId = await getOrCreateUUID();
    if (__DEV__) {
      console.log('Registering device with ID:', deviceId);
    }

    const response = await axios.post(`${API_URL}/auth/device`, { deviceId });
    const token = response.data.token;

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (__DEV__) {
      console.log('Device registered, token stored');
    }
    return token;
  } catch (error) {
    console.error('Failed to register device:', error);
    throw error;
  }
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  if (__DEV__) {
    console.log('Token cleared from storage');
  }
}

export async function getValidToken(): Promise<string> {
  try {
    let token = await SecureStore.getItemAsync(TOKEN_KEY);

    if (!token) {
      if (__DEV__) {
        console.log('No token found, registering device...');
      }
      token = await registerDeviceAndGetToken();
      return token;
    }

    if (__DEV__) {
      console.log('Using existing token');
    }
    return token;
  } catch (error) {
    console.error('Error in getValidToken:', error);
    throw error;
  }
}
