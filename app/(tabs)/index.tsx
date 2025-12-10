import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as Location from 'expo-location';

import InfoScreen from '@/app/(tabs)/info';
import { useAppContext } from '@/app/_layout';
import Map from '@/components/Map';
import { View as ThemedView } from '@/components/Themed';
import { DEFAULT_LOCATION_LATITUDE, DEFAULT_LOCATION_LONGITUDE } from '@/constants/Location';
import { getCurrentGpsLocation } from '@/utils/gps';
import { devLog, logError } from '@/utils/logger';
import { setSplashInfoSeen } from '@/utils/splashInfo';

export default function MapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const { hasReadSplashInfo, setHasReadSplashInfo } = useAppContext();
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Only fetch GPS location AFTER splash screen is dismissed
  useEffect(() => {
    if (!hasReadSplashInfo) {
      return; // Don't fetch until user dismisses splash
    }

    setIsLoadingLocation(true);

    (async () => {
      try {
        devLog('Fetching GPS location...');
        const currentLocation = await getCurrentGpsLocation();
        if (currentLocation) {
          devLog('GPS location found:', currentLocation.latitude, currentLocation.longitude);
          setLocation(currentLocation);
          setUsingDefaultLocation(false); // GPS worked

          // Start watching location for continuous updates
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              devLog('Starting location watch...');
              locationSubscriptionRef.current = await Location.watchPositionAsync(
                {
                  accuracy: Location.Accuracy.Balanced,
                  timeInterval: 5000, // Update every 5 seconds
                  distanceInterval: 10, // Or when user moves 10 meters
                },
                (newLocation) => {
                  devLog(
                    'Location update:',
                    newLocation.coords.latitude,
                    newLocation.coords.longitude
                  );
                  setLocation({
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                  });
                }
              );
            }
          } catch (watchError) {
            logError('Failed to start location watch:', watchError);
          }
        } else {
          // GPS failed or timed out - use default Helsinki location as fallback
          // This allows the app to still work and show nearby locations
          devLog('GPS location not available, using default Helsinki location');
          setLocation({
            latitude: DEFAULT_LOCATION_LATITUDE,
            longitude: DEFAULT_LOCATION_LONGITUDE,
          });
          setUsingDefaultLocation(true); // Flag that we're using fallback
        }
      } catch (error) {
        logError('Error fetching GPS location:', error);
        setHasError(true);
        // Use default location even on error
        setLocation({
          latitude: DEFAULT_LOCATION_LATITUDE,
          longitude: DEFAULT_LOCATION_LONGITUDE,
        });
        setUsingDefaultLocation(true); // Flag that we're using fallback
      } finally {
        setIsLoadingLocation(false);
      }
    })();

    // Cleanup function to stop watching location when component unmounts
    return () => {
      if (locationSubscriptionRef.current) {
        devLog('Stopping location watch...');
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, [hasReadSplashInfo]); // Only trigger when splash screen is dismissed

  if (!hasReadSplashInfo) {
    return (
      <ThemedView style={styles.container}>
        <InfoScreen
          onAcknowledge={() => {
            setHasReadSplashInfo(true);
            setSplashInfoSeen();
          }}
          showButton={true}
        />
      </ThemedView>
    );
  }

  // Show error screen if something went wrong
  if (hasError) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', paddingHorizontal: 20 }}>
          Sovelluksen käynnistys epäonnistui.{'\n\n'}
          Sulje ja avaa sovellus uudelleen.
        </Text>
      </View>
    );
  }

  // SAFETY: Map component safely handles null location by:
  // 1. Checking "if (!location || !locationFound)" in render
  // 2. Showing "Ladataan tietoja..." loading screen
  // 3. Guards in useEffects prevent any operations on null location
  // This works for both first launch (after splash) and second launch (direct)
  try {
    return (
      <ThemedView style={styles.container}>
        <Map location={location} usingDefaultLocation={usingDefaultLocation} />
      </ThemedView>
    );
  } catch (error) {
    logError('Map render error:', error);
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', paddingHorizontal: 20 }}>
          Kartan lataus epäonnistui.{'\n\n'}
          Sulje ja avaa sovellus uudelleen.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
