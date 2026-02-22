import { Handler, HandlerEvent } from "@netlify/functions";
import Ably from "ably";
import { getStore } from "@netlify/blobs";

interface Racer {
  id: string;
  name: string;
  color: string;
  baseSpeed: number;
  health: number;
  strategy: 'aggressive' | 'conservative' | 'balanced';
  progress: number;
  laps: number;
  totalDistance: number;
  status: 'active' | 'finished' | 'injured' | 'waiting';
  finishTime?: number;
  position?: number;
  trackPreference: 'asphalt' | 'dirt' | 'grass';
  acceleration: number;
  endurance: number;
  consistency: number;
  staminaRecovery: number;
}

interface RaceUpdate {
  type: 'progress' | 'finished' | 'started';
  raceId: string;
  timestamp: number;
  racers?: Racer[];
  results?: Racer[];
  progressMap?: Record<string, number>;
}

interface RaceState {
  raceId: string;
  track: any;
  racers: Racer[];
  totalDistance: number;
  startTime: number;
  tickCount: number;
  isFinished: boolean;
}

const getRaceStateKey = (raceId: string) => `race-state-${raceId}`;

async function loadRaceState(store: any, raceId: string): Promise<RaceState | null> {
  const data = await store.get(getRaceStateKey(raceId));
  return data ? JSON.parse(String(data)) : null;
}

async function saveRaceState(store: any, state: RaceState): Promise<void> {
  await store.set(getRaceStateKey(state.raceId), JSON.stringify(state));
}

async function deleteRaceState(store: any, raceId: string): Promise<void> {
  await store.delete(getRaceStateKey(raceId));
}

async function publishRaceUpdate(channel: any, update: RaceUpdate): Promise<void> {
  try {
    await channel.publish('race-update', update);
  } catch (err) {
    console.error('Failed to publish update:', err);
  }
}

