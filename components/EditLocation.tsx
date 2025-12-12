import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Text as RNText,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { useAppContext } from '@/app/_layout';
import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';
import Location from '@/types/Location';
import { apiUpdateLocation } from '@/utils/client';
import { getCurrentGpsLocation } from '@/utils/gps';
import { useTranslation } from '@/utils/i18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

interface EditLocationProps {
  location: Location;
  onClose: () => void;
  onLocationUpdated: (updatedLocation: Location) => void;
}

export default function EditLocation({ location, onClose, onLocationUpdated }: EditLocationProps) {
  const { t, locale } = useTranslation();
  const { visibleLocations, setVisibleLocations } = useAppContext();

  const [form, setForm] = useState({
    type: location.type || '',
    name: location.name || '',
    longitude: location.longitude,
    latitude: location.latitude,
  });
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

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
    [t, locale]
  );

  const theme = useMemo(
    () => ({
      background: colors.light.background,
      text: colors.light.text,
      inputBackground: colors.light.inputBackground,
      inputBorder: colors.light.inputBorder,
      placeholderText: colors.light.placeholderText,
    }),
    []
  );

  const handleUpdate = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert(t('error'), t('locationNameRequired'));
      return;
    }

    if (!form.type) {
      Alert.alert(t('error'), t('selectLocationType'));
      return;
    }

    setLoading(true);

    try {
      const response = await apiUpdateLocation(location.id, {
        name: form.name.trim(),
        type: form.type,
        latitude: form.latitude,
        longitude: form.longitude,
      });

      const updatedLocation: Location = {
        ...location,
        name: response.data.name,
        type: response.data.type,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
      };

      // Update in visible locations
      const updatedLocations = visibleLocations.map((loc) =>
        loc.id === location.id ? updatedLocation : loc
      );
      setVisibleLocations(updatedLocations);

      Alert.alert(t('success'), t('locationUpdated'));
      onLocationUpdated(updatedLocation);
      onClose();
    } catch (error: any) {
      console.error('Failed to update location:', error);
      Alert.alert(t('error'), error.message || t('locationUpdateFailed'));
    } finally {
      setLoading(false);
    }
  }, [form, location, t, visibleLocations, setVisibleLocations, onLocationUpdated, onClose]);

  const handleSetCurrentLocation = useCallback(async () => {
    setFetchingLocation(true);

    try {
      const coords = await getCurrentGpsLocation();

      if (coords) {
        setForm((prev) => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
        Alert.alert(t('success'), t('locationCoordinatesUpdated'));
      } else {
        Alert.alert(t('error'), t('failedToGetLocation'));
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
      Alert.alert(t('error'), t('failedToGetLocation'));
    } finally {
      setFetchingLocation(false);
    }
  }, [t]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('editLocation')}</Text>
      </View>

      {/* Name Input */}
      <View style={styles.inputCard}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>{t('locationName')}</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
          ]}
          placeholder={t('enterLocationName')}
          placeholderTextColor={theme.placeholderText}
          value={form.name}
          onChangeText={(name) => setForm({ ...form, name })}
        />
      </View>

      {/* Type Selection */}
      <View style={styles.typeCard}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>{t('locationType')}</Text>
        <View style={styles.typeGrid}>
          {typeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.typeOption, form.type === option.value && styles.typeOptionSelected]}
              onPress={() => setForm({ ...form, type: option.value })}
              activeOpacity={0.7}
            >
              <View
                style={[styles.iconCircle, form.type === option.value && styles.iconCircleSelected]}
              >
                <MaterialCommunityIcons
                  name={getIconName(option.value)}
                  size={28}
                  color={form.type === option.value ? '#FFFFFF' : '#2e7d32'}
                />
              </View>
              <RNText
                style={[styles.typeLabel, form.type === option.value && styles.typeLabelSelected]}
              >
                {option.label}
              </RNText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Coordinates Display (read-only) */}
      <View style={styles.inputCard}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>{t('coordinates')}</Text>
        <View style={styles.coordsRow}>
          <View style={styles.coordsContainer}>
            <Text style={[styles.coordsText, { color: theme.text }]}>
              {form.latitude?.toFixed(6)}, {form.longitude?.toFixed(6)}
            </Text>
          </View>
          <TouchableOpacity
            disabled={fetchingLocation}
            style={[styles.locationButton, { opacity: fetchingLocation ? 0.6 : 1 }]}
            onPress={handleSetCurrentLocation}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#FFFFFF" />
            <Text style={styles.locationButtonText}>
              {fetchingLocation ? t('locationUpdating') : t('setCurrentLocation')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        disabled={loading}
        style={[styles.saveButton, { opacity: loading ? 0.6 : 1 }]}
        onPress={handleUpdate}
      >
        <Text style={styles.saveButtonText}>
          {loading ? t('loadingData') : t('updateLocation')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity disabled={loading} style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  typeOption: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F5F5F5',
  },
  typeOptionSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleSelected: {
    backgroundColor: '#2e7d32',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  coordsRow: {
    flexDirection: 'column',
    gap: 12,
  },
  coordsContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  coordsText: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d32f2f',
    marginBottom: 40,
  },
  cancelButtonText: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: '600',
  },
});
