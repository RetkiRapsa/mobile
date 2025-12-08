import { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ProductionErrorBoundary } from '@/components/ProductionErrorBoundary';
import { View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Location from '@/types/Location';
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

type AppContextType = SplashInfoContextType &
  IdentityContextType &
  VisibleLocationsContextType &
  SelectedLocationContextType;

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

  // Load saved language preference on app start
  useEffect(() => {
    loadSavedLocale().catch((error) => {
      console.error('Failed to load saved locale:', error);
    });
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function RootLayoutNav({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  return (
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
