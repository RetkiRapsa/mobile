import axios, { AxiosError } from 'axios';

import { clearToken, getValidToken, registerDeviceAndGetToken } from './auth';
import { devLog, logError } from './logger';

const RETKIRAPSA_API_DOMAIN = process.env.EXPO_PUBLIC_RETKIRAPSA_API_DOMAIN || 'localhost';
const API_URL = `https://${RETKIRAPSA_API_DOMAIN}/locations`;
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: REQUEST_TIMEOUT,
});

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  // Network errors or timeouts are retryable
  if (!error.response) return true;

  // 5xx server errors are retryable
  if (error.response.status >= 500) return true;

  // 429 (too many requests) is retryable
  if (error.response.status === 429) return true;

  return false;
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyError(error: AxiosError): string {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Pyyntö aikakatkaistiin. Tarkista internet-yhteytesi.';
    }
    return 'Ei yhteyttä palvelimeen. Tarkista internet-yhteytesi.';
  }

  const status = error.response.status;
  if (status >= 500) {
    return 'Palvelinvirhe. Yritä myöhemmin uudelleen.';
  }
  if (status === 404) {
    return 'Pyydettyä tietoa ei löytynyt.';
  }
  if (status === 403) {
    return 'Ei käyttöoikeutta. Yritä uudelleen.';
  }
  if (status === 429) {
    return 'Liian monta pyyntöä. Odota hetki ja yritä uudelleen.';
  }

  return 'Tapahtui virhe. Yritä uudelleen.';
}

// Request interceptor - add auth token for write operations
api.interceptors.request.use(async (config) => {
  const isWrite =
    config.method === 'post' ||
    config.method === 'put' ||
    config.method === 'delete' ||
    config.method === 'patch';

  if (isWrite) {
    try {
      const token = await getValidToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      logError('Failed to get auth token:', error);
      return Promise.reject(new Error('Autentikointi epäonnistui'));
    }
  }

  return config;
});

// Response interceptor - handle errors and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Log network errors for debugging
    if (!error.response) {
      logError('Network error - no response received:', {
        message: error.message,
        url: originalRequest?.url,
        method: originalRequest?.method,
        code: error.code,
      });
    } else {
      logError('API error:', {
        status: error.response.status,
        url: originalRequest?.url,
        method: originalRequest?.method,
        data: error.response.data,
      });
    }

    // If we get 403 and haven't already retried
    if (error.response?.status === 403 && !originalRequest._retry) {
      devLog('Got 403, attempting to refresh token and retry...');
      originalRequest._retry = true;

      try {
        // Clear the old token and get a new one
        await clearToken();
        const newToken = await registerDeviceAndGetToken();

        // Update the request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the request
        devLog('Retrying request with new token...');
        return api(originalRequest);
      } catch (refreshError) {
        logError('Failed to refresh token:', refreshError);
        return Promise.reject(new Error('Autentikointi epäonnistui. Yritä uudelleen.'));
      }
    }

    // Retry logic for retryable errors
    const retryCount = originalRequest._retryCount || 0;
    if (isRetryableError(error) && retryCount < MAX_RETRIES) {
      originalRequest._retryCount = retryCount + 1;
      devLog(`Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(originalRequest);
    }

    // Add user-friendly error message
    const userMessage = getUserFriendlyError(error);
    const enhancedError = new Error(userMessage);
    (enhancedError as any).originalError = error;

    return Promise.reject(enhancedError);
  }
);

export const apiGetLocationUpdates = async (id: string, limit = 20) =>
  api.get(`/${id}/updates`, { params: { limit } });

export const apiGetNearbyLocations = async (
  lat: number,
  lon: number,
  distance = 500,
  limit = 20
) => {
  devLog('apiGetNearbyLocations called with:', { lat, lon, distance, limit });
  return api.get(`/nearby`, {
    params: { lat, lon, distance, limit },
  });
};

export const apiCreateLocation = async (data: any) => api.post('', data);

export const apiCreateLocationUpdate = async (id: string, data: any) =>
  api.post(`/${id}/updates`, data);
