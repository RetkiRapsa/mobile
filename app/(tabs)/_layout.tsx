import React, { useState } from 'react';
import { Modal, Pressable, TouchableOpacity, View } from 'react-native';

import { Link, Tabs, useRouter } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import AuthScreen from '@/components/AuthScreen';
import { Text } from '@/components/Themed';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import colors from '@/constants/Colors';
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
          name="createNewLocation"
          options={{
            title: isLoggedIn ? t('tabNew') : t('loginTab'),
            headerTitle: isLoggedIn ? t('headerNewLocation') : t('loginTitle'),
            tabBarIcon: ({ color }) =>
              isLoggedIn ? (
                <TabBarIcon name="plus" color={color} />
              ) : (
                <MaterialCommunityIcons
                  name="login"
                  size={28}
                  color={color}
                  style={{ marginBottom: -3 }}
                />
              ),
            headerRight: () => <HeaderRightIcon />,
            tabBarButton: (props) => {
              // If not logged in, show login modal instead of navigating
              if (!isLoggedIn) {
                const { children, style } = props;
                return (
                  <TouchableOpacity
                    style={style}
                    onPress={() => {
                      setShowLoginModal(true);
                    }}
                    activeOpacity={0.2}
                  >
                    {children}
                  </TouchableOpacity>
                );
              }
              // If logged in, use default behavior
              const { children, style, onPress } = props;
              return (
                <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.2}>
                  {children}
                </TouchableOpacity>
              );
            },
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
