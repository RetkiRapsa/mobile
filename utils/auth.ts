import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { t } from './i18n';
import { devLog, logError } from './logger';

const API_DOMAIN = process.env.EXPO_PUBLIC_RETKIRAPSA_API_DOMAIN || 'localhost';
// Use HTTP for localhost and local IP addresses, HTTPS for production domains
const isLocalDevelopment =
  API_DOMAIN.includes('localhost') ||
  API_DOMAIN.match(/^\d+\.\d+\.\d+\.\d+/) ||
  API_DOMAIN.includes('192.168.') ||
  API_DOMAIN.includes('10.0.');
const protocol = isLocalDevelopment ? 'http' : 'https';
const API_BASE_URL = `${protocol}://${API_DOMAIN}`; // Base URL for user auth endpoints
const TOKEN_KEY = 'retkirapsa_jwt_token'; // JWT token for authentication
const USERNAME_KEY = 'retkirapsa_username';
const IS_ADMIN_KEY = 'retkirapsa_is_admin';
const REQUEST_TIMEOUT = 15000; // 15 seconds

// Log the auth API configuration on startup
devLog('Auth API configured:', {
  domain: API_DOMAIN,
  protocol,
  isLocalDevelopment,
  baseURL: API_BASE_URL,
});

/**
 * Get stored JWT token
 */
export async function getValidToken(): Promise<string | null> {
  try {
    devLog('getValidToken: Retrieving token from SecureStore...');
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    if (token) {
      devLog('getValidToken: Token found');
      devLog('getValidToken: Token length:', token.length);
      devLog('getValidToken: Token (first 30 chars):', token.substring(0, 30) + '...');

      // Decode JWT to check expiration (without verification)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const isExpired = exp < now;

          devLog('getValidToken: Token expiration:', new Date(exp).toISOString());
          devLog('getValidToken: Current time:', new Date(now).toISOString());
          devLog('getValidToken: Is expired:', isExpired);

          if (isExpired) {
            devLog('getValidToken: Token is expired, clearing...');
            await clearToken();
            return null;
          }
        }
      } catch (decodeError) {
        logError('getValidToken: Error decoding token:', decodeError);
        // Continue anyway, let backend validate
      }
    } else {
      devLog('getValidToken: No token found in storage');
    }

    return token;
  } catch (error) {
    logError('getValidToken: Error getting token:', error);
    return null;
  }
}

/**
 * Clear stored token
 */
export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USERNAME_KEY);
    await SecureStore.deleteItemAsync(IS_ADMIN_KEY);
    devLog('Token, username, and admin status cleared from storage');
  } catch (error) {
    logError('Failed to clear token:', error);
  }
}

/**
 * Register a new user
 */
export async function registerUser(
  displayName: string,
  email: string,
  password: string
): Promise<string> {
  try {
    devLog('Registering user:', email);

    // Use direct axios call without interceptors to avoid sending device token
    const response = await axios.post(
      `${API_BASE_URL}/user/register`,
      { displayName, email, password },
      {
        timeout: REQUEST_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.data?.token) {
      throw new Error('No token received from server');
    }

    const token = response.data.token;
    const isAdmin = response.data.admin || false;
    const returnedDisplayName = response.data.displayName || displayName;

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USERNAME_KEY, returnedDisplayName);
    await SecureStore.setItemAsync(IS_ADMIN_KEY, isAdmin.toString());
    devLog('User registered, token and admin status stored');
    // Verify token was stored
    const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    devLog(
      'Token verification after registration:',
      storedToken ? 'Token present' : 'Token missing'
    );
    return token;
  } catch (error) {
    // ...existing code...
    // Don't log here - the AuthScreen will handle showing the error to the user
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(t('errorTimeout'));
      } else if (!error.response) {
        throw new Error(t('errorNoConnection'));
      } else if (error.response.status === 409) {
        throw new Error(t('errorEmailExists'));
      } else if (error.response.status >= 500) {
        throw new Error(t('errorServerError'));
      } else if (error.response.status === 400) {
        throw new Error(t('errorInvalidData'));
      } else if (error.response.status === 404) {
        throw new Error(t('errorServiceNotFound'));
      }
    }

    // For any other error, throw a generic message instead of the original error
    if (error instanceof Error && error.message && !error.message.includes('AxiosError')) {
      throw error; // Already a user-friendly error
    }
    throw new Error(t('errorGenericRegister'));
  }
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<string> {
  try {
    devLog('Logging in user:', email);

    // Use direct axios call without interceptors to avoid sending device token
    const response = await axios.post(
      `${API_BASE_URL}/user/login`,
      { email, password },
      {
        timeout: REQUEST_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.data?.token) {
      throw new Error('No token received from server');
    }

    const token = response.data.token;
    const isAdmin = response.data.admin || false;
    const displayName = response.data.displayName || email;

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USERNAME_KEY, displayName);
    await SecureStore.setItemAsync(IS_ADMIN_KEY, isAdmin.toString());
    devLog('User logged in, token and admin status stored');
    // Verify token was stored
    const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    devLog('Token verification after login:', storedToken ? 'Token present' : 'Token missing');
    return token;
  } catch (error) {
    // ...existing code...
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(t('errorTimeout'));
      } else if (!error.response) {
        throw new Error(t('errorNoConnection'));
      } else if (error.response.status === 401) {
        throw new Error(t('errorWrongCredentials'));
      } else if (error.response.status >= 500) {
        throw new Error(t('errorServerError'));
      } else if (error.response.status === 400) {
        throw new Error(t('errorInvalidData'));
      } else if (error.response.status === 404) {
        throw new Error(t('errorServiceNotFound'));
      }
    }

    // For any other error, throw a generic message instead of the original error
    if (error instanceof Error && error.message && !error.message.includes('AxiosError')) {
      throw error; // Already a user-friendly error
    }
    throw new Error(t('errorGenericLogin'));
  }
}

