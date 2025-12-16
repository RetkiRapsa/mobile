import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Clipboard from 'expo-clipboard';

import { useAppContext } from '@/app/_layout';
import AuthScreen from '@/components/AuthScreen';
import LanguageSelector from '@/components/LanguageSelector';
import colors from '@/constants/Colors';
import { logoutUser } from '@/utils/auth';
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
  const { username, isAuthenticated, setIsAuthenticated, setUsername, setIsAdmin } =
    useAppContext();
  const backgroundColor =
    useColorScheme() === 'dark' ? colors.dark.background : colors.light.background;
  const foregroundColor = useColorScheme() === 'dark' ? colors.dark.text : colors.light.text;
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    getOrCreateUUID().then(setDeviceId);
  }, []);

  const copyToClipboard = async () => {
    if (deviceId) {
      await Clipboard.setStringAsync(deviceId);
      Alert.alert(t('copied'), t('deviceIdCopied'));
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      // Small delay to prevent visual glitch during state transition
      setTimeout(() => {
        setIsAuthenticated(false);
        setUsername(null);
        setIsAdmin(false);
        setIsLoggingOut(false);
      }, 100);
    } catch (error) {
      setIsLoggingOut(false);
      Alert.alert(t('error'), t('unexpectedError'));
    }
  };

  const [showAuthScreen, setShowAuthScreen] = useState(false);

  // If auth screen is shown, display it as an overlay
  if (showAuthScreen) {
    return (
      <View style={{ flex: 1, backgroundColor: backgroundColor }}>
        <AuthScreen
          onAuthSuccess={(username, isAdmin) => {
            setIsAuthenticated(true);
            setUsername(username);
            setIsAdmin(isAdmin);
            setShowAuthScreen(false);
          }}
        />
        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAuthScreen(false)}>
          <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Always show settings/info screen
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['bottom']}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: backgroundColor }]}>
        <Text style={[styles.title, { color: foregroundColor }]}>RetkiRapsa</Text>
        <Text style={{ color: foregroundColor }}>
          {t('version')} {appConfig.expo.version}
        </Text>
        <Text style={{ color: foregroundColor }}>
          {t('copyright')} {new Date().getFullYear()}
        </Text>
        <Text style={{ color: foregroundColor }}>Artur Gajewski</Text>
        <Separator />

        {/* Show login button if not authenticated, otherwise show logout */}
        {!isAuthenticated || !username ? (
          <TouchableOpacity style={styles.loginButton} onPress={() => setShowAuthScreen(true)}>
            <Text style={styles.loginButtonText}>{t('loginTitle')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={{ color: foregroundColor, marginBottom: 5 }}>
              {t('loggedInAs')}: {username}
            </Text>
            <TouchableOpacity
              style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <Text style={styles.logoutButtonText}>
                {isLoggingOut ? t('loggingOut') : t('logoutButton')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Separator />
        <LanguageSelector />
        <Separator />
        <Text style={{ color: foregroundColor }}>{t('dataSources')}</Text>
        <Text style={{ color: foregroundColor }}>{t('sourceLIPAS')}</Text>
        <Separator />
        <View style={{ marginTop: 20, marginBottom: 20, width: '80%' }}>
          <Text
            style={{ fontSize: 15, marginBottom: 10, textAlign: 'center', color: foregroundColor }}
          >
            {t('privacyNotice')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
  logoutButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#757575',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    margin: 20,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
