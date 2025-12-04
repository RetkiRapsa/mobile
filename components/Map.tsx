import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { safeAlert } from '@/utils/safeAlert';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MapProps {
  location: { latitude: number; longitude: number } | null;
  usingDefaultLocation?: boolean;
}

export default function Map({ location, usingDefaultLocation = false }: MapProps) {
  // Hooks
  const mapRef = useRef<MapView | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const router = useRouter();
  const { visibleLocations, setVisibleLocations, setSelectedLocation } = useAppContext();

  const [locationFound, setLocationFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
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
      // Don't show Alert in production - it can cause crashes
      if (__DEV__) {
        safeAlert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
      }
      setLoadingError('Sijaintia ei voitu paikallistaa');
      setLocationFound(false);
    } else {
      setLocationFound(true);
      setLoadingError(null);
      resetRegion(location.latitude, location.longitude);
    }
  }, [location, resetRegion]);

  useEffect(() => {
    if (!location) return;

    // Don't try to fetch if location is the error state (but DO fetch if it's the default Helsinki location)
    if (
      location.latitude === ERROR_LOCATION_LATITUDE &&
      location.longitude === ERROR_LOCATION_LONGITUDE
    ) {
      if (__DEV__) {
        console.log('Skipping location fetch - error state coordinates');
      }
      setLoadingError('Sijaintia ei voitu määrittää');
      setLocationFound(false);
      return;
    }

    const fetchNearbyLocations = async () => {
      try {
        if (__DEV__) {
          console.log('Fetching nearby locations for:', location.latitude, location.longitude);
        }
        const nearby = await getNearbyLocationsFromCoords(
          location.latitude,
          location.longitude,
          MAP_SEARCH_RADIUS,
          MAP_MAX_SPOTS
        );
        if (__DEV__) {
          console.log('Fetched nearby locations:', nearby.length);
        }
        setVisibleLocations(nearby);
        setLoadingError(null);
      } catch (error) {
        console.error('Failed to fetch nearby locations:', error);
        setLoadingError('Kohteiden lataus epäonnistui');
        // Don't show alerts in production - can cause crashes
        if (__DEV__) {
          safeAlert(
            'Virhe',
            'Kohteiden lataus epäonnistui. Tarkista internet-yhteytesi ja yritä uudelleen.'
          );
        }
      }
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
      safeAlert(
        'Huomio',
        'Et voi päivittää karttaa näin usein. Odota hetki ennen kuin päivität uudelleen.'
      );
      return;
    }
    setRefreshing(true);
    try {
      lastRefreshTimeRef.current = now;
      const currentLocation = await getCurrentGpsLocation();
      if (currentLocation) {
        const locations = await getNearbyLocationsFromCoords(
          currentLocation.latitude,
          currentLocation.longitude,
          MAP_SEARCH_RADIUS,
          MAP_MAX_SPOTS
        );
        safeAlert('Päivitetty', `Löydettiin ${locations.length} kohdetta.`);
        setVisibleLocations(locations);
      } else {
        safeAlert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      safeAlert('Virhe', 'Päivitys epäonnistui. Yritä uudelleen.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, setVisibleLocations]);

  // Re-center handler
  const handleRecenter = useCallback(async () => {
    const currentLocation = await getCurrentGpsLocation();
    if (currentLocation) {
      resetRegion(currentLocation.latitude, currentLocation.longitude);
    } else {
      safeAlert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
    }
  }, [resetRegion]);

  // Render
  if (!location || !locationFound) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{loadingError || 'Ladataan tietoja...'}</Text>
          {loadingError && (
            <Text style={[styles.loadingText, { fontSize: 16, marginTop: 20 }]}>
              Tarkista laitteen sijaintiasetukset
            </Text>
          )}
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

      {/* Show notification if using default location */}
      {usingDefaultLocation && (
        <View style={styles.locationWarningBanner}>
          <Text style={styles.locationWarningText}>⚠️ Sijaintiasi ei voitu määrittää</Text>
          <Text style={styles.locationWarningSubtext}>Näytetään Helsinki-alueen kohteita</Text>
        </View>
      )}

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
  locationWarningBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  locationWarningText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  locationWarningSubtext: {
    fontSize: 14,
    color: '#000',
  },
});
