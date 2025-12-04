import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import ReCenterButton from '@/components/ReCenterButton';
import RefreshButton from '@/components/RefreshButton';
import Location from '@/types/Location';
import getNearbyLocationsFromCoords from '@/utils/getNearbyLocationsFromCoords';
import { getCurrentGpsLocation } from '@/utils/gps';
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
  const router = useRouter();
  const { visibleLocations, setVisibleLocations, setSelectedLocation } = useAppContext();

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
    const timeout = setTimeout(() => {
      if (!locationFound && location) {
        Alert.alert('Virhe', 'Sijaintia ei voitu ladata. Yritä uudelleen.');
        setLocationFound(false);
      }
    }, 10000); // 10 second timeout

    if (!location) {
      clearTimeout(timeout);
      return;
    }

    if (location.latitude === -1000 && location.longitude === -1000) {
      Alert.alert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
      setLocationFound(false);
    } else {
      setLocationFound(true);
      resetRegion(location.latitude, location.longitude);
    }

    return () => clearTimeout(timeout);
  }, [location, locationFound, resetRegion]);

  useEffect(() => {
    if (!location) return;
    const fetchNearbyLocations = async () => {
      const nearby = await getNearbyLocationsFromCoords(
        location.latitude,
        location.longitude,
        SEARCH_RADIUS,
        MAX_SPOTS
      );
      setVisibleLocations(nearby);
    };
    fetchNearbyLocations();
  }, [location, setVisibleLocations]);

  // Marker rendering
  const renderMarkers = useMemo(
    () =>
      visibleLocations.map((location: Location) => (
        <Marker
          key={location.id}
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          onPress={() => {
            setSelectedLocation(location);
            router.push('/locationDetails');
          }}
        >
          <MaterialCommunityIcons
            style={{
              borderWidth: 2,
              borderColor: location.ticks ? 'red' : 'green',
              borderRadius: 8,
              backgroundColor: 'lightblue',
            }}
            name={getIconName(location.type!)}
            size={30}
            color={location.available ? 'black' : 'red'}
          />
        </Marker>
      )),
    [visibleLocations, router, setSelectedLocation]
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
    const currentLocation = await getCurrentGpsLocation();
    if (currentLocation) {
      const locations = await getNearbyLocationsFromCoords(
        currentLocation.latitude,
        currentLocation.longitude,
        SEARCH_RADIUS,
        MAX_SPOTS
      );
      Alert.alert('Päivitetty', `Löydettiin ${locations.length} kohdetta.`);
      setVisibleLocations(locations);
    } else {
      Alert.alert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
    }
    setRefreshing(false);
  }, [refreshing, setVisibleLocations]);

  // Re-center handler
  const handleRecenter = useCallback(async () => {
    const currentLocation = await getCurrentGpsLocation();
    if (currentLocation) {
      resetRegion(currentLocation.latitude, currentLocation.longitude);
    } else {
      Alert.alert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
    }
  }, [resetRegion]);

  // Render
  if (!location || !locationFound) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
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
        key={visibleLocations.length}
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
