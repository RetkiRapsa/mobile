import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import ReCenterButton from '@/components/ReCenterButton';
import RefreshButton from '@/components/RefreshButton';
import {
  ERROR_LOCATION_LATITUDE,
  ERROR_LOCATION_LONGITUDE,
  MAP_INITIAL_DELTA,
  MAP_MAX_SPOTS,
  MAP_REFRESH_COOLDOWN_MS,
  MAP_SEARCH_RADIUS,
} from '@/constants/Location';
import Location from '@/types/Location';
import getNearbyLocationsFromCoords from '@/utils/getNearbyLocationsFromCoords';
import { getCurrentGpsLocation } from '@/utils/gps';
import { getIconName } from '@/utils/map';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MapProps {
  location: { latitude: number; longitude: number } | null;
}

export default function Map({ location }: MapProps) {
  // Hooks
  const mapRef = useRef<MapView | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const router = useRouter();
  const { visibleLocations, setVisibleLocations, setSelectedLocation } = useAppContext();

  const [locationFound, setLocationFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [region, setRegion] = useState<Region | null>(
    location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: MAP_INITIAL_DELTA,
          longitudeDelta: MAP_INITIAL_DELTA,
        }
      : null
  );

  // Helpers
  const resetRegion = useCallback((latitude: number, longitude: number) => {
    setRegion({
      latitude,
      longitude,
      latitudeDelta: MAP_INITIAL_DELTA,
      longitudeDelta: MAP_INITIAL_DELTA,
    });
  }, []);

  // Effects
  useEffect(() => {
    if (!location) {
      return;
    }

    if (
      location.latitude === ERROR_LOCATION_LATITUDE &&
      location.longitude === ERROR_LOCATION_LONGITUDE
    ) {
      Alert.alert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
      setLocationFound(false);
    } else {
      setLocationFound(true);
      resetRegion(location.latitude, location.longitude);
    }
  }, [location, resetRegion]);

  useEffect(() => {
    if (!location) return;
    const fetchNearbyLocations = async () => {
      const nearby = await getNearbyLocationsFromCoords(
        location.latitude,
        location.longitude,
        MAP_SEARCH_RADIUS,
        MAP_MAX_SPOTS
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
    [visibleLocations, setSelectedLocation, router]
  );

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < MAP_REFRESH_COOLDOWN_MS) {
      Alert.alert(
        'Huomio',
        'Et voi päivittää karttaa näin usein. Odota hetki ennen kuin päivität uudelleen.'
      );
      return;
    }
    setRefreshing(true);
    lastRefreshTimeRef.current = now;
    const currentLocation = await getCurrentGpsLocation();
    if (currentLocation) {
      const locations = await getNearbyLocationsFromCoords(
        currentLocation.latitude,
        currentLocation.longitude,
        MAP_SEARCH_RADIUS,
        MAP_MAX_SPOTS
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
