import { StyleSheet } from 'react-native';

import CreateNewLocation from '@/components/CreateNewLocation';
import { View } from '@/components/Themed';

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <CreateNewLocation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
