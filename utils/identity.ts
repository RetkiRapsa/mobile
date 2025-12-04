import 'react-native-get-random-values';

import { v4 as uuidv4 } from 'uuid';

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'retkirapsa-device-identity-uuid';

async function getOrCreateUUID(): Promise<string> {
  try {
    const savedUUID = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedUUID) {
      return savedUUID;
    }

    // Generate new UUID
    const newUUID = uuidv4();

    try {
      await AsyncStorage.setItem(STORAGE_KEY, newUUID);
    } catch (storageError) {
      // Always log storage errors even in production (critical)
      console.error('Failed to save UUID to storage:', storageError);
      // Continue anyway with the generated UUID
    }

    return newUUID;
  } catch (error) {
    // Always log identity errors (critical for debugging production issues)
    console.error('Failed to get or create identity:', error);
    // Return a fallback UUID instead of crashing
    const fallbackUUID = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (__DEV__) {
      console.error('Using fallback UUID:', fallbackUUID);
    }
    return fallbackUUID;
  }
}

export default getOrCreateUUID;
