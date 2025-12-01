import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';

import { useAppContext } from '@/app/_layout';
import CreateNewLocationUpdate from '@/components/CreateNewLocationUpdate';
import colors from '@/constants/Colors';
import Location from '@/types/Location';
import LocationUpdate from '@/types/LocationUpdate';
import getLocationUpdates from '@/utils/getLocationUpdates';
import { isTooFarFromLocation } from '@/utils/getNearbyLocationsFromCoords';
import { getCurrentGpsLocation } from '@/utils/gps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRoute } from '@react-navigation/native';

enum LocationTypeEnum {
  CAMPING_AREA = 'CAMPING_AREA',
  FIREPLACE = 'FIREPLACE',
  LAAVU = 'LAAVU',
  TOILET = 'TOILET',
  BEACH = 'BEACH',
  BRIDGE = 'BRIDGE',
  PARKING = 'PARKING',
  OTHER = 'OTHER',
}

export function getIconName(
  type: string
):
  | 'tent'
  | 'campfire'
  | 'waves'
  | 'bridge'
  | 'chevron-up-box-outline'
  | 'toilet'
  | 'parking'
  | 'map-marker-question' {
  switch (type) {
    case LocationTypeEnum.CAMPING_AREA:
      return 'tent';
    case LocationTypeEnum.FIREPLACE:
      return 'campfire';
    case LocationTypeEnum.BEACH:
      return 'waves';
    case LocationTypeEnum.BRIDGE:
      return 'bridge';
    case LocationTypeEnum.LAAVU:
      return 'chevron-up-box-outline';
    case LocationTypeEnum.TOILET:
      return 'toilet';
    case LocationTypeEnum.PARKING:
      return 'parking';
    case LocationTypeEnum.OTHER:
    default:
      return 'map-marker-question';
  }
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function LocationDetailsScreen() {
  const backgroundColor =
    useColorScheme() === 'dark' ? colors.dark.background : colors.light.background;
  const footerBackgroundColor = useColorScheme() === 'dark' ? '#131313' : '#ffffff';
  const footerBorderColor = useColorScheme() === 'dark' ? '#131313' : '#cccccc';
  const foregroundColor = useColorScheme() === 'dark' ? colors.dark.text : colors.light.text;
  const route = useRoute();
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [addLocationUpdate, setAddLocationUpdate] = useState(false);
  const [updatedAvailable, setUpdatedAvailable] = useState(false);
  const [updatedTicks, setUpdatedTicks] = useState(false);
  const [lastUpdateCreatedAt, setLastUpdateCreatedAt] = useState<string | undefined>(undefined);
  const [isTooFar, setIsTooFar] = useState(false);
  const { location } = route.params as { location: Location };
  const { identity, setVisibleLocations, visibleLocations } = useAppContext();

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  useEffect(() => {
    const checkDistance = async () => {
      const locationFromGPS = await getCurrentGpsLocation();
      if (
        await isTooFarFromLocation(location, locationFromGPS!.latitude, locationFromGPS!.longitude)
      ) {
        setIsTooFar(true);
      } else {
        setIsTooFar(false);
      }
    };

    checkDistance();
  }, [location]);

  useEffect(() => {
    const fetchUpdates = async () => {
      const updates = await getLocationUpdates(location?.id, 20);
      setLocationUpdates(
        updates.map((update: any) => {
          const createdAt = new Date(update.created).toLocaleString('fi-FI');
          return {
            id: update.id,
            locationId: update.locationId,
            updateText: update.updateText,
            device: update.device,
            created: createdAt,
          };
        })
      );
    };
    fetchUpdates();
  }, [location.id, lastUpdateCreatedAt]);

  useEffect(() => {
    if (location) {
      setUpdatedAvailable(location.available);
      setUpdatedTicks(location.ticks);
    }
  }, [location.id]);

  if (addLocationUpdate) {
    return (
      <CreateNewLocationUpdate
        location={location}
        available={updatedAvailable}
        ticks={updatedTicks}
        handleClose={() => setAddLocationUpdate(false)}
        handleSavedUpdate={(available: boolean, ticks: boolean) => {
          setUpdatedAvailable(available);
          setUpdatedTicks(ticks);
          setLastUpdateCreatedAt(new Date().toLocaleString('fi-FI'));
        }}
      />
    );
  } else {
    return (
      <>
        <ScrollView
          style={[styles.container, { backgroundColor }]}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.content}>
            <MaterialCommunityIcons
              style={{ marginBottom: 10 }}
              name={getIconName(location.type!)}
              size={52}
              color={foregroundColor}
            />
            <Text
              style={[styles.title, { color: foregroundColor }]}
              onPress={() => {
                Alert.alert('Kohteen koordinaatit kopioitu leikepöydälle');
                copyToClipboard(location.latitude + ', ' + location.longitude);
              }}
            >
              {location.name}
            </Text>
            <Text style={[styles.statusText, { color: foregroundColor }]}>
              Käytössä: {updatedAvailable ? 'Kyllä' : 'Ei'}
            </Text>
            <Text style={[styles.statusText, { color: foregroundColor }]}>
              Punkkeja havaittu: {updatedTicks ? 'Kyllä' : 'Ei'}
            </Text>

            <View style={styles.updatesSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: foregroundColor, marginTop: 40, marginBottom: 20 },
                ]}
              >
                Viimeisimmät päivitykset:
              </Text>
              {locationUpdates.map((locationUpdate, key) => (
                <View style={{ marginBottom: 10 }} key={key}>
                  <Text style={[styles.updateItem, { color: foregroundColor }]}>
                    {locationUpdate.created}
                  </Text>
                  <Text style={[styles.updateItem, { color: foregroundColor }]}>
                    {locationUpdate.updateText}
                  </Text>
                </View>
              ))}
              {locationUpdates.length === 0 && (
                <Text style={[styles.updateItem, { color: foregroundColor }]}>Ei päivityksiä</Text>
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
            <TouchableOpacity
              // @ts-ignore-next-line
              onPress={() => setAddLocationUpdate(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TabBarIcon name="plus" color="#8E8E8F" />
                <Text style={{ color: '#8E8E8F', marginLeft: 8, fontWeight: 600, fontSize: 18 }}>
                  Lisää päivitys
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </>
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
