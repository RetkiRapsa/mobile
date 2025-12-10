// Location-related constants

// Error state coordinates (used when GPS location cannot be determined)
export const ERROR_LOCATION_LATITUDE = -1000;
export const ERROR_LOCATION_LONGITUDE = -1000;

// Default fallback location (Helsinki center) when GPS times out
export const DEFAULT_LOCATION_LATITUDE = 60.1699; // Helsinki Railway Station
export const DEFAULT_LOCATION_LONGITUDE = 24.9384;

// Map configuration
export const MAP_INITIAL_DELTA = 0.01;
export const MAP_SEARCH_RADIUS = 5 * 1000; // 5 km in meters (for initial load and re-center)
export const MAP_REFRESH_RADIUS = 1000; // 1 km in meters (for refresh button)
export const MAP_MAX_FETCH_RADIUS = 500 * 1000; // 500 km max radius limit
export const MAP_MAX_SPOTS = 50;
export const MAP_REFRESH_COOLDOWN_MS = 5000; // 5 seconds
