import React from 'react';
import { Pressable } from 'react-native';

import { Link, Tabs } from 'expo-router';

import { useAppContext } from '@/app/_layout';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
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
            name="help-circle-outline"
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
  const { hasReadSplashInfo } = useAppContext();
  const headerShown = useClientOnlyValue(false, true);

  // No early returns or conditional hooks
  return (
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
          title: t('tabNew'),
          headerTitle: t('headerNewLocation'),
          tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />,
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
  );
}