/**
 * Logout user - clear all auth data
 */
export async function logoutUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USERNAME_KEY);
    await SecureStore.deleteItemAsync(IS_ADMIN_KEY);
    devLog('User logged out');
  } catch (error) {
    logError('Failed to logout user:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return !!token;
  } catch (error) {
    logError('Failed to check authentication:', error);
    return false;
  }
}

/**
 * Get stored display name
 */
export async function getStoredDisplayName(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(USERNAME_KEY);
  } catch (error) {
    logError('Failed to get stored display name:', error);
    return null;
  }
}

/**
 * Get stored admin status
 */
export async function getStoredIsAdmin(): Promise<boolean> {
  try {
    const isAdminStr = await SecureStore.getItemAsync(IS_ADMIN_KEY);
    return isAdminStr === 'true';
  } catch (error) {
    logError('Failed to get stored admin status:', error);
    return false;
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    devLog('Requesting password reset for:', email);

    await axios.post(
      `${API_BASE_URL}/user/forgot-password`,
      { email },
      {
        timeout: REQUEST_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    devLog('Password reset email sent');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(t('errorTimeout'));
      } else if (!error.response) {
        throw new Error(t('errorNoConnection'));
      } else if (error.response.status >= 500) {
        throw new Error(t('errorServerError'));
      }
    }
    throw new Error(t('errorGeneric'));
  }
}

/**
 * Change password (requires authentication)
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error(t('errorNotAuthenticated'));
    }

    devLog('Changing password');

    await axios.post(
      `${API_BASE_URL}/user/change-password`,
      { currentPassword, newPassword },
      {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    devLog('Password changed successfully');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(t('errorTimeout'));
      } else if (!error.response) {
        throw new Error(t('errorNoConnection'));
      } else if (error.response.status === 400) {
        throw new Error(t('errorCurrentPasswordIncorrect'));
      } else if (error.response.status === 401) {
        throw new Error(t('errorNotAuthenticated'));
      } else if (error.response.status >= 500) {
        throw new Error(t('errorServerError'));
      }
    }
    throw new Error(t('errorGeneric'));
  }
}

/**
 * Change email (requires authentication and verification)
 */
export async function changeEmail(newEmail: string): Promise<void> {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error(t('errorNotAuthenticated'));
    }

    devLog('Changing email to:', newEmail);

    await axios.post(
      `${API_BASE_URL}/user/change-email`,
      { newEmail },
      {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    devLog('Email change requested, verification email sent');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(t('errorTimeout'));
      } else if (!error.response) {
        throw new Error(t('errorNoConnection'));
      } else if (error.response.status === 409) {
        throw new Error(t('errorEmailExists'));
      } else if (error.response.status === 401) {
        throw new Error(t('errorNotAuthenticated'));
      } else if (error.response.status >= 500) {
        throw new Error(t('errorServerError'));
      }
    }
    throw new Error(t('errorGeneric'));
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<{
  displayName: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
}> {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error(t('errorNotAuthenticated'));
    }

    const response = await axios.get(`${API_BASE_URL}/user/profile`, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(t('errorTimeout'));
      } else if (!error.response) {
        throw new Error(t('errorNoConnection'));
      } else if (error.response.status === 401) {
        throw new Error(t('errorNotAuthenticated'));
      } else if (error.response.status >= 500) {
        throw new Error(t('errorServerError'));
      }
    }
    throw new Error(t('errorGeneric'));
  }
}

export { logoutUser as logout };
