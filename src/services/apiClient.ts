import { Platform } from 'react-native';
import * as Ably from 'ably';
import { Centrifuge } from 'centrifuge';

export const getBaseUrl = () => {
  if (import.meta.env.VITE_DEV_URL) return import.meta.env.VITE_DEV_URL;
  if (!__DEV__) return 'https://drby-live.netlify.app';
  if (Platform.OS === 'android') return 'http://10.0.2.2:8888';
  return 'http://localhost:8888';
};

export const API_URL = `${getBaseUrl()}/.netlify/functions`;
export const headers = {
  'Content-Type': 'application/json',
  'x-api-key': import.meta.env.VITE_API_KEY as string || '',
};

export type RealtimeTransport = 'house_bus' | 'ably';
export function realtimeTransport(): RealtimeTransport {
  return (import.meta.env.VITE_REALTIME_TRANSPORT as string | undefined)?.trim() === 'ably'
    ? 'ably'
    : 'house_bus';
}

export function hasRealtimeConfigured(): boolean {
  if (realtimeTransport() === 'ably') return Boolean((import.meta.env.VITE_ABLY_API_KEY as string | undefined)?.trim());
  return Boolean(
    ((import.meta.env.VITE_HOUSE_BUS_WS_URL as string | undefined)?.trim()) ||
    ((import.meta.env.VITE_HOUSE_BUS_URL as string | undefined)?.trim()),
  );
}

const getClientId = (): string => {
  let clientId = localStorage.getItem('drby-client-id');
  if (!clientId) {
    clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('drby-client-id', clientId);
  }
  return clientId;
};
export { getClientId };

let ablyClient: Ably.Realtime | null = null;
export const getAblyClient = () => {
  const ablyKey = import.meta.env.VITE_ABLY_API_KEY as string | undefined;
  if (!ablyKey) return null;
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({ key: ablyKey, clientId: getClientId() });
    ablyClient.connection.on('connected', () => console.log('[Ably rollback] connected'));
    ablyClient.connection.on('failed', (err) => console.warn('[Ably rollback] failed', err));
  }
  return ablyClient;
};

export const getRaceChannel = (raceId: string) => {
  const client = getAblyClient();
  if (!client) throw new Error('Ably rollback not configured');
  return client.channels.get(`race:${raceId}`);
};

function houseBusWsUrl(): string {
  const explicit = (import.meta.env.VITE_HOUSE_BUS_WS_URL as string | undefined)?.trim();
  if (explicit) return explicit;
  const base = (import.meta.env.VITE_HOUSE_BUS_URL as string | undefined)?.trim().replace(/\/$/, '');
  if (base) return `${base}/connection/websocket`;
  throw new Error('Set VITE_HOUSE_BUS_WS_URL (or VITE_HOUSE_BUS_URL)');
}

function houseBusTokenUrl(raceId: string): string {
  const explicit = (import.meta.env.VITE_HOUSE_BUS_TOKEN_URL as string | undefined)?.trim();
  const base = explicit || `${API_URL}/centrifugo-token`;
  return `${base}${base.includes('?') ? '&' : '?'}raceId=${encodeURIComponent(raceId)}`;
}

async function fetchHouseBusToken(raceId: string): Promise<string> {
  const response = await fetch(houseBusTokenUrl(raceId), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`house bus token ${response.status}`);
  const data = await response.json() as { token?: string };
  if (!data.token) throw new Error('house bus token missing');
  return data.token;
}

export type RaceSubscription = { close: () => void };
export function createRaceSubscription(
  raceId: string,
  onMessage: (message: { data?: unknown }) => void,
  onAttached: () => void,
  onError: (error: unknown) => void,
): RaceSubscription {
  if (realtimeTransport() === 'ably') {
    const client = getAblyClient();
    if (!client) throw new Error('Ably rollback selected but VITE_ABLY_API_KEY is missing');
    const channel = client.channels.get(`race:${raceId}`);
    channel.on('attached', onAttached);
    channel.subscribe('race-update', onMessage);
    return { close: () => { try { channel.unsubscribe('race-update', onMessage); void channel.detach(); } catch (e) { onError(e); } } };
  }

  const client = new Centrifuge(houseBusWsUrl(), { getToken: () => fetchHouseBusToken(raceId) });
  const channel = client.newSubscription(`house:race:${raceId}`);
  channel.on('publication', (ctx: { data?: unknown }) => onMessage({ data: ctx.data }));
  channel.on('subscribed', onAttached);
  channel.on('error', onError);
  client.on('error', onError);
  channel.subscribe();
  client.connect();
  return { close: () => { try { channel.unsubscribe(); void channel.removeAllListeners(); client.disconnect(); } catch (e) { onError(e); } } };
}
