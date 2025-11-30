import { StyleSheet } from 'react-native';

import CreateNewSpot from '@/components/CreateNewSpot';
import { View } from '@/components/Themed';

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <CreateNewSpot />
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
