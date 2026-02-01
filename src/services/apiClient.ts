import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getBaseUrl = () => {
  // 1. If running in production (Netlify), use the relative path or absolute URL
  if (!__DEV__) {
    return 'https://your-site-name.netlify.app';
  }

  // 2. If running locally
  // Netlify Dev binds to localhost by default. 
  // Android Emulator needs 10.0.2.2 to access host localhost.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8888';
  }

  // iOS Simulator and Web can access localhost directly
  return 'http://localhost:8888';
};

export const API_URL = `${getBaseUrl()}/.netlify/functions`; // Direct function access
// OR if you kept the redirects in netlify.toml:
// export const API_URL = `${getBaseUrl()}/api`; 

export const headers = {
  'Content-Type': 'application/json',
};
