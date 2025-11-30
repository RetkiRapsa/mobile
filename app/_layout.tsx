import { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Location from '@/types/Location';
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

type AppContextType = SplashInfoContextType & IdentityContextType & VisibleLocationsContextType;

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
      const id = await getOrCreateUUID();
      setIdentity(id);
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function RootLayoutNav({ children }: { children?: React.ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {children}
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'card',
              headerTitle: 'Tietoa',
              headerBackTitle: 'Takaisin',
            }}
          />
          <Stack.Screen
            name="locationDetails"
            options={{
              presentation: 'card',
              headerTitle: 'Kohteen tiedot',
              headerBackTitle: 'Takaisin',
            }}
          />
        </Stack>
      </ThemeProvider>
    </AppProvider>
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
