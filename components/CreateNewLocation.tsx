import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Animated, StyleSheet, TextInput, TouchableOpacity, useColorScheme } from 'react-native';



import { useRouter } from 'expo-router';



import { useAppContext } from '@/app/_layout';
import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';
import Location from '@/types/Location';
import createNewLocation from '@/utils/createLocation';
import { hasNearbyLocations } from '@/utils/getNearbyLocationsFromCoords';
import { getCurrentGpsLocation } from '@/utils/gps';
import { useTranslation } from '@/utils/i18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import ScrollView = Animated.ScrollView;

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

// Type options will be localized in the component

const getIconName = (type: string) => {
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
    default:
      return 'map-marker-question';
  }
};

export default function CreateNewLocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { identity, visibleLocations, setVisibleLocations } = useAppContext();
  const colorScheme = useColorScheme();

  const [form, setForm] = useState({
    type: '',
    name: '',
    longitude: undefined as number | undefined,
    latitude: undefined as number | undefined,
    device: undefined as string | undefined,
  });
  const [loading, setLoading] = useState(false);

  // Localized type options
  const typeOptions = useMemo(
    () => [
      { value: LocationTypeEnum.CAMPING_AREA, label: t('typeCamping') },
      { value: LocationTypeEnum.FIREPLACE, label: t('typeFireplace') },
      { value: LocationTypeEnum.LAAVU, label: t('typeLaavu') },
      { value: LocationTypeEnum.TOILET, label: t('typeToilet') },
      { value: LocationTypeEnum.BEACH, label: t('typeBeach') },
      { value: LocationTypeEnum.BRIDGE, label: t('typeBridge') },
      { value: LocationTypeEnum.PARKING, label: t('typeParking') },
      { value: LocationTypeEnum.OTHER, label: t('typeOther') },
    ],
    [t]
  );

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

  // Warn if nearby locations exist
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        const location = await getCurrentGpsLocation();
        if (
          isActive &&
          location &&
          hasNearbyLocations(visibleLocations, location.latitude, location.longitude)
        ) {
          Alert.alert(t('notice'), t('nearbyLocationWarning'));
        }
      })();
      return () => {
        isActive = false;
      };
    }, [visibleLocations, t])
  );

  // Save handler
  const handleSave = useCallback(async () => {
    if (!form.type || !form.name) {
      Alert.alert(t('notice'), t('requiredFields'));
      return;
    }
    setLoading(true);
    const location = await getCurrentGpsLocation();
    if (!location) {
      Alert.alert(t('error'), t('locationNotLocated'));
      setLoading(false);
      return;
    }
    try {
      const newLocation: Location = await createNewLocation({
        ...form,
        longitude: location.longitude,
        latitude: location.latitude,
        device: identity || 'unknown',
      });
      if (newLocation.id) {
        setForm({
          type: '',
          name: '',
          longitude: undefined,
          latitude: undefined,
          device: undefined,
        });
        setVisibleLocations([...(visibleLocations || []), newLocation]);
        Alert.alert(`${newLocation.name} ${t('locationAdded')}`);
        router.navigate('/');
      }
    } catch {
      Alert.alert(t('error'), t('locationAddFailed'));
    }
    setLoading(false);
  }, [form, identity, visibleLocations, setVisibleLocations, router]);

  // Render
  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.background }]}>
      <Text style={{ marginBottom: 30 }}>{t('gpsLocationNote')}</Text>
      <Text style={styles.label}>{t('locationName')}:</Text>
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
        placeholder={t('locationNamePlaceholder')}
      />
      <Text style={styles.label}>{t('locationType')}:</Text>
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
        <Text style={{ color: theme.text }}>{loading ? t('loadingData') : t('save')}</Text>
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
