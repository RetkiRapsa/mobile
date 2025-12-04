// Location-related constants

// Error state coordinates (used when GPS location cannot be determined)
export const ERROR_LOCATION_LATITUDE = -1000;
export const ERROR_LOCATION_LONGITUDE = -1000;

// Default fallback location (Helsinki center) when GPS times out
export const DEFAULT_LOCATION_LATITUDE = 60.1699; // Helsinki Railway Station
export const DEFAULT_LOCATION_LONGITUDE = 24.9384;

// Map configuration
export const MAP_INITIAL_DELTA = 0.01;
export const MAP_SEARCH_RADIUS = 1000 * 1000; // 1000 km in meters
export const MAP_MAX_SPOTS = 50;
export const MAP_REFRESH_COOLDOWN_MS = 15000; // 15 seconds

