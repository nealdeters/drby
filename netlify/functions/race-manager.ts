import { Handler, HandlerEvent } from "@netlify/functions";
import Ably from "ably";
import { getStore } from "@netlify/blobs";

interface Racer {
  id: string;
  name: string;
  color: string;
  baseSpeed: number;
  health: number;
  progress: number;
  laps: number;
  totalDistance: number;
  status: 'active' | 'finished' | 'injured' | 'waiting';
  finishTime?: number;
}

interface RaceUpdate {
  type: 'progress' | 'finished' | 'started';
  raceId: string;
  timestamp: number;
  racers?: Racer[];
  results?: Racer[];
  progressMap?: Record<string, number>;
}

// Global map to track active race intervals (per raceId)
const activeRaces = new Map<string, NodeJS.Timeout>();

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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const body = JSON.parse(event.body || '{}');
  const { raceId, racers, track } = body;

  if (!raceId || !racers || !track) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: raceId, racers, track" }) };
  }

  // Check if race is already running
  if (activeRaces.has(raceId)) {
    console.log(`Race ${raceId} is already running, ignoring duplicate start request`);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: "Race already in progress",
        raceId,
        channel: `race:${raceId}`,
      }),
    };
  }

  const ably = new Ably.Rest(ablyApiKey);
  const channel = ably.channels.get(`race:${raceId}`);

  // Initialize race state
  const raceRacers: Racer[] = racers.map((r: any) => ({
    ...r,
    progress: 0,
    laps: 0,
    totalDistance: 0,
    status: 'active' as const,
  }));

  const totalDistance = track.length * track.laps;
  const updateInterval = 200; // 200ms = 5 updates/sec (faster pace)
  const startTime = Date.now();

  // Publish race started
  await channel.publish('race-update', {
    type: 'started',
    raceId,
    timestamp: startTime,
    racers: raceRacers,
    progressMap: raceRacers.reduce((acc: Record<string, number>, r: Racer) => {
      acc[r.id] = 0;
      return acc;
    }, {}),
  } as RaceUpdate);

  console.log(`🏁 Starting race ${raceId} with ${racers.length} racers`);

  // Race simulation
  const raceInterval = setInterval(async () => {
    const now = Date.now();
    const elapsed = now - startTime;

    let allFinished = true;
    const progressMap: Record<string, number> = {};

    for (const racer of raceRacers) {
      if (racer.status !== 'active') continue;

      // Calculate speed with randomness (faster pace)
      const speedVariance = 0.9 + Math.random() * 0.2; // 90% to 110% of base speed
      const speed = racer.baseSpeed * speedVariance * (updateInterval / 1000) * 1.5; // 150% speed multiplier for faster race
      
      racer.totalDistance += speed;
      racer.progress = (racer.totalDistance % track.length) / track.length;
      racer.laps = Math.floor(racer.totalDistance / track.length);
      progressMap[racer.id] = Math.min(1, racer.totalDistance / totalDistance);

      // Check if finished
      if (racer.totalDistance >= totalDistance) {
        racer.status = 'finished';
        racer.finishTime = elapsed;
        // Ensure lap count shows complete
        racer.laps = track.laps;
        racer.progress = 1;
      } else {
        allFinished = false;
      }
    }

    try {
      // Publish progress update
      await channel.publish('race-update', {
        type: 'progress',
        raceId,
        timestamp: now,
        racers: raceRacers,
        progressMap,
      } as RaceUpdate);
    } catch (err) {
      console.error('Failed to publish race update:', err);
    }

    // End race if all finished
    if (allFinished) {
      clearInterval(raceInterval);
      activeRaces.delete(raceId);
      
      console.log(`🏁 Race ${raceId} finished`);
      
      const results = [...raceRacers].sort((a, b) => 
        (a.finishTime || Infinity) - (b.finishTime || Infinity)
      );

      try {
        await channel.publish('race-update', {
          type: 'finished',
          raceId,
          timestamp: Date.now(),
          results,
        } as RaceUpdate);

        // Save results to Blobs
        const siteId = process.env.NETLIFY_SITE_ID;
        const token = process.env.NETLIFY_AUTH_TOKEN;
        if (siteId && token) {
          const store = getStore('races', { siteID: siteId, token });
          await store.set(raceId, JSON.stringify({
            id: raceId,
            track,
            results: results.map(r => r.id),
            finishTimes: results.reduce((acc, r) => {
              if (r.finishTime) acc[r.id] = r.finishTime;
              return acc;
            }, {} as Record<string, number>),
            timestamp: Date.now(),
          }));
        }
      } catch (err) {
        console.error('Failed to save race results:', err);
      }
    }
  }, updateInterval);

  // Store the interval reference
  activeRaces.set(raceId, raceInterval);

  // Safety cleanup: Force stop race after 5 minutes
  setTimeout(() => {
    if (activeRaces.has(raceId)) {
      clearInterval(activeRaces.get(raceId)!);
      activeRaces.delete(raceId);
      console.log(`⏱️ Race ${raceId} timed out after 5 minutes`);
    }
  }, 5 * 60 * 1000);

  // Return immediately - race continues in background
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      message: "Race started",
      raceId,
      channel: `race:${raceId}`,
    }),
  };
};
