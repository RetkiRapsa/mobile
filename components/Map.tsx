import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { useNavigation, useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import ReCenterButton from '@/components/ReCenterButton';
import RefreshButton from '@/components/RefreshButton';
import Spot from '@/types/Spot';
import getNearbySpotsFromCoords from '@/utils/getNearbySpotsFromCoords';
import { getLocation } from '@/utils/location';
import { getIconName } from '@/utils/map';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MapProps {
  location: { latitude: number; longitude: number } | null;
}

const INITIAL_DELTA = 0.01;
const REFRESH_COOLDOWN_MS = 15000;
const SEARCH_RADIUS = 1000 * 1000;
const MAX_SPOTS = 50;

export default function Map({ location }: MapProps) {
  // Hooks
  const mapRef = useRef<MapView | null>(null);
  const navigation = useNavigation();
  const router = useRouter();
  const { visibleSpots, setVisibleSpots, identity } = useAppContext();

  const [locationFound, setLocationFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [region, setRegion] = useState<Region | null>(
    location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        }
      : null
  );

  // Helpers
  const resetRegion = useCallback((latitude: number, longitude: number) => {
    setRegion({
      latitude,
      longitude,
      latitudeDelta: INITIAL_DELTA,
      longitudeDelta: INITIAL_DELTA,
    });
  }, []);

  // Effects
  useEffect(() => {
    if (!location) return;
    if (location.latitude === -1000 && location.longitude === -1000) {
      Alert.alert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
      setLocationFound(false);
    } else {
      setLocationFound(true);
      resetRegion(location.latitude, location.longitude);
    }
  }, [location, resetRegion]);

  useEffect(() => {
    if (!location) return;
    const fetchNearbySpots = async () => {
      const nearby = await getNearbySpotsFromCoords(
        location.latitude,
        location.longitude,
        SEARCH_RADIUS,
        MAX_SPOTS
      );
      setVisibleSpots(nearby);
    };
    fetchNearbySpots();
  }, [location, setVisibleSpots]);

  // Marker rendering
  const renderMarkers = useMemo(
    () =>
      visibleSpots.map((spot: Spot) => (
        <Marker
          key={spot.id}
          coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
          // @ts-ignore-next-line
          onPress={() => navigation.navigate('spotDetails', { spot })}
        >
          <MaterialCommunityIcons
            style={{
              borderWidth: 2,
              borderColor: spot.ticks ? 'red' : 'green',
              borderRadius: 8,
              backgroundColor: 'lightblue',
            }}
            name={getIconName(spot.type!)}
            size={30}
            color={spot.available ? 'black' : 'red'}
          />
        </Marker>
      )),
    [visibleSpots, navigation]
  );

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    const lastRefresh = (global as any).lastRefreshTime || 0;
    const now = Date.now();
    if (now - lastRefresh < REFRESH_COOLDOWN_MS) {
      Alert.alert(
        'Huomio',
        'Et voi päivittää karttaa näin usein. Odota hetki ennen kuin päivität uudelleen.'
      );
      return;
    }
    setRefreshing(true);
    (global as any).lastRefreshTime = now;
    const currentLocation = await getLocation();
    if (currentLocation) {
      const spots = await getNearbySpotsFromCoords(
        currentLocation.latitude,
        currentLocation.longitude,
        SEARCH_RADIUS,
        MAX_SPOTS
      );
      Alert.alert('Päivitetty', `Löydettiin ${spots.length} kohdetta.`);
      setVisibleSpots(spots);
    } else {
      Alert.alert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
    }
    setRefreshing(false);
  }, [refreshing, setVisibleSpots]);

  // Re-center handler
  const handleRecenter = useCallback(async () => {
    const currentLocation = await getLocation();
    if (currentLocation) {
      resetRegion(currentLocation.latitude, currentLocation.longitude);
    } else {
      Alert.alert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
    }
  }, [resetRegion]);

  // Render
  if (!locationFound) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Ladataan tietoja...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <MapView
        ref={mapRef}
        key={visibleSpots.length}
        style={styles.map}
        zoomEnabled
        scrollEnabled
        showsUserLocation
        region={region || undefined}
        onRegionChangeComplete={setRegion}
      >
        {renderMarkers}
      </MapView>
      <RefreshButton onPress={handleRefresh} />
      <ReCenterButton onPress={handleRecenter} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 34,
    color: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
