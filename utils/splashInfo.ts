import * as SecureStore from 'expo-secure-store';

import appConfig from '../app.json';

const STORAGE_KEY = 'retkirapsa-splash-seen';

export async function splashInfoSeen(): Promise<boolean> {
  const version = appConfig.expo.version;
  const value = await SecureStore.getItemAsync(STORAGE_KEY + version);

  if (value === null) {
    return false;
  } else {
    return true;
  }
}

export async function setSplashInfoSeen(): Promise<boolean> {
  try {
    const version = appConfig.expo.version;
    await SecureStore.setItemAsync(STORAGE_KEY + version, 'true');
    return true;
  } catch {
    return false;
  }
}
