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

    // Log network errors for debugging
    if (!error.response) {
      console.error('Network error - no response received:', {
        message: error.message,
        url: originalRequest?.url,
        method: originalRequest?.method,
      });

      // Check if it's a cleartext traffic error
      if (error.message?.includes('Network Error') || error.message?.includes('CLEARTEXT')) {
        console.error('CLEARTEXT HTTP ERROR: Android may be blocking HTTP traffic');
        console.error('Ensure usesCleartextTraffic is enabled in app.json');
        console.error('API URL:', API_BASE);
      }
    }

    // If we get 403 and haven't already retried
    if (error.response?.status === 403 && !originalRequest._retry) {
      if (__DEV__) {
        console.log('Got 403, attempting to refresh token and retry...');
      }
      originalRequest._retry = true;

      try {
        // Clear the old token and get a new one
        await clearToken();
        const newToken = await registerDeviceAndGetToken();

        // Update the request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the request
        if (__DEV__) {
          console.log('Retrying request with new token...');
        }
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
