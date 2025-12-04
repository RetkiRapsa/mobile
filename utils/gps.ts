import * as Location from 'expo-location';

export const getCurrentGpsLocation = async () => {
  try {
    if (__DEV__) {
      console.log('Requesting location permissions...');
    }

    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      if (__DEV__) {
        console.log('Location permission denied');
      }
      return undefined;
    }

    if (__DEV__) {
      console.log('Getting current position...');
    }

    // Add timeout to prevent hanging - increased to 30 seconds for production
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 0,
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        if (__DEV__) {
          console.log('Location fetch timeout after 30 seconds');
        }
        resolve(null);
      }, 30000); // 30 second timeout for production
    });

    const loc = await Promise.race([locationPromise, timeoutPromise]);

    if (loc) {
      if (__DEV__) {
        console.log('Location found:', loc.coords.latitude, loc.coords.longitude);
      }
      return loc.coords;
    } else {
      if (__DEV__) {
        console.log('Location fetch timed out');
      }
      return undefined;
    }
  } catch (error) {
    // Always log errors
    console.error('Error getting GPS location:', error);
    return undefined;
  }
};
