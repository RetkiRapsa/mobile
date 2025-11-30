import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Animated, StyleSheet, Switch, TextInput, TouchableOpacity, useColorScheme } from 'react-native';



import { useAppContext } from '@/app/_layout';
import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';
import Location from '@/types/Location';
import LocationUpdate from '@/types/LocationUpdate';
import createNewUpdate from '@/utils/createNewUpdate';
import getNearbyLocationsFromCoords from '@/utils/getNearbyLocationsFromCoords';

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
  const { identity, setVisibleLocations, visibleLocations } = useAppContext();
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
    [location, identity]
  );

  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);

  // All hooks are called before any conditional return
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      locationId: location?.id ?? '',
      device: identity ?? '',
    }));
  }, [identity, location]);

  const handleSave = useCallback(async () => {
    if (!form.updateText) {
      Alert.alert('Huomio', 'Päivitysteksti on pakollinen.');
      return;
    }
    setLoading(true);
    try {
      const newUpdate: LocationUpdate = await createNewUpdate({
        ...form,
        device: identity || 'unknown',
      });

      if (newUpdate.id) {
        const INITIAL_DELTA = 0.01;
        const REFRESH_COOLDOWN_MS = 15000;
        const SEARCH_RADIUS = 1000 * 1000;
        const MAX_SPOTS = 50;

        await getNearbyLocationsFromCoords(
          location.latitude,
          location.longitude,
          SEARCH_RADIUS,
          MAX_SPOTS
        ).then((nearby) => {
          setVisibleLocations(nearby);
          setForm(defaultForm);
          Alert.alert('Päivityksesi on nyt lisätty kohteeseen.');
          handleSavedUpdate(form.available, form.ticks);
          handleClose();
        });
      }
    } catch {
      Alert.alert('Virhe', 'Päivitystäsi ei voitu lisätä kohteeseen. Kokeile uudelleen myöhemmin.');
    }
    setLoading(false);
  }, [form, identity, defaultForm]);

  if (!location) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Ladataan...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.background }]}>
      <Text style={styles.header}>{location.name}</Text>
      <Text style={styles.label}>Havaintosi kohteessa:</Text>
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
        <Text style={[styles.label, { flex: 1 }]}>Kohde käytössä</Text>
        <Switch
          value={form.available}
          onValueChange={(available) => setForm((prev) => ({ ...prev, available }))}
          style={{ marginLeft: 10 }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={[styles.label, { flex: 1 }]}>Punkkeja havaittu</Text>
        <Switch
          value={form.ticks}
          onValueChange={(ticks) => setForm((prev) => ({ ...prev, ticks }))}
          style={{ marginLeft: 10 }}
        />
      </View>
      <TouchableOpacity
        disabled={loading}
        style={[theme.button, { marginTop: 20 }]}
        onPress={handleSave}
      >
        <Text style={{ color: theme.text }}>{loading ? 'Tallennetaan...' : 'Tallenna'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        disabled={loading}
        style={[
          theme.button,
          { marginTop: 20, backgroundColor: '#eca5a5', borderColor: '#d32f2f', borderWidth: 2 },
        ]}
        onPress={handleClose}
      >
        <Text style={{ color: '#000000' }}>Peruuta</Text>
      </TouchableOpacity>
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
});
