import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import FavoriteLocationsScreen from '@/components/FavoriteLocationsScreen';
import Location from '@/types/Location';

export default function FavoritesScreen() {
  const router = useRouter();

  const handleLocationPress = (location: Location) => {
    // Navigate to location details
    router.push({
      pathname: '/locationDetails',
      params: { locationId: location.id },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <FavoriteLocationsScreen onLocationPress={handleLocationPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
