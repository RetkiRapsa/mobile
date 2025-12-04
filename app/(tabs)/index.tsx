import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import InfoScreen from '@/app/(tabs)/info';
import { useAppContext } from '@/app/_layout';
import Map from '@/components/Map';
import { View } from '@/components/Themed';
import { ERROR_LOCATION_LATITUDE, ERROR_LOCATION_LONGITUDE } from '@/constants/Location';
import { getCurrentGpsLocation } from '@/utils/gps';
import { setSplashInfoSeen } from '@/utils/splashInfo';

export default function MapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { hasReadSplashInfo, setHasReadSplashInfo } = useAppContext();

  // Only fetch GPS location AFTER splash screen is dismissed
  useEffect(() => {
    if (!hasReadSplashInfo) {
      return; // Don't fetch until user dismisses splash
    }

    setIsLoadingLocation(true);

    (async () => {
      try {
        if (__DEV__) {
          console.log('Fetching GPS location...');
        }
        const currentLocation = await getCurrentGpsLocation();
        if (currentLocation) {
          if (__DEV__) {
            console.log('GPS location found:', currentLocation.latitude, currentLocation.longitude);
          }
          setLocation(currentLocation);
        } else {
          if (__DEV__) {
            console.log('GPS location not available, using error state');
          }
          setLocation({ latitude: ERROR_LOCATION_LATITUDE, longitude: ERROR_LOCATION_LONGITUDE });
        }
      } catch (error) {
        console.error('Error fetching GPS location:', error);
        setLocation({ latitude: ERROR_LOCATION_LATITUDE, longitude: ERROR_LOCATION_LONGITUDE });
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, [hasReadSplashInfo]); // Only trigger when splash screen is dismissed

  if (!hasReadSplashInfo) {
    return (
      <View style={styles.container}>
        <InfoScreen
          onAcknowledge={() => {
            setHasReadSplashInfo(true);
            setSplashInfoSeen();
          }}
          showButton={true}
        />
      </View>
    );
  }

  // SAFETY: Map component safely handles null location by:
  // 1. Checking "if (!location || !locationFound)" in render
  // 2. Showing "Ladataan tietoja..." loading screen
  // 3. Guards in useEffects prevent any operations on null location
  // This works for both first launch (after splash) and second launch (direct)
  return (
    <View style={styles.container}>
      <Map location={location} />
    </View>
  );
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
