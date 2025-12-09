import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';

import { useAppContext } from '@/app/_layout';
import AuthScreen from '@/components/AuthScreen';
import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';
import { MAP_MAX_SPOTS, MAP_SEARCH_RADIUS } from '@/constants/Location';
import Location from '@/types/Location';
import LocationUpdate from '@/types/LocationUpdate';
import { createLocationUpdate } from '@/utils/createLocationUpdate';
import getNearbyLocationsFromCoords from '@/utils/getNearbyLocationsFromCoords';
import { useTranslation } from '@/utils/i18n';
import { devLog } from '@/utils/logger';

import ScrollView = Animated.ScrollView;

interface FormState {
  locationId: string;
  updateText: string;
  ticks: boolean;
  available: boolean;
  device: string;
}

const getTheme = (colorScheme: string | null | undefined) => ({
  background: colorScheme === 'dark' ? colors.dark.background : colors.light.background,
  text: colorScheme === 'dark' ? colors.dark.text : colors.light.text,
  inputBackground:
    colorScheme === 'dark' ? colors.dark.inputBackground : colors.light.inputBackground,
  button: colorScheme === 'dark' ? styles.buttonDarkMode : styles.buttonLightMode,
});

type CreateNewLocationUpdateProps = {
  location: Location;
  available: boolean;
  ticks: boolean;
  handleClose: () => void;
  handleSavedUpdate: (available: boolean, ticks: boolean) => void;
};

export default function CreateNewLocationUpdate({
  location,
  available,
  ticks,
  handleClose,
  handleSavedUpdate,
}: CreateNewLocationUpdateProps) {
  const { t } = useTranslation();
  const {
    identity,
    setVisibleLocations,
    isAuthenticated,
    setIsAuthenticated,
    username,
    setUsername,
  } = useAppContext();
  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);

  const defaultForm: FormState = useMemo(
    () => ({
      locationId: location.id ?? '',
      updateText: '',
      ticks: ticks,
      available: available,
      device: identity ?? '',
    }),
    [location.id, identity, ticks, available]
  );

  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // All hooks are called before any conditional return
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      locationId: location?.id ?? '',
      device: identity ?? '',
    }));
  }, [identity, location]);

  const handleSave = useCallback(
    async (skipAuthCheck = false) => {
      if (!form.updateText) {
        Alert.alert(t('notice'), t('updateTextRequired'));
        return;
      }

      // Check authentication before proceeding (unless we're retrying after auth)
      if (!skipAuthCheck && !isAuthenticated) {
        setShowAuthModal(true);
        return;
      }

      setLoading(true);
      try {
        devLog('Creating location update with form:', {
          locationId: form.locationId,
          updateText: form.updateText,
          available: form.available,
          ticks: form.ticks,
          device: identity || 'unknown',
        });

        const newUpdate: LocationUpdate = await createLocationUpdate({
          ...form,
          device: identity || 'unknown',
          username: username,
        });

        devLog('Location update created:', newUpdate);

        if (!newUpdate.id) {
          Alert.alert(t('error'), t('updateSaveFailed'));
          setLoading(false);
          return;
        }

        // Refresh nearby locations
        const nearby = await getNearbyLocationsFromCoords(
          location.latitude,
          location.longitude,
          MAP_SEARCH_RADIUS,
          MAP_MAX_SPOTS
        );

        setVisibleLocations(nearby);
        setForm(defaultForm);
        Alert.alert(t('success'), t('updateAdded'));
        handleSavedUpdate(form.available, form.ticks);
        handleClose();
      } catch (error) {
        console.error('Failed to create location update:', error);

        // Better error messages based on error type
        let errorMessage = t('locationAddFailed');

        if (error && typeof error === 'object') {
          const err = error as any;
          if (err.response) {
            // Server responded with error
            console.error('Server error response:', err.response.data);
            console.error('Status:', err.response.status);

            if (err.response.status === 401 || err.response.status === 403) {
              errorMessage = t('authenticationFailed');
            } else if (err.response.status >= 500) {
              errorMessage = t('serverError');
            }
          } else if (err.request) {
            // Request made but no response
            console.error('No response received:', err.request);
            errorMessage = t('noConnection');
          } else if (err.message) {
            console.error('Error message:', err.message);
          }
        }

        Alert.alert(t('error'), errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      form,
      identity,
      location,
      defaultForm,
      setVisibleLocations,
      handleSavedUpdate,
      handleClose,
      t,
      isAuthenticated,
    ]
  );

  if (!location) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.background }]}>
      <Text style={styles.header}>{location.name}</Text>
      <Text style={styles.label}>{t('observationAtLocation')}</Text>
      <TextInput
        multiline
        style={[
          styles.input,
          {
            color: theme.text,
            borderWidth: 2,
            borderColor: theme.text,
            backgroundColor: theme.inputBackground,
          },
        ]}
        value={form.updateText}
        onChangeText={(updateText) => setForm((prev) => ({ ...prev, updateText }))}
      />
      <View style={styles.switchRow}>
        <Text style={[styles.label, { flex: 1 }]}>{t('locationInUse')}</Text>
        <Switch
          value={form.available}
          onValueChange={(available) => setForm((prev) => ({ ...prev, available }))}
          style={{ marginLeft: 10 }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={[styles.label, { flex: 1 }]}>{t('ticksObserved')}</Text>
        <Switch
          value={form.ticks}
          onValueChange={(ticks) => setForm((prev) => ({ ...prev, ticks }))}
          style={{ marginLeft: 10 }}
        />
      </View>
      <TouchableOpacity
        disabled={loading}
        style={[theme.button, { marginTop: 20 }]}
        onPress={() => handleSave()}
      >
        <Text style={{ color: theme.text }}>{loading ? t('saving') : t('save')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={loading}
        style={[
          theme.button,
          { marginTop: 20, backgroundColor: '#eca5a5', borderColor: '#d32f2f', borderWidth: 2 },
        ]}
        onPress={handleClose}
      >
        <Text style={{ color: '#000000' }}>{t('cancel')}</Text>
      </TouchableOpacity>

      {/* Authentication Modal */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={{ flex: 1 }}>
          <AuthScreen
            onAuthSuccess={(username) => {
              setIsAuthenticated(true);
              setUsername(username);
              setShowAuthModal(false);
              // Retry save after authentication - skip auth check since we just authenticated
              handleSave(true);
            }}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowAuthModal(false)}>
            <Text style={styles.closeButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 25,
    paddingTop: 40,
    flexGrow: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 50,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
