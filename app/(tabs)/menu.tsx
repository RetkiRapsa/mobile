import React, { useState } from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import AuthScreen from '@/components/AuthScreen';
import MenuScreen from '@/components/MenuScreen';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useTranslation } from '@/utils/i18n';

export default function MenuTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, username, setIsAuthenticated, setUsername, setIsAdmin } =
    useAppContext();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <MenuScreen
        isAuthenticated={isAuthenticated}
        username={username}
        onLoginPress={() => setShowLoginModal(true)}
        onRegisterPress={() => setShowRegisterModal(true)}
        onNewLocationPress={() => router.push('/(tabs)/createNewLocation')}
        onFavoriteLocationsPress={() => router.push('/(tabs)/favorites')}
        onLogoutPress={() => {
          setIsAuthenticated(false);
          setUsername(null);
          setIsAdmin(false);
          router.push('/');
        }}
      />

      {/* Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <AuthScreen
            onAuthSuccess={(username, isAdmin) => {
              setIsAuthenticated(true);
              setUsername(username);
              setIsAdmin(isAdmin);
              setShowLoginModal(false);
              router.push('/');
            }}
          />
          <TouchableOpacity
            style={{
              backgroundColor: '#757575',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 12,
              margin: 20,
              alignSelf: 'center',
            }}
            onPress={() => setShowLoginModal(false)}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Register Modal */}
      <Modal
        visible={showRegisterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <AuthScreen
            onAuthSuccess={(username, isAdmin) => {
              setIsAuthenticated(true);
              setUsername(username);
              setIsAdmin(isAdmin);
              setShowRegisterModal(false);
              router.push('/');
            }}
          />
          <TouchableOpacity
            style={{
              backgroundColor: '#757575',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 12,
              margin: 20,
              alignSelf: 'center',
            }}
            onPress={() => setShowRegisterModal(false)}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