async function continueRace(
  ablyApiKey: string,
  state: RaceState,
  store: any,
  siteId: string,
  token: string,
  isContinuation: boolean
): Promise<{ shouldContinue: boolean; message: string }> {
  const raceId = state.raceId;
  const ably = new Ably.Rest(ablyApiKey);
  const channel = ably.channels.get(`race:${raceId}`);
  const updateInterval = 20;
  const maxDuration = 24000; // 24 seconds per invocation
  const startTime = state.startTime;
  const raceStartTime = Date.now();
  let elapsed = state.tickCount * updateInterval;

  console.log(`🏁 Running race ${raceId}, tick ${state.tickCount}, elapsed ${elapsed}ms`);

  // Run simulation for up to maxDuration
  while (Date.now() - raceStartTime < maxDuration && !state.isFinished) {
    const now = Date.now();
    elapsed = now - startTime;
    state.tickCount++;

    let allFinished = true;
    const progressMap: Record<string, number> = {};

    // Update positions every 5 seconds
    const shouldUpdatePositions = Math.floor(elapsed / 5000) > Math.floor((elapsed - updateInterval) / 5000);
    if (shouldUpdatePositions) {
      const positions = [...state.racers]
        .filter(r => r.status === 'active')
        .sort((a, b) => b.totalDistance - a.totalDistance)
        .map((racer, index) => ({ id: racer.id, position: index + 1 }));
      positions.forEach(({ id, position }) => {
        const racer = state.racers.find(r => r.id === id);
        if (racer) racer.position = position;
      });
    }

    for (const racer of state.racers) {
      if (racer.status !== 'active') continue;

      const raceProgress = racer.totalDistance / state.totalDistance;

      const strategyBaseDecay = {
        aggressive: 0.025,
        balanced: 0.012,
        conservative: 0.006
      };
      const baseDecayRate = strategyBaseDecay[racer.strategy] || strategyBaseDecay.balanced;
      const enduranceMultiplier = Math.max(0.2, (100 - racer.endurance) / 100);
      const decayRate = baseDecayRate * enduranceMultiplier;
      racer.health = Math.max(0, (racer.health || 100) - decayRate);
      const currentHealth = racer.health;

      const baseSpeed = racer.baseSpeed * (updateInterval / 1000);

      let accelerationBoost = 0;
      if (raceProgress < 0.1) {
        const accelerationFactor = racer.acceleration / 100;
        accelerationBoost = 0.3 * accelerationFactor * (1 - raceProgress * 10);
      }

      let trackPenalty = 0;
      if (racer.trackPreference === 'asphalt' && state.track.surface === 'dirt') {
        trackPenalty = 0.25;
      } else if (racer.trackPreference === 'dirt' && state.track.surface === 'asphalt') {
        trackPenalty = 0.25;
      } else if (racer.trackPreference === 'grass') {
        trackPenalty = -0.1;
      }

      const fatiguePenalty = Math.max(0, (100 - currentHealth) / 200);

      const strategyBaseVariance = {
        aggressive: 0.15,
        balanced: 0.08,
        conservative: 0.04
      };
      const baseVariance = strategyBaseVariance[racer.strategy] || strategyBaseVariance.balanced;
      const consistencyMultiplier = Math.max(0.3, (100 - racer.consistency) / 100);
      const varianceCap = baseVariance * consistencyMultiplier;
      const speedAdjustment = (Math.random() - 0.5) * 2 * varianceCap;

      const finalSpeed = baseSpeed * (1 + accelerationBoost + speedAdjustment - fatiguePenalty - trackPenalty);

      const previousLaps = racer.laps;
      racer.totalDistance += finalSpeed;
      const currentLapDistance = racer.totalDistance % state.track.length;
      racer.laps = Math.floor(racer.totalDistance / state.track.length);

      if (racer.laps > previousLaps) {
        racer.progress = 0;
        const injuryChance = 0.01 * (1 + Math.pow((100 - racer.health) / 100, 2) * 4);
        if (Math.random() < injuryChance && racer.health < 85) {
          racer.status = 'injured';
          racer.health = Math.max(0, racer.health - 25);
        }
      } else {
        racer.progress = currentLapDistance / state.track.length;
      }

      const raceProgressPct = Math.min(1, racer.totalDistance / state.totalDistance);
      progressMap[racer.id] = raceProgressPct;

      if (racer.totalDistance >= state.totalDistance) {
        racer.status = 'finished';
        racer.finishTime = elapsed;
        racer.totalDistance = state.totalDistance;
        racer.laps = state.track.laps;
        racer.progress = 1;
      } else {
        allFinished = false;
      }
    }

    // Publish progress update
    await publishRaceUpdate(channel, {
      type: 'progress',
      raceId,
      timestamp: now,
      racers: state.racers,
      progressMap,
    });

    // Check if finished
    if (allFinished) {
      state.isFinished = true;
      break;
    }

    // Small delay to prevent tight loop
    await new Promise(resolve => setTimeout(resolve, updateInterval));
  }

  // Save state
  await saveRaceState(store, state);

  if (state.isFinished) {
    console.log(`🏁 Race ${raceId} finished!`);

    const results = [...state.racers].sort((a, b) =>
      (a.finishTime || Infinity) - (b.finishTime || Infinity)
    );

    await publishRaceUpdate(channel, {
      type: 'finished',
      raceId,
      timestamp: Date.now(),
      results,
    });

    await store.set(raceId, JSON.stringify({
      id: raceId,
      track: state.track,
      results: results.map(r => r.id),
      finishTimes: results.reduce((acc, r) => {
        if (r.finishTime) acc[r.id] = r.finishTime;
        return acc;
      }, {} as Record<string, number>),
      timestamp: Date.now(),
    }));

    await deleteRaceState(store, raceId);

    return { shouldContinue: false, message: 'Race finished' };
  }

  // Race not finished - trigger continuation
  console.log(`🔄 Race ${raceId} continuing, elapsed: ${elapsed}ms, ticks: ${state.tickCount}`);

  const functionUrl = process.env.URL
    ? `https://${process.env.URL}/.netlify/functions/race-manager`
    : 'http://localhost:9999/.netlify/functions/race-manager';

  try {
    await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY || ''
      },
      body: JSON.stringify({
        raceId,
        continue: true
      })
    });
    console.log(`📡 Triggered continuation for race ${raceId}`);
  } catch (err) {
    console.error('Failed to trigger continuation:', err);
  }

  return { shouldContinue: false, message: 'Race continuing' };
}

