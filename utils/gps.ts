import * as Location from 'expo-location';

import { devLog, logError } from './logger';

export const getCurrentGpsLocation = async () => {
  try {
    devLog('Requesting location permissions...');

    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      devLog('Location permission denied');
      return undefined;
    }

    devLog('Getting current position...');

    // Add timeout to prevent hanging - increased to 30 seconds for production
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 0,
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        devLog('Location fetch timeout after 30 seconds');
        resolve(null);
      }, 30000); // 30 second timeout for production
    });

    const loc = await Promise.race([locationPromise, timeoutPromise]);

    if (loc) {
      devLog('Location found:', loc.coords.latitude, loc.coords.longitude);
      return loc.coords;
    } else {
      devLog('Location fetch timed out');
      return undefined;
    }
  } catch (error) {
    // Always log errors
    logError('Error getting GPS location:', error);
    return undefined;
  }
};
