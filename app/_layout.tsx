import { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ProductionErrorBoundary } from '@/components/ProductionErrorBoundary';
import { View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Location from '@/types/Location';
import {
  isAuthenticated as checkAuthentication,
  clearToken,
  getStoredIsAdmin,
  getStoredUsername,
  getValidToken,
} from '@/utils/auth';
import { setAuthFailureCallback } from '@/utils/client';
import { loadSavedLocale, useTranslation } from '@/utils/i18n';
import getOrCreateUUID from '@/utils/identity';
import { splashInfoSeen } from '@/utils/splashInfo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

/** APP CONTEXT PROVIDER **/

type SplashInfoContextType = {
  hasReadSplashInfo: boolean;
  setHasReadSplashInfo: React.Dispatch<React.SetStateAction<boolean>>;
};

type IdentityContextType = {
  identity: string | undefined;
  setIdentity: React.Dispatch<React.SetStateAction<string | undefined>>;
};

type VisibleLocationsContextType = {
  visibleLocations: Location[];
  setVisibleLocations: React.Dispatch<React.SetStateAction<Location[]>>;
};

type SelectedLocationContextType = {
  selectedLocation: Location | null;
  setSelectedLocation: React.Dispatch<React.SetStateAction<Location | null>>;
};

type AuthContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  username: string | null;
  setUsername: React.Dispatch<React.SetStateAction<string | null>>;
  isAdmin: boolean;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
};

type MapStateType = {
  hasInitiallyCenteredMap: boolean;
  setHasInitiallyCenteredMap: React.Dispatch<React.SetStateAction<boolean>>;
  returnToMapCenter: { latitude: number; longitude: number } | null;
  setReturnToMapCenter: React.Dispatch<
    React.SetStateAction<{ latitude: number; longitude: number } | null>
  >;
};

type AppContextType = SplashInfoContextType &
  IdentityContextType &
  VisibleLocationsContextType &
  SelectedLocationContextType &
  AuthContextType &
  MapStateType;

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [hasReadSplashInfo, setHasReadSplashInfo] = useState<boolean>(false);
  const [identity, setIdentity] = useState<string | undefined>(undefined);
  const [visibleLocations, setVisibleLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [hasInitiallyCenteredMap, setHasInitiallyCenteredMap] = useState<boolean>(false);
  const [returnToMapCenter, setReturnToMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Load saved language preference on app start
  useEffect(() => {
    loadSavedLocale().catch((error) => {
      console.error('Failed to load saved locale:', error);
    });
  }, []);

  // Set up auth failure callback for API client
  useEffect(() => {
    const handleAuthFailure = () => {
      console.log('[Auth] Auth failure detected from API - clearing auth state');
      setIsAuthenticated(false);
      setUsername(null);
      setIsAdmin(false);
    };

    setAuthFailureCallback(handleAuthFailure);

    return () => {
      setAuthFailureCallback(null);
    };
  }, []);

  // Check authentication status on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await checkAuthentication();

        if (authenticated) {
          const storedUsername = await getStoredUsername();
          const storedIsAdmin = await getStoredIsAdmin();

          // Only consider authenticated if BOTH token AND username exist
          if (storedUsername) {
            console.log('[Auth] User authenticated with username:', storedUsername);
            console.log('[Auth] User is admin:', storedIsAdmin);

            // Validate token with backend using the dedicated /validate endpoint
            try {
              console.log('[Auth] Validating token with backend...');
              const axios = require('axios');
              const token = await getValidToken();
              const API_DOMAIN = process.env.EXPO_PUBLIC_RETKIRAPSA_API_DOMAIN || 'localhost';
              const isLocal =
                API_DOMAIN.includes('localhost') || API_DOMAIN.match(/^\d+\.\d+\.\d+\.\d+/);
              const protocol = isLocal ? 'http' : 'https';
              const API_URL = `${protocol}://${API_DOMAIN}`;

              // Call the /validate endpoint to check if user exists in backend
              const response = await axios.get(`${API_URL}/validate`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000,
              });

              console.log('[Auth] Token validation successful - user exists in backend');
              console.log('[Auth] Validation response:', response.data);
              setIsAuthenticated(true);
              setUsername(storedUsername);
              setIsAdmin(storedIsAdmin);
            } catch (error: any) {
              console.log(
                '[Auth] Token validation failed:',
                error.response?.status || error.message
              );
              if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('[Auth] User does not exist in backend - clearing authentication');
                setIsAuthenticated(false);
                setUsername(null);
                setIsAdmin(false);
                await clearToken();
              } else {
                // Network error or other issue - don't log out, just log the error
                console.log(
                  '[Auth] Could not validate token (network error) - assuming valid for now'
                );
                setIsAuthenticated(true);
                setUsername(storedUsername);
                setIsAdmin(storedIsAdmin);
              }
            }
          } else {
            console.log('[Auth] Token exists but no username - clearing authentication');
            setIsAuthenticated(false);
            setUsername(null);
            setIsAdmin(false);
            // Clear the orphaned token
            await clearToken();
          }
        } else {
          console.log('[Auth] No valid token found');
          setIsAuthenticated(false);
          setUsername(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[Auth] Failed to check authentication:', error);
        setIsAuthenticated(false);
        setUsername(null);
        setIsAdmin(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const checkSplashInfo = async () => {
      try {
        const value = await splashInfoSeen();
        setHasReadSplashInfo(!!value);
      } catch (error) {
        setHasReadSplashInfo(true);
      }
    };
    checkSplashInfo();
  }, []);

  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const id = await getOrCreateUUID();
        setIdentity(id);
      } catch (error) {
        console.error('Failed to fetch identity:', error);
        // Set a fallback UUID to prevent crashes
        setIdentity('fallback-' + Date.now());
      }
    };
    fetchIdentity();
  }, []);

  return (
    <AppContext.Provider
      value={{
        hasReadSplashInfo,
        setHasReadSplashInfo,
        identity,
        setIdentity,
        visibleLocations,
        setVisibleLocations,
        selectedLocation,
        setSelectedLocation,
        isAuthenticated,
        setIsAuthenticated,
        username,
        setUsername,
        isAdmin,
        setIsAdmin,
        hasInitiallyCenteredMap,
        setHasInitiallyCenteredMap,
        returnToMapCenter,
        setReturnToMapCenter,
      }}
    >
      {isCheckingAuth ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
          }}
        >
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
}

function RootLayoutNav({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ProductionErrorBoundary>
        <AppProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {children}
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{
                  presentation: 'card',
                  headerTitle: t('aboutHeader'),
                  headerBackTitle: t('backButton'),
                }}
              />
              <Stack.Screen
                name="locationDetails"
                options={{
                  presentation: 'card',
                  headerTitle: t('locationDetailsHeader'),
                  headerBackTitle: t('backButton'),
                }}
              />
            </Stack>
          </ThemeProvider>
        </AppProvider>
      </ProductionErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <RootLayoutNav>
      {!loaded ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 9999,
          }}
        >
          <ActivityIndicator size="large" color="#888" />
        </View>
      ) : null}
    </RootLayoutNav>
  );
}
