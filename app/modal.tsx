import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

import * as Clipboard from 'expo-clipboard';

import colors from '@/constants/Colors';
import getOrCreateUUID from '@/utils/identity';
import { Ionicons } from '@expo/vector-icons';

import appConfig from '../app.json';

const Separator: React.FC = () => (
  <View
    style={[styles.separator, { backgroundColor: useColorScheme() === 'dark' ? '#fff' : '#ccc' }]}
  />
);

export default function InstructionsScreen() {
  const backgroundColor =
    useColorScheme() === 'dark' ? colors.dark.background : colors.light.background;
  const foregroundColor = useColorScheme() === 'dark' ? colors.dark.text : colors.light.text;
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    getOrCreateUUID().then(setDeviceId);
  }, []);

  const copyToClipboard = async () => {
    if (deviceId) {
      await Clipboard.setStringAsync(deviceId);
      Alert.alert('Kopioitu', 'Tunniste kopioitu leikepöydälle');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      <Text style={[styles.title, { color: foregroundColor }]}>RetkiRapsa</Text>
      <Text style={{ color: foregroundColor }}>Versio {appConfig.expo.version}</Text>
      <Text style={{ color: foregroundColor }}>Copyright (c) {new Date().getFullYear()}</Text>
      <Text style={{ color: foregroundColor }}>AgaSoft / Artur Gajewski</Text>
      <Separator />
      <Text style={{ color: foregroundColor }}>
        {process.env.EXPO_PUBLIC_RETKIRAPSA_API_IP === '13.62.228.65'
          ? 'Powered by AWS'
          : 'Development version'}
      </Text>
      {deviceId && (
        <>
          <Text style={{ color: foregroundColor, marginTop: 20 }}>Tunniste:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
            <Text style={{ color: foregroundColor, marginRight: 10 }}>{deviceId}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
            <TouchableOpacity onPress={copyToClipboard}>
              <Ionicons name="copy-outline" size={20} color={foregroundColor} />
            </TouchableOpacity>
          </View>
        </>
      )}
      <Separator />
      <View style={{ marginTop: 20, marginBottom: 20, width: '80%' }}>
        <Text
          style={{ fontSize: 15, marginBottom: 10, textAlign: 'center', color: foregroundColor }}
        >
          RetkiRapsa ei kerää tai lähetä käyttäjätietoja mihinkään palveluun. Sovellus käyttää
          laitteesi sijaintia vain kartan näyttämiseen ja kohteiden näyttämiseen. Ensimmäisen
          käynnistyksen yhteydessä luodaan yksilöllinen tunniste jota käytetään raporttien
          tallentamisen yhteydessä.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
