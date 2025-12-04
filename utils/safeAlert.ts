import { Alert } from 'react-native';





/**
 * Safe Alert wrapper for production
 * Wraps Alert.alert in try-catch to prevent crashes
 */
export const safeAlert = (title: string, message?: string, buttons?: any[]) => {
  try {
    Alert.alert(title, message, buttons);
  } catch (error) {
    console.error('Alert failed:', error);
    // Fallback - at least log the message
    console.error('Alert message:', title, message);
  }
};
