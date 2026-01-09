import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { logout } from '@/utils/auth';
import { useTranslation } from '@/utils/i18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MenuScreenProps {
  isAuthenticated: boolean;
  displayName: string | null; // Updated from username to displayName
  onLoginPress: () => void;
  onRegisterPress: () => void;
  onNewLocationPress: () => void;
  onFavoriteLocationsPress: () => void;
  onLogoutPress: () => void;
}

export default function MenuScreen({
  isAuthenticated,
  displayName, // Updated from username to displayName
  onLoginPress,
  onRegisterPress,
  onNewLocationPress,
  onFavoriteLocationsPress,
  onLogoutPress,
}: MenuScreenProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            onLogoutPress();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const MenuItem = ({
    icon,
    title,
    onPress,
    color,
  }: {
    icon: string;
    title: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border || '#e0e0e0' }]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={28}
        color={color || colors.tint}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuText, color && { color }]}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.tabIconDefault} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="menu"
          size={48}
          color={colors.tint}
          style={styles.headerIcon}
        />
        {isAuthenticated && displayName && (
          <Text style={styles.usernameText}>
            {t('welcome')}, {displayName}
          </Text>
        )}
      </View>

      <View style={styles.menuSection}>
        {!isAuthenticated ? (
          <>
            <MenuItem icon="login" title={t('login')} onPress={onLoginPress} />
            <MenuItem icon="account-plus" title={t('register')} onPress={onRegisterPress} />
          </>
        ) : (
          <>
            <MenuItem
              icon="map-marker-plus"
              title={t('newLocation')}
              onPress={onNewLocationPress}
            />
            <MenuItem
              icon="heart"
              title={t('favoriteLocations')}
              onPress={onFavoriteLocationsPress}
            />
            <MenuItem icon="logout" title={t('logout')} onPress={handleLogout} color="#ff3b30" />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  menuSection: {
    paddingHorizontal: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: 16,
    width: 28,
  },
  menuText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
  },
});
