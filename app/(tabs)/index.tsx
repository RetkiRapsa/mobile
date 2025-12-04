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
  const { hasReadSplashInfo, setHasReadSplashInfo } = useAppContext();

  useEffect(() => {
    (async () => {
      const currentLocation = await getCurrentGpsLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      } else {
        setLocation({ latitude: ERROR_LOCATION_LATITUDE, longitude: ERROR_LOCATION_LONGITUDE });
      }
    })();
  }, []);

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

  return (
    <View style={styles.container}>
      <Map location={location} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
