import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';

import { useAppContext } from '@/app/_layout';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  addFavoriteLocation,
  checkFavoriteLocation,
  removeFavoriteLocation,
} from '@/utils/favorites';
import { useTranslation } from '@/utils/i18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FavoriteButtonProps {
  locationId: string;
  size?: number;
}

/**
 * FavoriteButton component for toggling favorite status of a location
 *
 * Usage:
 * <FavoriteButton locationId={location.id} size={28} />
 */
export default function FavoriteButton({ locationId, size = 28 }: FavoriteButtonProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAppContext();

  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load favorite status when component mounts or authentication changes
  useEffect(() => {
    if (isAuthenticated && locationId) {
      loadFavoriteStatus();
    } else {
      setIsFavorite(false);
    }
  }, [isAuthenticated, locationId]);

  const loadFavoriteStatus = async () => {
    try {
      const status = await checkFavoriteLocation(locationId);
      setIsFavorite(status);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    // Require authentication
    if (!isAuthenticated) {
      Alert.alert(t('authenticationRequired'), t('pleaseLoginToUseFavorites'), [{ text: t('ok') }]);
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await removeFavoriteLocation(locationId);
        setIsFavorite(false);
        Alert.alert(t('success'), t('favoriteRemoved'));
      } else {
        await addFavoriteLocation(locationId);
        setIsFavorite(true);
        Alert.alert(t('success'), t('favoriteAdded'));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert(t('error'), isFavorite ? t('failedToRemoveFavorite') : t('failedToAddFavorite'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggleFavorite}
      disabled={loading}
      style={{ opacity: loading ? 0.5 : 1 }}
    >
      <MaterialCommunityIcons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? '#ff3b30' : colors.tint}
      />
    </TouchableOpacity>
  );
}
