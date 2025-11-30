import * as Location from 'expo-location';

export const getLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    return undefined;
  }

  try {
    const loc = await Location.getCurrentPositionAsync({});
    return loc.coords;
  } catch (error) {
    return undefined;
  }
};
