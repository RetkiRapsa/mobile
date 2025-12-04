import axios from 'axios';

import { clearToken, getValidToken, registerDeviceAndGetToken } from './auth';

const RETKIRAPSA_API_IP = process.env.EXPO_PUBLIC_RETKIRAPSA_API_IP || 'localhost';
const API_BASE = `http://${RETKIRAPSA_API_IP}:8080/api/locations`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token for write operations
api.interceptors.request.use(async (config) => {
  const isWrite =
    config.method === 'post' ||
    config.method === 'put' ||
    config.method === 'delete' ||
    config.method === 'patch';

  if (isWrite) {
    const token = await getValidToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor - handle 403 errors by refreshing token and retrying
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get 403 and haven't already retried
    if (error.response?.status === 403 && !originalRequest._retry) {
      console.log('Got 403, attempting to refresh token and retry...');
      originalRequest._retry = true;

      try {
        // Clear the old token and get a new one
        await clearToken();
        const newToken = await registerDeviceAndGetToken();

        // Update the request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the request
        console.log('Retrying request with new token...');
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const apiGetLocationUpdates = async (id: string, limit = 20) =>
  api.get(`/${id}/updates`, { params: { limit } });

export const apiGetNearbyLocations = async (lat: number, lon: number, distance = 500, limit = 20) =>
  api.get(`/nearby`, {
    params: { lat, lon, distance, limit },
  });

export const apiCreateLocation = async (data: any) => api.post('', data);

export const apiCreateLocationUpdate = async (id: string, data: any) =>
  api.post(`/${id}/updates`, data);
