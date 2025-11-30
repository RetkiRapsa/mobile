import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';
import Spot from '@/types/Spot';
import createNewSpot from '@/utils/createNewSpot';
import { hasNearbySpots } from '@/utils/getNearbySpotsFromCoords';
import { getLocation } from '@/utils/location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import ScrollView = Animated.ScrollView;

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

const typeOptions = [
  { value: SpotTypeEnum.CAMPING_AREA, label: 'Telttailu' },
  { value: SpotTypeEnum.FIREPLACE, label: 'Nuotio' },
  { value: SpotTypeEnum.LAAVU, label: 'Laavu' },
  { value: SpotTypeEnum.TOILET, label: 'WC' },
  { value: SpotTypeEnum.BEACH, label: 'Uimaranta' },
  { value: SpotTypeEnum.BRIDGE, label: 'Silta' },
  { value: SpotTypeEnum.PARKING, label: 'Pysäköinti' },
  { value: SpotTypeEnum.OTHER, label: 'Muu' },
];

const getIconName = (type: string) => {
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
    default:
      return 'map-marker-question';
  }
};

export default function CreateNewSpotScreen() {
  const router = useRouter();
  const { identity, visibleSpots, setVisibleSpots } = useAppContext();
  const colorScheme = useColorScheme();

  const [form, setForm] = useState({
    type: '',
    name: '',
    longitude: undefined as number | undefined,
    latitude: undefined as number | undefined,
    device: undefined as string | undefined,
  });
  const [loading, setLoading] = useState(false);

  const theme = useMemo(
    () => ({
      background: colorScheme === 'dark' ? colors.dark.background : colors.light.background,
      text: colorScheme === 'dark' ? colors.dark.text : colors.light.text,
      inputBackground:
        colorScheme === 'dark' ? colors.dark.inputBackground : colors.light.inputBackground,
      icon: colorScheme === 'dark' ? colors.dark.iconColor : colors.light.iconColor,
      button: colorScheme === 'dark' ? styles.buttonDarkMode : styles.buttonLightMode,
    }),
    [colorScheme]
  );

  // Warn if nearby spots exist
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        const location = await getLocation();
        if (
          isActive &&
          location &&
          hasNearbySpots(visibleSpots, location.latitude, location.longitude)
        ) {
          Alert.alert(
            'Huomio',
            'Lähelläsi on kohteita 10 metrin säteellä. Varmista, ettei kohde ole jo olemassa.'
          );
        }
      })();
      return () => {
        isActive = false;
      };
    }, [visibleSpots])
  );

  // Save handler
  const handleSave = useCallback(async () => {
    if (!form.type || !form.name) {
      Alert.alert('Huomio', 'Kohteen nimi ja tyyppi ovat pakollisia kenttiä.');
      return;
    }
    setLoading(true);
    const location = await getLocation();
    if (!location) {
      Alert.alert(
        'Virhe',
        'Sijaintiasi ei voitu paikallistaa. Varmista, että sijainti on sallittu sovellukselle.'
      );
      setLoading(false);
      return;
    }
    try {
      const newSpot: Spot = await createNewSpot({
        ...form,
        longitude: location.longitude,
        latitude: location.latitude,
        device: identity || 'unknown',
      });
      if (newSpot.id) {
        setForm({
          type: '',
          name: '',
          longitude: undefined,
          latitude: undefined,
          device: undefined,
        });
        setVisibleSpots([...(visibleSpots || []), newSpot]);
        Alert.alert(`${newSpot.name} on nyt lisätty kartalle`);
        router.navigate('/');
      }
    } catch {
      Alert.alert('Virhe', 'Kohdetta ei voitu lisätä. Kokeile uudelleen myöhemmin.');
    }
    setLoading(false);
  }, [form, identity, visibleSpots, setVisibleSpots, router]);

  // Render
  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.background }]}>
      <Text style={{ marginBottom: 30 }}>
        Huom! Uusi kohde tallennetaan siihen kohtaan kartalla jossa olet GPS:n mukaan tällä
        hetkellä.
      </Text>
      <Text style={styles.label}>Kohteen nimi:</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderWidth: 2,
            borderColor: theme.text,
            backgroundColor: theme.inputBackground,
          },
        ]}
        value={form.name}
        onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
      />
      <Text style={styles.label}>Tyyppi:</Text>
      <View style={styles.typeOptionsRow}>
        {typeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.typeOption,
              {
                backgroundColor: theme.background,
                borderColor: form.type === option.value ? theme.icon : 'transparent',
              },
            ]}
            onPress={() => setForm((prev) => ({ ...prev, type: option.value }))}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={getIconName(option.value)} size={32} color={theme.icon} />
            <Text>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        disabled={loading}
        style={[theme.button, { marginTop: 10 }]}
        onPress={handleSave}
      >
        <Text style={{ color: theme.text }}>{loading ? 'Tallennetaan...' : 'Luo kohde'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 25,
    paddingTop: 20,
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  typeOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginTop: 0,
    justifyContent: 'space-between',
  },
  typeOption: {
    alignItems: 'center',
    paddingVertical: 10,
    width: '48%',
    minWidth: 150,
    marginBottom: 10,
    borderWidth: 2,
    borderRadius: 10,
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
