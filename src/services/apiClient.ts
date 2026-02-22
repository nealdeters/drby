import { Platform } from 'react-native';
import * as Ably from 'ably';

export const getBaseUrl = () => {
  // 1. If running in production (Netlify), use the relative path or absolute URL
  if (!__DEV__) {
    return 'https://drby-live.netlify.app';
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
  'x-api-key': import.meta.env.VITE_API_KEY as string || '',
};

// Ably Realtime client (for WebSocket connections)
let ablyClient: Ably.Realtime | null = null;

export const getAblyClient = () => {
  const ablyKey = import.meta.env.VITE_ABLY_API_KEY as string | undefined;
  console.log('[Ably] Checking for API key, found:', ablyKey ? 'yes' : 'no', 'URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
  if (!ablyClient && ablyKey) {
    ablyClient = new Ably.Realtime(ablyKey);
    console.log('[Ably] Client initialized');
    
    ablyClient.connection.on('connected', () => {
      console.log('[Ably] Connection connected');
    });
    ablyClient.connection.on('disconnected', () => {
      console.log('[Ably] Connection disconnected');
    });
    ablyClient.connection.on('failed', (err) => {
      console.log('[Ably] Connection failed:', err);
    });
  }
  return ablyClient;
};

export const getRaceChannel = (raceId: string) => {
  const client = getAblyClient();
  if (!client) {
    throw new Error('Ably client not initialized - ABLY_API_KEY not configured');
  }
  return client.channels.get(`race:${raceId}`);
};
