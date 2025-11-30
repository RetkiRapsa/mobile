import React, { useCallback, useEffect, useState } from 'react';
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
import CreateNewSpotUpdate from '@/components/CreateNewSpotUpdate';
import colors from '@/constants/Colors';
import Spot from '@/types/Spot';
import SpotUpdate from '@/types/SpotUpdate';
import { isTooFarFromSpot } from '@/utils/getNearbySpotsFromCoords';
import getSpotUpdates from '@/utils/getSpotUpdates';
import { getLocation } from '@/utils/location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

enum SpotTypeEnum {
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
    case SpotTypeEnum.CAMPING_AREA:
      return 'tent';
    case SpotTypeEnum.FIREPLACE:
      return 'campfire';
    case SpotTypeEnum.BEACH:
      return 'waves';
    case SpotTypeEnum.BRIDGE:
      return 'bridge';
    case SpotTypeEnum.LAAVU:
      return 'chevron-up-box-outline';
    case SpotTypeEnum.TOILET:
      return 'toilet';
    case SpotTypeEnum.PARKING:
      return 'parking';
    case SpotTypeEnum.OTHER:
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

export default function SpotDetailsScreen() {
  const backgroundColor =
    useColorScheme() === 'dark' ? colors.dark.background : colors.light.background;
  const footerBackgroundColor = useColorScheme() === 'dark' ? '#131313' : '#ffffff';
  const footerBorderColor = useColorScheme() === 'dark' ? '#131313' : '#cccccc';
  const foregroundColor = useColorScheme() === 'dark' ? colors.dark.text : colors.light.text;
  const route = useRoute();
  const [spotUpdates, setSpotUpdates] = useState<SpotUpdate[]>([]);
  const [addSpotUpdate, setAddSpotUpdate] = useState(false);
  const [updatedAvailable, setUpdatedAvailable] = useState(false);
  const [updatedTicks, setUpdatedTicks] = useState(false);
  const [lastUpdateCreatedAt, setLastUpdateCreatedAt] = useState<string | undefined>(undefined);
  const [isTooFar, setIsTooFar] = useState(false);
  const { spot } = route.params as { spot: Spot };
  const { identity, setVisibleSpots, visibleSpots } = useAppContext();

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  useEffect(() => {
    const checkDistance = async () => {
      const location = await getLocation();
      if (await isTooFarFromSpot(spot, location!.latitude, location!.longitude)) {
        setIsTooFar(true);
      } else {
        setIsTooFar(false);
      }
    };

    checkDistance();
  }, [spot]);

  useEffect(() => {
    const fetchUpdates = async () => {
      const updates = await getSpotUpdates(spot?.id);
      setSpotUpdates(
        updates.map((update: any) => {
          const createdAt = new Date(update.created).toLocaleString('fi-FI');
          return {
            id: update.id,
            spotId: update.spot_id,
            updateText: update.update_text,
            device: update.device,
            created: createdAt,
          };
        })
      );
    };
    fetchUpdates();
  }, [spot.id, lastUpdateCreatedAt]);

  useEffect(() => {
    if (spot) {
      setUpdatedAvailable(spot.available);
      setUpdatedTicks(spot.ticks);
    }
  }, [spot.id]);

  if (addSpotUpdate) {
    return (
      <CreateNewSpotUpdate
        spot={spot}
        available={updatedAvailable}
        ticks={updatedTicks}
        handleClose={() => setAddSpotUpdate(false)}
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
              name={getIconName(spot.type!)}
              size={52}
              color={foregroundColor}
            />
            <Text
              style={[styles.title, { color: foregroundColor }]}
              onPress={() => {
                Alert.alert('Kohteen koordinaatit kopioitu leikepöydälle');
                copyToClipboard(spot.latitude + ', ' + spot.longitude);
              }}
            >
              {spot.name}
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
              {spotUpdates.map((spotUpdate, key) => (
                <View style={{ marginBottom: 10 }} key={key}>
                  <Text style={[styles.updateItem, { color: foregroundColor }]}>
                    {spotUpdate.created}
                  </Text>
                  <Text style={[styles.updateItem, { color: foregroundColor }]}>
                    {spotUpdate.updateText}
                  </Text>
                </View>
              ))}
              {spotUpdates.length === 0 && (
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
              onPress={() => setAddSpotUpdate(true)}
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
