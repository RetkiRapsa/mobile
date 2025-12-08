import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import ReCenterButton from '@/components/ReCenterButton';
import RefreshButton from '@/components/RefreshButton';
import {
  DEFAULT_LOCATION_LATITUDE,
  DEFAULT_LOCATION_LONGITUDE,
  ERROR_LOCATION_LATITUDE,
  ERROR_LOCATION_LONGITUDE,
  MAP_MAX_SPOTS,
  MAP_REFRESH_COOLDOWN_MS,
  MAP_SEARCH_RADIUS,
} from '@/constants/Location';
import getNearbyLocationsFromCoords from '@/utils/getNearbyLocationsFromCoords';
import { getCurrentGpsLocation } from '@/utils/gps';
import { devLog, logError } from '@/utils/logger';
import { getIconName } from '@/utils/map';
import { safeAlert } from '@/utils/safeAlert';

interface MapProps {
  location: { latitude: number; longitude: number } | null;
  usingDefaultLocation?: boolean;
}

export default function Map({ location, usingDefaultLocation = false }: MapProps) {
  // Hooks
  const webViewRef = useRef<WebView | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const router = useRouter();
  const { visibleLocations, setVisibleLocations, setSelectedLocation } = useAppContext();

  const [locationFound, setLocationFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentering, setRecentering] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
    center: { lat: number; lng: number };
  } | null>(null);

  // Helpers
  const sendMessageToMap = useCallback(
    (message: any) => {
      if (webViewRef.current && mapLoaded) {
        devLog('Sending message to map:', message.type, message);
        // Use injectJavaScript for better Android compatibility
        const jsCode = `
          (function() {
            try {
              if (window.handleReactNativeMessage) {
                window.handleReactNativeMessage(${JSON.stringify(message)});
              } else {
                console.log('handleReactNativeMessage not ready, queuing...');
              }
            } catch (e) {
              console.error('Error in injected JS:', e);
            }
          })();
          true; // Required for Android
        `;
        webViewRef.current.injectJavaScript(jsCode);
      } else {
        devLog('Map not ready, queuing message:', message.type);
        // Retry after a short delay if map isn't loaded yet
        setTimeout(() => {
          if (webViewRef.current && mapLoaded) {
            devLog('Retrying message to map:', message.type);
            const jsCode = `
              (function() {
                try {
                  if (window.handleReactNativeMessage) {
                    window.handleReactNativeMessage(${JSON.stringify(message)});
                  }
                } catch (e) {
                  console.error('Error in retry injected JS:', e);
                }
              })();
              true;
            `;
            webViewRef.current.injectJavaScript(jsCode);
          }
        }, 500);
      }
    },
    [mapLoaded]
  );

  const resetRegion = useCallback(
    (latitude: number, longitude: number) => {
      sendMessageToMap({
        type: 'setCenter',
        latitude,
        longitude,
        zoom: 16, // Zoom 16 ≈ 200m radius view
      });
    },
    [sendMessageToMap]
  );

  // Effects
  useEffect(() => {
    if (!location) {
      return;
    }

    if (
      location.latitude === ERROR_LOCATION_LATITUDE &&
      location.longitude === ERROR_LOCATION_LONGITUDE
    ) {
      devLog('Skipping location fetch - error state coordinates');
      setLoadingError('Sijaintia ei voitu paikallistaa');
      setLocationFound(false);
      setUserLocation(null);
    } else {
      setLocationFound(true);
      setLoadingError(null);
      setUserLocation({ latitude: location.latitude, longitude: location.longitude });
      resetRegion(location.latitude, location.longitude);
    }
  }, [location, resetRegion]);

  useEffect(() => {
    if (!location) return;

    // Don't try to fetch if location is the error state
    if (
      location.latitude === ERROR_LOCATION_LATITUDE &&
      location.longitude === ERROR_LOCATION_LONGITUDE
    ) {
      devLog('Skipping location fetch - error state coordinates');
      setLoadingError('Sijaintia ei voitu määrittää');
      setLocationFound(false);
      return;
    }

    // Initial fetch will happen when mapBounds are available
    devLog('Location found, waiting for map bounds to fetch nearby locations');
  }, [location]);

  // Update markers when locations change
  useEffect(() => {
    if (mapLoaded) {
      // Always send update, even if empty array (to clear markers)
      sendMessageToMap({
        type: 'updateMarkers',
        markers: visibleLocations.map((loc) => ({
          id: loc.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          icon: getIconName(loc.type!),
          available: loc.available,
          ticks: loc.ticks,
          name: loc.name,
        })),
      });
    }
  }, [visibleLocations, mapLoaded, sendMessageToMap]);

  // Update user location marker
  useEffect(() => {
    if (mapLoaded && userLocation) {
      sendMessageToMap({
        type: 'updateUserLocation',
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }
  }, [userLocation, mapLoaded, sendMessageToMap]);

  // Show alert when using default location
  useEffect(() => {
    if (usingDefaultLocation && locationFound) {
      safeAlert(
        'Sijaintia ei voitu määrittää',
        'Sijaintiasi ei voitu paikallistaa. Näytetään Helsinki-alueen kohteita.\n\nTarkista laitteesi sijaintiasetukset.'
      );
    }
  }, [usingDefaultLocation, locationFound]);

  // Fetch initial locations when map bounds are first available
  useEffect(() => {
    if (mapBounds && !initialFetchDone && locationFound) {
      const fetchInitialLocations = async () => {
        try {
          const centerLat = mapBounds.center.lat;
          const centerLng = mapBounds.center.lng;
          const north = mapBounds.north;
          const east = mapBounds.east;

          // Calculate radius from map bounds (visible area)
          const latDiff = (north - centerLat) * 111320; // degrees to meters
          const lngDiff = (east - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180);
          const calculatedRadius = Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff));

          // Cap at 100km maximum
          const searchRadius = Math.min(calculatedRadius, 100 * 1000);

          devLog('Fetching initial locations for visible area:', {
            center: { latitude: centerLat, longitude: centerLng },
            calculatedRadius: calculatedRadius,
            searchRadius: searchRadius,
          });

          const locations = await getNearbyLocationsFromCoords(
            centerLat,
            centerLng,
            searchRadius,
            MAP_MAX_SPOTS
          );
          devLog('Fetched initial locations:', locations.length);
          setVisibleLocations(locations);
          setLoadingError(null);
          setInitialFetchDone(true); // Mark initial fetch as complete
        } catch (error) {
          logError('Failed to fetch initial nearby locations:', error);
          setLoadingError('Kohteiden lataus epäonnistui');
          setInitialFetchDone(true); // Mark as done even on error to prevent retry
        }
      };
      fetchInitialLocations();
    }
  }, [mapBounds, initialFetchDone, locationFound, setVisibleLocations]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);

        if (message.type === 'mapReady') {
          setMapLoaded(true);
          devLog('Map loaded and ready');
        } else if (message.type === 'mapBoundsChanged') {
          setMapBounds(message.bounds);
          devLog('Map bounds updated:', message.bounds);
        } else if (message.type === 'markerClick') {
          const locationData = visibleLocations.find((loc) => loc.id === message.id);
          if (locationData) {
            setSelectedLocation(locationData);
            router.push('/locationDetails');
          }
        }
      } catch (error) {
        logError('Error handling WebView message:', error);
      }
    },
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

      // Use map center (visible area) for fetching locations
      if (mapBounds) {
        const centerLat = mapBounds.center.lat;
        const centerLng = mapBounds.center.lng;
        const north = mapBounds.north;
        const east = mapBounds.east;

        // Calculate radius from visible map area
        const latDiff = (north - centerLat) * 111320; // degrees to meters
        const lngDiff = (east - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180);
        const calculatedRadius = Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff));

        // Cap at 100km maximum
        const searchRadius = Math.min(calculatedRadius, 100 * 1000);

        devLog('Fetching locations for visible area:', {
          center: { latitude: centerLat, longitude: centerLng },
          calculatedRadius: calculatedRadius,
          searchRadius: searchRadius,
          bounds: mapBounds,
        });

        devLog('API call parameters:', {
          latitude: centerLat,
          longitude: centerLng,
          radiusInMeters: searchRadius,
          limit: MAP_MAX_SPOTS,
        });

        const locations = await getNearbyLocationsFromCoords(
          centerLat,
          centerLng,
          searchRadius,
          MAP_MAX_SPOTS
        );
        safeAlert('Kartta päivitetty', `Näytetään ${locations.length} kohdetta`);
        setVisibleLocations(locations);
      } else {
        safeAlert('Virhe', 'Kartan sijaintia ei voitu määrittää.');
      }
    } catch (error) {
      logError('Refresh failed:', error);
      safeAlert('Virhe', 'Päivitys epäonnistui. Yritä uudelleen.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, setVisibleLocations, mapBounds]);

  // Re-center handler
  const handleRecenter = useCallback(async () => {
    setRecentering(true); // Start loading state
    const currentLocation = await getCurrentGpsLocation();
    if (currentLocation) {
      setUserLocation(currentLocation); // Update user location marker
      resetRegion(currentLocation.latitude, currentLocation.longitude);

      // Also fetch and update nearby locations for the new center
      try {
        const locations = await getNearbyLocationsFromCoords(
          currentLocation.latitude,
          currentLocation.longitude,
          MAP_SEARCH_RADIUS,
          MAP_MAX_SPOTS
        );
        setVisibleLocations(locations);
      } catch (error) {
        logError('Failed to fetch locations after re-center:', error);
      }
    } else {
      safeAlert('Virhe', 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.');
    }
    setRecentering(false); // End loading state
  }, [resetRegion, setVisibleLocations]);

  // Generate HTML for WebView with Leaflet map
  const htmlContent = useMemo(() => {
    const initialLat = location?.latitude || DEFAULT_LOCATION_LATITUDE;
    const initialLon = location?.longitude || DEFAULT_LOCATION_LONGITUDE;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body, html { margin: 0; padding: 0; height: 100%; width: 100%; }
            #map { height: 100%; width: 100%; }
            .custom-marker {
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              background-color: lightblue;
            }
            .custom-marker i {
              font-size: 20px;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            // Initialize map
            const map = L.map('map', {
              center: [${initialLat}, ${initialLon}],
              zoom: 16, // Zoom 16 ≈ 200m radius view
              zoomControl: true,
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19,
            }).addTo(map);

            // Store markers
            const markers = {};
            let userMarker = null; // User location marker

            // Send map bounds to React Native when map moves
            function sendMapBounds() {
              const bounds = map.getBounds();
              const center = map.getCenter();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapBoundsChanged',
                bounds: {
                  north: bounds.getNorth(),
                  south: bounds.getSouth(),
                  east: bounds.getEast(),
                  west: bounds.getWest(),
                  center: {
                    lat: center.lat,
                    lng: center.lng
                  }
                }
              }));
            }

            // Listen for map movement (pan, zoom)
            map.on('moveend', sendMapBounds);
            map.on('zoomend', sendMapBounds);

            // Icon mapping to MaterialDesignIcons (matches MaterialCommunityIcons)
            const iconMap = {
              'tent': 'mdi-tent',
              'campfire': 'mdi-campfire',
              'waves': 'mdi-waves',
              'bridge': 'mdi-bridge',
              'chevron-up-box-outline': 'mdi-chevron-up-box-outline',
              'toilet': 'mdi-toilet',
              'parking': 'mdi-parking',
              'map-marker-question': 'mdi-map-marker-question',
            };

            // Create custom icon with MaterialDesignIcons
            function createCustomIcon(iconName, available, ticks) {
              const mdiClass = iconMap[iconName] || iconMap['map-marker-question'];
              const borderColor = ticks ? 'red' : 'green';
              const bgColor = 'lightblue';
              const iconColor = available ? 'black' : 'red';
              
              return L.divIcon({
                html: \`<div class="custom-marker" style="
                  border: 2px solid \${borderColor};
                  width: 34px;
                  height: 34px;
                ">
                  <i class="mdi \${mdiClass}" style="color: \${iconColor};"></i>
                </div>\`,
                className: '',
                iconSize: [34, 34],
                iconAnchor: [17, 17],
              });
            }

            // Handle messages from React Native via injectJavaScript
            window.handleReactNativeMessage = function(message) {
              try {
                console.log('Leaflet received message:', message.type);
                
                if (message.type === 'setCenter') {
                  console.log('Setting map center to:', message.latitude, message.longitude, 'zoom:', message.zoom);
                  // Use flyTo for smooth animation
                  map.flyTo([message.latitude, message.longitude], message.zoom || 16, {
                    duration: 1.5 // 1.5 second animation
                  });
                } else if (message.type === 'updateUserLocation') {
                  console.log('Updating user location:', message.latitude, message.longitude);
                  
                  // Remove existing user marker
                  if (userMarker) {
                    userMarker.remove();
                  }
                  
                  // Create a blue circle marker for user location
                  const userIcon = L.divIcon({
                    html: \`<div style="
                      width: 16px;
                      height: 16px;
                      background-color: #007AFF;
                      border: 3px solid white;
                      border-radius: 50%;
                      box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
                    "></div>\`,
                    className: '',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                  });
                  
                  // Add new user marker
                  userMarker = L.marker([message.latitude, message.longitude], {
                    icon: userIcon,
                    zIndexOffset: 1000, // Show above other markers
                  }).addTo(map);
                  
                  console.log('User location marker updated');
                } else if (message.type === 'updateMarkers') {
                  console.log('Updating markers, count:', message.markers.length);
                  // Clear existing markers from map
                  Object.values(markers).forEach(marker => marker.remove());
                  // Clear the markers object
                  for (let key in markers) {
                    delete markers[key];
                  }
                  
                  // Add new markers
                  message.markers.forEach(markerData => {
                    const marker = L.marker(
                      [markerData.latitude, markerData.longitude],
                      { icon: createCustomIcon(markerData.icon, markerData.available, markerData.ticks) }
                    ).addTo(map);
                    
                    marker.on('click', () => {
                      console.log('Marker clicked:', markerData.id);
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'markerClick',
                        id: markerData.id,
                      }));
                    });
                    
                    markers[markerData.id] = marker;
                  });
                  console.log('Markers updated successfully');
                }
              } catch (error) {
                console.error('Error handling message:', error);
              }
            };

            // Notify React Native that map is ready
            setTimeout(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapReady',
              }));
              // Send initial bounds
              sendMapBounds();
            }, 500);
          </script>
        </body>
      </html>
    `;
  }, [location]);

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
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
      />

      <RefreshButton onPress={handleRefresh} loading={refreshing} />
      <ReCenterButton onPress={handleRecenter} loading={recentering} />
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
