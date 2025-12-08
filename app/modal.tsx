import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

import * as Clipboard from 'expo-clipboard';

import LanguageSelector from '@/components/LanguageSelector';
import colors from '@/constants/Colors';
import { useTranslation } from '@/utils/i18n';
import getOrCreateUUID from '@/utils/identity';
import { Ionicons } from '@expo/vector-icons';

import appConfig from '../app.json';

const Separator: React.FC = () => (
  <View
    style={[styles.separator, { backgroundColor: useColorScheme() === 'dark' ? '#fff' : '#ccc' }]}
  />
);

export default function InstructionsScreen() {
  const { t } = useTranslation();
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
      Alert.alert(t('copied'), t('deviceIdCopied'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      <Text style={[styles.title, { color: foregroundColor }]}>RetkiRapsa</Text>
      <Text style={{ color: foregroundColor }}>
        {t('version')} {appConfig.expo.version}
      </Text>
      <Text style={{ color: foregroundColor }}>
        {t('copyright')} {new Date().getFullYear()}
      </Text>
      <Text style={{ color: foregroundColor }}>Artur Gajewski</Text>
      <Separator />
      <LanguageSelector />
      <Separator />
      <Text style={{ color: foregroundColor }}>
        {process.env.EXPO_PUBLIC_RETKIRAPSA_API_DOMAIN === 'api.retkirapsa.com'
          ? t('poweredByVPS')
          : t('developmentVersion')}
      </Text>
      {deviceId && (
        <>
          <Text style={{ color: foregroundColor, marginTop: 20 }}>{t('deviceId')}</Text>
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
          {t('privacyNotice')}
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
