import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import Location from '@/types/Location';
import { getFavoriteLocations, removeFavoriteLocation } from '@/utils/favorites';
import { useTranslation } from '@/utils/i18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FavoriteLocationsScreenProps {
  onLocationPress: (location: Location) => void;
}

export default function FavoriteLocationsScreen({ onLocationPress }: FavoriteLocationsScreenProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [favorites, setFavorites] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async () => {
    try {
      const data = await getFavoriteLocations();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert(t('error'), t('failedToLoadFavorites'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = (location: Location) => {
    Alert.alert(
      t('removeFavorite'),
      t('removeFavoriteConfirm').replace('{name}', location.name || t('thisLocation')),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavoriteLocation(location.id);
              setFavorites(favorites.filter((fav) => fav.id !== location.id));
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert(t('error'), t('failedToRemoveFavorite'));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.centerContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <MaterialCommunityIcons
          name="heart-outline"
          size={80}
          color={colors.tabIconDefault}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyText}>{t('noFavorites')}</Text>
        <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
          {t('noFavoritesDescription')}
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.listContainer}>
        {favorites.map((location) => (
          <View
            key={location.id}
            style={[
              styles.locationCard,
              {
                backgroundColor: colors.card || colors.background,
                borderColor: colors.border || '#e0e0e0',
              },
            ]}
          >
            <TouchableOpacity
              style={styles.locationContent}
              onPress={() => onLocationPress(location)}
            >
              <View style={styles.locationHeader}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={24}
                  color={colors.tint}
                  style={styles.locationIcon}
                />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name || t('unnamedLocation')}</Text>
                  {location.type && (
                    <Text style={[styles.locationType, { color: colors.tabIconDefault }]}>
                      {location.type}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.locationMeta}>
                {location.available !== undefined && (
                  <View style={styles.statusBadge}>
                    <MaterialCommunityIcons
                      name={location.available ? 'check-circle' : 'close-circle'}
                      size={16}
                      color={location.available ? '#4caf50' : '#f44336'}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: location.available ? '#4caf50' : '#f44336' },
                      ]}
                    >
                      {location.available ? t('available') : t('notAvailable')}
                    </Text>
                  </View>
                )}
                {location.ticks && (
                  <View style={styles.statusBadge}>
                    <MaterialCommunityIcons name="bug" size={16} color="#ff9800" />
                    <Text style={[styles.statusText, { color: '#ff9800' }]}>{t('ticks')}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFavorite(location)}
            >
              <MaterialCommunityIcons name="heart-off" size={24} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  locationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationContent: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationType: {
    fontSize: 14,
  },
  locationMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 36,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
});
