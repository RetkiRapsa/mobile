import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import getOrCreateUUID from './identity';

const API_IP = process.env.EXPO_PUBLIC_RETKIRAPSA_API_IP || 'localhost';
const API_URL = `http://${API_IP}:8080`;
const TOKEN_KEY = 'retkirapsa_jwt_token';

export async function registerDeviceAndGetToken(): Promise<string> {
  const deviceId = await getOrCreateUUID();

  const response = await axios.post(`${API_URL}/auth/device`, { deviceId });
  const token = response.data.token;

  await SecureStore.setItemAsync(TOKEN_KEY, token);
  return token;
}

export async function getValidToken(): Promise<string> {
  let token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) {
    token = await registerDeviceAndGetToken();
  }
  return token;
}
