import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { useAppContext } from '@/app/_layout';
import AuthScreen from '@/components/AuthScreen';
import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';
import { MAP_MAX_SPOTS, MAP_SEARCH_RADIUS } from '@/constants/Location';
import Location from '@/types/Location';
import LocationUpdate from '@/types/LocationUpdate';
import { apiUpdateLocationUpdate } from '@/utils/client';
import { createLocationUpdate } from '@/utils/createLocationUpdate';
import getNearbyLocationsFromCoords from '@/utils/getNearbyLocationsFromCoords';
import { useTranslation } from '@/utils/i18n';
import { devLog } from '@/utils/logger';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScrollView = Animated.ScrollView;

interface FormState {
  locationId: string;
  updateText: string;
  ticks: boolean;
  available: boolean;
  device: string;
}

const getTheme = () => ({
  background: colors.light.background,
  text: colors.light.text,
  inputBackground: colors.light.inputBackground,
  button: styles.buttonLightMode,
});

type CreateNewLocationUpdateProps = {
  location: Location;
  available: boolean;
  ticks: boolean;
  editingUpdate?: LocationUpdate | null;
  handleClose: () => void;
  handleSavedUpdate: (available: boolean, ticks: boolean) => void;
};

export default function CreateNewLocationUpdate({
  location,
  available,
  ticks,
  editingUpdate,
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
    setIsAdmin,
  } = useAppContext();
  const theme = useMemo(() => getTheme(), []);

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
  const [saveAttempted, setSaveAttempted] = useState(false);

  // All hooks are called before any conditional return
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      locationId: location?.id ?? '',
      device: identity ?? '',
    }));
  }, [identity, location]);

  // Populate form with editing data if editingUpdate is provided
  useEffect(() => {
    if (editingUpdate) {
      setForm({
        locationId: location.id ?? '',
        updateText: editingUpdate.updateText || '',
        ticks: ticks,
        available: available,
        device: identity ?? '',
      });
    }
  }, [editingUpdate, location.id, identity, ticks, available]);

  // Check authentication on mount - show auth modal immediately if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !username) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, username]);

  const handleSave = useCallback(
    async (skipAuthCheck = false) => {
      if (!form.updateText) {
        Alert.alert(t('notice'), t('updateTextRequired'));
        return;
      }

      // Check authentication before proceeding (unless we're retrying after auth)
      // Require both isAuthenticated flag AND valid username
      if (!skipAuthCheck && (!isAuthenticated || !username)) {
        console.log('[CreateLocationUpdate] Auth check failed:', { isAuthenticated, username });
        setSaveAttempted(true); // Mark that user tried to save
        setShowAuthModal(true);
        return;
      }

      console.log('[CreateLocationUpdate] Creating/updating update with username:', username);

      setLoading(true);
      try {
        let newUpdate: LocationUpdate;

        if (editingUpdate) {
          // Update existing update
          devLog('Updating location update with form:', {
            locationId: form.locationId,
            updateId: editingUpdate.id,
            updateText: form.updateText,
            available: form.available,
            ticks: form.ticks,
            device: identity || 'unknown',
            username: username,
          });

          const response = await apiUpdateLocationUpdate(form.locationId, editingUpdate.id, {
            updateText: form.updateText,
            available: form.available,
            ticks: form.ticks,
            device: identity || 'unknown',
            username: username,
          });

          newUpdate = response.data;
          devLog('Location update updated:', newUpdate);
        } else {
          // Create new update
          devLog('Creating location update with form:', {
            locationId: form.locationId,
            updateText: form.updateText,
            available: form.available,
            ticks: form.ticks,
            device: identity || 'unknown',
            username: username,
          });

          newUpdate = await createLocationUpdate({
            ...form,
            device: identity || 'unknown',
            username: username,
          });

          devLog('Location update created:', newUpdate);
        }

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
      username,
      editingUpdate,
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
      {/* Header Card */}
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="map-marker" size={24} color="#2e7d32" />
        <View style={styles.headerContent}>
          <Text style={styles.locationName}>{location.name}</Text>
        </View>
      </View>

      {/* Update Text Card */}
      <View style={styles.inputCard}>
        <Text style={styles.sectionLabel}>{t('observationAtLocation')}</Text>
        <TextInput
          multiline
          numberOfLines={6}
          style={[styles.textArea, { color: theme.text }]}
          value={form.updateText}
          onChangeText={(updateText) => setForm((prev) => ({ ...prev, updateText }))}
          placeholder={t('observationAtLocation')}
          placeholderTextColor="#A0A0A0"
        />
      </View>

      {/* Status Toggles Card */}
      <View style={styles.togglesCard}>
        <Text style={styles.sectionLabel}>Status</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <View style={styles.toggleHeader}>
              <MaterialCommunityIcons
                name="checkbox-marked-circle"
                size={24}
                color={form.available ? '#2e7d32' : '#9E9E9E'}
              />
              <Text style={styles.toggleLabel}>{t('locationInUse')}</Text>
            </View>
            <Text style={styles.toggleStatus}>{form.available ? t('yes') : t('no')}</Text>
          </View>
          <Switch
            value={form.available}
            onValueChange={(available) => setForm((prev) => ({ ...prev, available }))}
            trackColor={{ false: '#D1D1D6', true: '#a5d6a7' }}
            thumbColor={form.available ? '#2e7d32' : '#f4f3f4'}
            ios_backgroundColor="#D1D1D6"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <View style={styles.toggleHeader}>
              <MaterialCommunityIcons
                name="bug"
                size={24}
                color={form.ticks ? '#2e7d32' : '#9E9E9E'}
              />
              <Text style={styles.toggleLabel}>{t('ticksObserved')}</Text>
            </View>
            <Text style={styles.toggleStatus}>{form.ticks ? t('yes') : t('no')}</Text>
          </View>
          <Switch
            value={form.ticks}
            onValueChange={(ticks) => setForm((prev) => ({ ...prev, ticks }))}
            trackColor={{ false: '#D1D1D6', true: '#a5d6a7' }}
            thumbColor={form.ticks ? '#2e7d32' : '#f4f3f4'}
            ios_backgroundColor="#D1D1D6"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        disabled={loading}
        style={[styles.saveButton, { opacity: loading ? 0.6 : 1 }]}
        onPress={() => handleSave()}
      >
        <Text style={styles.saveButtonText}>{loading ? t('saving') : t('save')}</Text>
      </TouchableOpacity>

      <TouchableOpacity disabled={loading} style={styles.cancelButton} onPress={handleClose}>
        <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
      </TouchableOpacity>

      {/* Authentication Modal */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAuthModal(false);
          handleClose();
        }}
      >
        <View style={{ flex: 1 }}>
          <AuthScreen
            onAuthSuccess={(username, isAdmin) => {
              setIsAuthenticated(true);
              setUsername(username);
              setIsAdmin(isAdmin);
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
              handleClose();
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
    padding: 20,
    paddingTop: 20,
    flexGrow: 1,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  locationName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
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
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#F5F5F5',
  },
  togglesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  toggleLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  toggleStatus: {
    fontSize: 14,
    color: '#6C6C70',
    marginLeft: 32,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 12,
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
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d32f2f',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: '600',
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
