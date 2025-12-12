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

import { useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import AuthScreen from '@/components/AuthScreen';
import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';
import Location from '@/types/Location';
import createNewLocation from '@/utils/createLocation';
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

export default function CreateNewLocationScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const {
    identity,
    visibleLocations,
    setVisibleLocations,
    isAuthenticated,
    setIsAuthenticated,
    username,
    setUsername,
  } = useAppContext();

  const [form, setForm] = useState({
    type: '',
    name: '',
    longitude: undefined as number | undefined,
    latitude: undefined as number | undefined,
    device: undefined as string | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

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
      icon: colors.light.iconColor,
      button: styles.buttonLightMode,
    }),
    []
  );

  // Check authentication on mount - show auth modal immediately if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated]);

  // Save handler
  const handleSave = useCallback(
    async (skipAuthCheck = false) => {
      if (!form.type || !form.name) {
        Alert.alert(t('notice'), t('requiredFields'));
        return;
      }

      // Check authentication before proceeding (unless we're retrying after auth)
      // Require both isAuthenticated flag AND valid username
      if (!skipAuthCheck && (!isAuthenticated || !username)) {
        console.log('[CreateLocation] Auth check failed:', { isAuthenticated, username });
        setSaveAttempted(true); // Mark that user tried to save
        setShowAuthModal(true);
        return;
      }

      console.log('[CreateLocation] Creating location with username:', username);

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
          username: username,
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
    },
    [form, identity, visibleLocations, setVisibleLocations, router, isAuthenticated, username, t]
  );

  // Render
  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.background }]}>
      {/* Info Card - First */}
      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="information" size={24} color="#2e7d32" />
        <Text style={styles.infoText}>{t('gpsLocationNote')}</Text>
      </View>

      {/* Location Name - Second */}
      <View style={styles.inputCard}>
        <Text style={styles.sectionLabel}>{t('locationName')}</Text>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: '#F5F5F5' }]}
          value={form.name}
          onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
          placeholder={t('locationNamePlaceholder')}
          placeholderTextColor="#A0A0A0"
        />
      </View>

      {/* Location Type - Third */}
      <View style={styles.typeCard}>
        <Text style={styles.sectionLabel}>{t('locationType')}</Text>
        <View style={styles.typeGrid}>
          {typeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.typeOption, form.type === option.value && styles.typeOptionSelected]}
              onPress={() => setForm((prev) => ({ ...prev, type: option.value }))}
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

      {/* Action Buttons */}
      <TouchableOpacity
        disabled={loading}
        style={[styles.saveButton, { opacity: loading ? 0.6 : 1 }]}
        onPress={() => handleSave()}
      >
        <Text style={styles.saveButtonText}>{loading ? t('loadingData') : t('save')}</Text>
      </TouchableOpacity>

      {/* Authentication Modal */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAuthModal(false);
          router.navigate('/');
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
          <AuthScreen
            onAuthSuccess={(username) => {
              setIsAuthenticated(true);
              setUsername(username);
              setShowAuthModal(false);
              // Only retry save if user previously attempted to save
              if (saveAttempted) {
                setSaveAttempted(false);
                handleSave(true);
              }
            }}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowAuthModal(false);
              router.navigate('/');
            }}
          >
            <Text style={styles.closeButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
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
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
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
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
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
  saveButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  typeOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginTop: 0,
    justifyContent: 'space-between',
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
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
