import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CreateNewLocationScreen from '@/components/CreateNewLocation';

export default function CreateScreen() {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <CreateNewLocationScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
