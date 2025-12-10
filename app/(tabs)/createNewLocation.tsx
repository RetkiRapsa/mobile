import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CreateNewLocation from '@/components/CreateNewLocation';
import { View } from '@/components/Themed';

export default function CreateScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.container}>
        <CreateNewLocation />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
