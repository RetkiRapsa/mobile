// Safe logging utility for production builds
// In production, excessive console.log can cause crashes on Android

/**
 * Development-only logging - only logs in __DEV__ mode
 */
export const devLog = (...args: any[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

/**
 * Development-only warning - only logs in __DEV__ mode
 */
export const devWarn = (...args: any[]) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

/**
 * Development-only info - only logs in __DEV__ mode
 */
export const devInfo = (...args: any[]) => {
  if (__DEV__) {
    console.info(...args);
  }
};

/**
 * Error logging - ALWAYS logs, even in production
 */
export const logError = (...args: any[]) => {
  console.error(...args);
};

// Legacy logger object for backward compatibility
export const logger = {
  log: devLog,
  error: logError,
  warn: devWarn,
  info: devInfo,
};
