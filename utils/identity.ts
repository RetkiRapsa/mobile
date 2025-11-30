import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'retkirapsa-device-identity-uuid';

async function getOrCreateUUID(): Promise<string> {
  try {
    const savedUUID = await AsyncStorage.getItem(STORAGE_KEY);
    if (!savedUUID) {
      const newUUID = uuidv4();
      await AsyncStorage.setItem(STORAGE_KEY, newUUID);
      return newUUID;
    }
    return savedUUID;
  } catch (error) {
    throw new Error('Failed to get or create identity');
  }
}

export default getOrCreateUUID;
