import React, { useState } from 'react';
import { Modal, Pressable, TouchableOpacity, View } from 'react-native';

import { Link, Tabs, useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import AuthScreen from '@/components/AuthScreen';
import CreateNewLocation from '@/components/CreateNewLocation';
import FavoriteLocationsScreen from '@/components/FavoriteLocationsScreen';
import MenuScreen from '@/components/MenuScreen';
import { Text } from '@/components/Themed';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import colors from '@/constants/Colors';
import Location from '@/types/Location';
import { useTranslation } from '@/utils/i18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

// Header right icon component
function HeaderRightIcon() {
  return (
    <Link href="/modal" asChild>
      <Pressable>
        {({ pressed }) => (
          <MaterialCommunityIcons
            style={{ marginRight: 15 }}
            name="cog-outline"
            size={25}
            color="#007AFF"
          />
        )}
      </Pressable>
    </Link>
  );
}

export default function TabLayout() {
  // All hooks are called unconditionally at the top
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const {
    hasReadSplashInfo,
    isAuthenticated,
    username,
    setIsAuthenticated,
    setUsername,
    setIsAdmin,
  } = useAppContext();
  const headerShown = useClientOnlyValue(false, true);
  const isLoggedIn = isAuthenticated && username;
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNewLocationModal, setShowNewLocationModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const backgroundColor = colors.light.background;

  // No early returns or conditional hooks
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: hasReadSplashInfo ? t('tabMap') : t('headerWelcome'),
            headerTitle: hasReadSplashInfo ? t('headerMap') : t('headerReadFirst'),
            tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
            headerRight: () => <HeaderRightIcon />,
            tabBarStyle: { display: hasReadSplashInfo ? 'flex' : 'none' },
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: t('menu'),
            headerTitle: t('menu'),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="menu"
                size={28}
                color={color}
                style={{ marginBottom: -3 }}
              />
            ),
            headerRight: () => <HeaderRightIcon />,
          }}
        />
        <Tabs.Screen
          name="createNewLocation"
          options={{
            href: null, // Hidden from tab bar, but accessible via navigation
            title: t('headerNewLocation'),
            headerTitle: t('headerNewLocation'),
            tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />,
            headerRight: () => <HeaderRightIcon />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            href: null, // Hidden from tab bar, but accessible via navigation
            title: t('favoriteLocations'),
            headerTitle: t('favoriteLocations'),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="heart"
                size={28}
                color={color}
                style={{ marginBottom: -3 }}
              />
            ),
            headerRight: () => <HeaderRightIcon />,
          }}
        />
        <Tabs.Screen
          name="info"
          options={{
            title: t('tabInfo'),
            tabBarIcon: ({ color }) => <TabBarIcon name="info" color={color} />,
            headerRight: () => <HeaderRightIcon />,
          }}
        />
      </Tabs>

      {/* Login Modal Overlay */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: backgroundColor }}>
          <AuthScreen
            onAuthSuccess={(username, isAdmin) => {
              setIsAuthenticated(true);
              setUsername(username);
              setIsAdmin(isAdmin);
              setShowLoginModal(false);
              // Navigate back to map view after successful login
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
    </>
  );
}