export const handler: Handler = async (event: HandlerEvent) => {
  const clientKey = event.headers["x-api-key"];
  const systemKey = process.env.API_KEY;

  if (!clientKey || clientKey !== systemKey) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized access" }) };
  }

  const ablyApiKey = process.env.ABLY_API_KEY;
  if (!ablyApiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Ably API key not configured" }) };
  }

  const siteId = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!siteId || !token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
  }

  const store = getStore('races', { siteID: siteId, token });

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    const action = params.action;

    if (action === 'status') {
      // Check for active race states in blob store
      const keys = await store.list();
      const raceStates = [];
      for (const key of keys.blobs) {
        if (key.key.startsWith('race-state-')) {
          const data = await store.get(key.key);
          if (data) {
            const state = JSON.parse(String(data));
            raceStates.push({ raceId: state.raceId, tickCount: state.tickCount, isFinished: state.isFinished });
          }
        }
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeRaces: raceStates }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeRaces: [] }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const body = JSON.parse(event.body || '{}');
  const { raceId, racers, track, continue: isContinuation } = body;

  if (!raceId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required field: raceId" }) };
  }

  // Check if this is a continuation request
  if (isContinuation) {
    const existingState = await loadRaceState(store, raceId);
    if (!existingState) {
      return { statusCode: 404, body: JSON.stringify({ error: "Race state not found" }) };
    }

    const result = await continueRace(ablyApiKey, existingState, store, siteId, token, true);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  // New race request
  if (!racers || !track) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: racers, track" }) };
  }

  // Check if race already exists in state
  const existingState = await loadRaceState(store, raceId);
  if (existingState) {
    console.log(`Race ${raceId} already exists, returning current state`);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Race already in progress", raceId, channel: `race:${raceId}` }),
    };
  }

  const ably = new Ably.Rest(ablyApiKey);
  const channel = ably.channels.get(`race:${raceId}`);

  // Initialize race state
  const raceRacers: Racer[] = racers.map((r: any, index: number) => ({
    ...r,
    strategy: r.strategy || 'balanced',
    health: r.health || 100,
    progress: 0,
    laps: 0,
    totalDistance: 0,
    status: 'active' as const,
    lane: Math.min(index + 1, 8),
    position: index + 1,
    acceleration: r.acceleration ?? 50,
    endurance: r.endurance ?? 50,
    consistency: r.consistency ?? 50,
    staminaRecovery: r.staminaRecovery ?? 50,
  }));

  const totalDistance = track.length * track.laps;
  const startTime = Date.now();

  const raceState: RaceState = {
    raceId,
    track,
    racers: raceRacers,
    totalDistance,
    startTime,
    tickCount: 0,
    isFinished: false,
  };

  // Publish started message
  await publishRaceUpdate(channel, {
    type: 'started',
    raceId,
    timestamp: startTime,
    racers: raceRacers,
    progressMap: raceRacers.reduce((acc, r) => { acc[r.id] = 0; return acc; }, {} as Record<string, number>),
  });

  // Save initial state
  await saveRaceState(store, raceState);

  console.log(`🏁 Starting race ${raceId} with ${racers.length} racers`);

  // Start the race continuation loop
  const result = await continueRace(ablyApiKey, raceState, store, siteId, token, false);

  const responseHeaders: Record<string, string | number> = {
    "Content-Type": "application/json",
    "x-nf-max-duration": 26
  };

  return {
    statusCode: 200,
    headers: responseHeaders,
    body: JSON.stringify({
      message: "Race started",
      raceId,
      channel: `race:${raceId}`,
    }),
  };
};
