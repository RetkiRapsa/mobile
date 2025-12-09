import axios, { AxiosError } from 'axios';

import { clearToken, getValidToken } from './auth';
import { devLog, logError } from './logger';

const RETKIRAPSA_API_DOMAIN = process.env.EXPO_PUBLIC_RETKIRAPSA_API_DOMAIN || 'localhost';
// Use HTTP for localhost and local IP addresses, HTTPS for production domains
const isLocalDevelopment =
  RETKIRAPSA_API_DOMAIN.includes('localhost') ||
  RETKIRAPSA_API_DOMAIN.match(/^\d+\.\d+\.\d+\.\d+/) ||
  RETKIRAPSA_API_DOMAIN.includes('192.168.') ||
  RETKIRAPSA_API_DOMAIN.includes('10.0.');
const protocol = isLocalDevelopment ? 'http' : 'https';
const API_URL = `${protocol}://${RETKIRAPSA_API_DOMAIN}/locations`;
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

// Log the API configuration on startup
devLog('API Client configured:', {
  domain: RETKIRAPSA_API_DOMAIN,
  protocol,
  isLocalDevelopment,
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
});

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

  devLog('=== REQUEST INTERCEPTOR ===');
  devLog('Method:', config.method?.toUpperCase());
  devLog('URL:', config.url);
  devLog('Base URL:', config.baseURL);
  devLog('Full URL:', `${config.baseURL}${config.url}`);
  devLog('Is write operation:', isWrite);

  if (isWrite) {
    try {
      const token = await getValidToken();
      devLog('Token retrieved:', token ? 'YES' : 'NO');
      if (token) {
        devLog('Token (first 30 chars):', token.substring(0, 30) + '...');
        devLog('Token length:', token.length);
      }

      if (!token) {
        logError('ERROR: No token available for write operation');
        return Promise.reject(new Error('Autentikointi puuttuu. Kirjaudu sisään.'));
      }

      // Ensure headers object exists and properly set Authorization
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers['Authorization'] = `Bearer ${token}`;

      devLog('Authorization header set:', config.headers['Authorization'] ? 'YES' : 'NO');
      devLog(
        'Authorization header (first 50 chars):',
        config.headers['Authorization']?.substring(0, 50) + '...'
      );

      // Log the payload
      if (config.data) {
        devLog(
          'Request payload:',
          typeof config.data === 'string' ? config.data : JSON.stringify(config.data)
        );
      }

      // Log all headers (without full token for security)
      const headersForLog = { ...config.headers };
      if (headersForLog['Authorization']) {
        headersForLog['Authorization'] = 'Bearer [TOKEN_PRESENT]';
      }
      devLog('All headers:', JSON.stringify(headersForLog));
    } catch (error) {
      logError('Failed to get auth token:', error);
      return Promise.reject(new Error('Autentikointi epäonnistui'));
    }
  }

  devLog('=== END REQUEST INTERCEPTOR ===');
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
        baseURL: originalRequest?.baseURL,
        fullURL: originalRequest?.baseURL + originalRequest?.url,
        method: originalRequest?.method,
        code: error.code,
      });
    } else {
      logError('API error:', {
        status: error.response.status,
        url: originalRequest?.url,
        baseURL: originalRequest?.baseURL,
        fullURL: originalRequest?.baseURL + originalRequest?.url,
        method: originalRequest?.method,
        data: error.response.data,
      });
    }

    // If we get 403, authentication failed - user needs to login
    if (error.response?.status === 403) {
      devLog('=== GOT 403 FORBIDDEN ===');
      devLog('Request that failed:');
      devLog('  Method:', originalRequest?.method?.toUpperCase());
      devLog('  URL:', originalRequest?.url);
      devLog('  Base URL:', originalRequest?.baseURL);
      devLog('  Full URL:', originalRequest?.baseURL + originalRequest?.url);

      // Check if Authorization header was present in the failed request
      const hadAuthHeader = originalRequest?.headers?.['Authorization'];
      devLog('  Had Authorization header:', hadAuthHeader ? 'YES' : 'NO');
      if (hadAuthHeader) {
        devLog('  Authorization header (first 50 chars):', hadAuthHeader.substring(0, 50) + '...');
      }

      devLog('  Payload:', originalRequest?.data);
      devLog('  Response data:', error.response.data);

      devLog('Clearing token from storage due to 403...');
      await clearToken();
      devLog('=== END 403 HANDLING ===');
      // Let the error propagate so the app can show login screen
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
