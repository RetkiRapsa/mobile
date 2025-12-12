import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import CreateNewLocationUpdate from '@/components/CreateNewLocationUpdate';
import EditLocation from '@/components/EditLocation';
import colors from '@/constants/Colors';
import LocationUpdate from '@/types/LocationUpdate';
import { apiDeleteLocation, apiDeleteLocationUpdate } from '@/utils/client';
import getLocationUpdates from '@/utils/getLocationUpdates';
import { isTooFarFromLocation } from '@/utils/getNearbyLocationsFromCoords';
import { getCurrentGpsLocation } from '@/utils/gps';
import { getLocale, useTranslation } from '@/utils/i18n';
import { getIconName } from '@/utils/map';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function LocationDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const backgroundColor = colors.light.background;
  const footerBackgroundColor = '#ffffff';
  const footerBorderColor = '#cccccc';
  const foregroundColor = colors.light.text;
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [addLocationUpdate, setAddLocationUpdate] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<LocationUpdate | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [updatedAvailable, setUpdatedAvailable] = useState(false);
  const [updatedTicks, setUpdatedTicks] = useState(false);
  const [lastUpdateCreatedAt, setLastUpdateCreatedAt] = useState<string | undefined>(undefined);
  const [isTooFar, setIsTooFar] = useState(false);
  const {
    selectedLocation,
    setSelectedLocation,
    identity,
    setVisibleLocations,
    visibleLocations,
    username,
    setReturnToMapCenter,
    setHasInitiallyCenteredMap,
  } = useAppContext();

  const location = selectedLocation;

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  const handleDeleteUpdate = useCallback(
    async (updateId: string, updateUsername: string) => {
      // Check if user owns this update
      if (!username || username !== updateUsername) {
        Alert.alert(t('error'), t('cannotDeleteOthersUpdates'));
        return;
      }

      // Show confirmation dialog
      Alert.alert(
        t('confirmDelete'),
        t('confirmDeleteUpdateMessage'),
        [
          {
            text: t('cancel'),
            style: 'cancel',
          },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await apiDeleteLocationUpdate(location!.id, updateId);

                // Remove the deleted update from the list
                setLocationUpdates((prev) => prev.filter((u) => u.id !== updateId));

                Alert.alert(t('success'), t('updateDeleted'));
              } catch (error) {
                console.error('Failed to delete update:', error);
                Alert.alert(t('error'), t('updateDeleteFailed'));
              }
            },
          },
        ],
        { cancelable: true }
      );
    },
    [username, location, t]
  );

  const handleEditUpdate = useCallback(
    (update: LocationUpdate) => {
      // Check if user owns this update
      if (!username || username !== update.username) {
        Alert.alert(t('error'), t('cannotEditOthersUpdates'));
        return;
      }

      // Set the update to edit and show the edit form
      setEditingUpdate(update);
      setAddLocationUpdate(true);
    },
    [username, t]
  );

  const handleEditLocation = useCallback(() => {
    // Check if user owns this location
    if (!username || username !== location?.username) {
      Alert.alert(t('error'), t('cannotEditOthersLocations'));
      return;
    }

    setEditingLocation(true);
  }, [username, location, t]);

  const handleDeleteLocation = useCallback(async () => {
    // Check if user owns this location
    if (!username || username !== location?.username) {
      Alert.alert(t('error'), t('cannotDeleteOthersLocations'));
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      t('confirmDeleteLocation'),
      t('confirmDeleteLocationMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Store location info before deletion
              const locationIdToDelete = location!.id;
              const deletedLocationCoords = {
                latitude: location!.latitude,
                longitude: location!.longitude,
              };

              // Store the coordinates to return to after deletion
              setReturnToMapCenter(deletedLocationCoords);

              // Reset the hasInitiallyCenteredMap flag so the map knows to re-center
              setHasInitiallyCenteredMap(false);

              // Delete from backend
              await apiDeleteLocation(locationIdToDelete);

              // Remove the deleted location from visible locations
              const updatedLocations = visibleLocations.filter(
                (loc) => loc.id !== locationIdToDelete
              );
              setVisibleLocations(updatedLocations);

              // Clear selected location
              setSelectedLocation(null);

              // Navigate back to map
              router.navigate('/');

              // Show success message AFTER map has had time to center
              // This delay ensures the map centers first before showing the alert
              setTimeout(() => {
                Alert.alert(t('success'), t('locationDeleted'));
              }, 1500); // 1.5 seconds to allow map to load and center
            } catch (error: any) {
              console.error('Failed to delete location:', error);
              // Check if it's a permission error
              if (error.response?.status === 403) {
                Alert.alert(t('error'), t('cannotDeleteOthersLocations'));
              } else {
                Alert.alert(t('error'), t('locationDeleteFailed'));
              }
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [
    username,
    location,
    t,
    visibleLocations,
    setVisibleLocations,
    setSelectedLocation,
    setReturnToMapCenter,
    setHasInitiallyCenteredMap,
    router,
  ]);

  useEffect(() => {
    if (!location) return;

    const checkDistance = async () => {
      const locationFromGPS = await getCurrentGpsLocation();
      if (!locationFromGPS) {
        return;
      }

      const tooFar = await isTooFarFromLocation(
        location,
        locationFromGPS.latitude,
        locationFromGPS.longitude
      );
      setIsTooFar(tooFar);
    };

    checkDistance();
  }, [location]);

  useEffect(() => {
    if (!location?.id) return;

    const fetchUpdates = async () => {
      try {
        const updates = await getLocationUpdates(location.id, 20);
        setLocationUpdates(
          updates.map(
            (update: {
              id: string;
              locationId: string;
              updateText: string;
              device: string;
              created: string;
              username?: string;
            }) => {
              const locale = getLocale() === 'fi' ? 'fi-FI' : 'en-US';
              const createdAt = new Date(update.created).toLocaleString(locale);
              return {
                id: update.id,
                locationId: update.locationId,
                updateText: update.updateText,
                device: update.device,
                created: createdAt,
                username: update.username,
              };
            }
          )
        );
      } catch (error) {
        console.error('Failed to fetch location updates:', error);
      }
    };
    fetchUpdates();
  }, [location?.id, lastUpdateCreatedAt]);

  useEffect(() => {
    if (location) {
      setUpdatedAvailable(location.available);
      setUpdatedTicks(location.ticks);
    }
  }, [location?.id, location?.available, location?.ticks]);

  // If no location is selected, show error
  if (!selectedLocation) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
        <Text style={{ color: foregroundColor }}>{t('locationNotSelected')}</Text>
      </View>
    );
  }

  if (addLocationUpdate) {
    return (
      <CreateNewLocationUpdate
        location={selectedLocation}
        available={updatedAvailable}
        ticks={updatedTicks}
        editingUpdate={editingUpdate}
        handleClose={() => {
          setAddLocationUpdate(false);
          setEditingUpdate(null);
        }}
        handleSavedUpdate={(available: boolean, ticks: boolean) => {
          setUpdatedAvailable(available);
          setUpdatedTicks(ticks);
          const locale = getLocale() === 'fi' ? 'fi-FI' : 'en-US';
          setLastUpdateCreatedAt(new Date().toLocaleString(locale));

          // Update the location in context to sync with map markers
          const updatedLocations = visibleLocations.map((loc) =>
            loc.id === selectedLocation.id ? { ...loc, available, ticks } : loc
          );
          setVisibleLocations(updatedLocations);

          // Update selectedLocation as well
          setSelectedLocation({ ...selectedLocation, available, ticks });
        }}
      />
    );
  } else if (editingLocation) {
    return (
      <EditLocation
        location={selectedLocation}
        onClose={() => setEditingLocation(false)}
        onLocationUpdated={(updatedLocation) => {
          setSelectedLocation(updatedLocation);
          setEditingLocation(false);
        }}
      />
    );
  } else {
    console.log(selectedLocation);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['bottom']}>
        <ScrollView
          style={[styles.container, { backgroundColor }]}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.content}>
            <MaterialCommunityIcons
              style={{ marginBottom: 10 }}
              name={getIconName(selectedLocation.type!)}
              size={52}
              color={foregroundColor}
            />
            <Text
              style={[styles.title, { color: foregroundColor }]}
              onPress={() => {
                Alert.alert(t('coordinatesCopied'));
                copyToClipboard(selectedLocation.latitude + ', ' + selectedLocation.longitude);
              }}
            >
              {selectedLocation.name}
            </Text>
            <Text style={[styles.statusText, { color: foregroundColor }]}>
              {t('inUse')}: {updatedAvailable ? t('yes') : t('no')}
            </Text>
            <Text style={[styles.statusText, { color: foregroundColor }]}>
              {t('ticksDetected')}: {updatedTicks ? t('yes') : t('no')}
            </Text>

            {/* Location owner actions */}
            {username && username === selectedLocation.username && (
              <View style={styles.locationActions}>
                <TouchableOpacity onPress={handleEditLocation} style={styles.locationEditButton}>
                  <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
                  <Text style={styles.locationActionText}>{t('editLocation')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteLocation}
                  style={styles.locationDeleteButton}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#FFFFFF" />
                  <Text style={styles.locationActionText}>{t('deleteLocation')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.updatesSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: foregroundColor, marginTop: 40, marginBottom: 20 },
                ]}
              >
                {t('latestUpdates')}
              </Text>
              {locationUpdates.map((locationUpdate, key) => (
                <View
                  key={key}
                  style={[
                    styles.updateCard,
                    {
                      backgroundColor: '#F5F5F5',
                      borderLeftColor: '#2e7d32',
                    },
                  ]}
                >
                  <View style={styles.updateHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {locationUpdate.username
                          ? locationUpdate.username.charAt(0).toUpperCase()
                          : '?'}
                      </Text>
                    </View>
                    <View style={styles.updateMeta}>
                      <Text style={[styles.username, { color: foregroundColor }]}>
                        {locationUpdate.username || 'Anonymous'}
                      </Text>
                      <Text style={[styles.timestamp, { color: '#6C6C70' }]}>
                        {locationUpdate.created}
                      </Text>
                    </View>
                    {username && username === locationUpdate.username && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => handleEditUpdate(locationUpdate)}
                          style={styles.editButton}
                        >
                          <MaterialCommunityIcons name="pencil" size={24} color="#1976d2" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteUpdate(locationUpdate.id, locationUpdate.username!)
                          }
                          style={styles.deleteButton}
                        >
                          <MaterialCommunityIcons name="delete" size={24} color="#d32f2f" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.updateMessage, { color: foregroundColor }]}>
                    {locationUpdate.updateText}
                  </Text>
                </View>
              ))}
              {locationUpdates.length === 0 && (
                <View style={[styles.emptyState, { backgroundColor: '#F5F5F5' }]}>
                  <Text style={[styles.emptyStateText, { color: '#6C6C70' }]}>
                    {t('noUpdates')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
        {!isTooFar && (
          <View
            style={[
              styles.footerBar,
              { backgroundColor: footerBackgroundColor, borderColor: footerBorderColor },
            ]}
          >
            <TouchableOpacity onPress={() => setAddLocationUpdate(true)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TabBarIcon name="plus" color="#8E8E8F" />
                <Text style={{ color: '#8E8E8F', marginLeft: 8, fontWeight: '600', fontSize: 18 }}>
                  {t('addUpdate')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  contentContainer: {
    padding: 16,
    marginBottom: 40,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  coords: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 20,
    lineHeight: 30,
  },
  updateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  updateMeta: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  updateMessage: {
    fontSize: 15,
    lineHeight: 22,
    paddingLeft: 52,
  },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  updateItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  updatesSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 80,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  locationEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 75,
    borderTopWidth: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingBottom: 20,
  },
  buttonDarkMode: {
    borderWidth: 0,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    backgroundColor: '#676767',
    borderColor: '#757575',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonLightMode: {
    borderWidth: 2,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderColor: '#656565',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
});
