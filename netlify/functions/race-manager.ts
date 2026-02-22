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
  position?: number; // Current race position (1-based)
  trackPreference: 'asphalt' | 'dirt' | 'grass';
  // New attributes
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

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Handle GET request to check race status or list active races
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    const action = params.action;
    const raceIdParam = params.raceId;
    
    if (action === 'status') {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          activeRaces: Array.from(activeRaces.keys()),
          count: activeRaces.size 
        }),
      };
    }
    
    if (action === 'clear' && raceIdParam) {
      if (activeRaces.has(raceIdParam)) {
        clearInterval(activeRaces.get(raceIdParam));
        activeRaces.delete(raceIdParam);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `Cleared race ${raceIdParam}` }),
        };
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Race ${raceIdParam} not found in active races` }),
      };
    }
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeRaces: Array.from(activeRaces.keys()) }),
    };
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
    // Default values for new attributes if not present
    acceleration: r.acceleration ?? 50,
    endurance: r.endurance ?? 50,
    consistency: r.consistency ?? 50,
    staminaRecovery: r.staminaRecovery ?? 50,
  }));

  const totalDistance = track.length * track.laps;
  const updateInterval = 20; // 20ms tick for smoother simulation (50 updates/sec)
  const startTime = Date.now();

  console.log(`🏁 Race debug: track.length=${track.length}, track.laps=${track.laps}, totalDistance=${totalDistance}`);
  console.log(`🏁 Race debug: racers[0].baseSpeed=${racers[0]?.baseSpeed}, racers[0].name=${racers[0]?.name}, raceId=${raceId}`);

  // Helper function to publish with retry
  const publishWithRetry = async (channel: any, retries = 3): Promise<void> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
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
        console.log(`✅ Published race started message for ${raceId}`);
        return;
      } catch (publishErr: any) {
        console.warn(`⚠️ Publish attempt ${attempt} failed:`, publishErr.message);
        if (attempt === retries) {
          throw publishErr;
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  };

  // Publish race started with retry
  try {
    await publishWithRetry(channel);
  } catch (publishErr) {
    console.error(`❌ Failed to publish race started after retries:`, publishErr);
    activeRaces.delete(raceId);
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Service temporarily unavailable. Please try again in a moment." }),
    };
  }

  console.log(`🏁 Starting race ${raceId} with ${racers.length} racers, totalDistance=${totalDistance}m`);

  // Race simulation
  const raceInterval = setInterval(async () => {
    try {
    const now = Date.now();
    const elapsed = now - startTime;

    let allFinished = true;
    let tickCount = 0;
    
    // Debug: log first few ticks
    if (elapsed < 500) {
      console.log(`🏃 Tick at ${elapsed}ms: ${raceRacers.map(r => `${r.name}:${r.totalDistance.toFixed(1)}m`).join(', ')}`);
    }
    
    // Debug: log when race should end
    const maxDistance = Math.max(...raceRacers.map(r => r.totalDistance));
    if (maxDistance >= totalDistance * 0.9 && elapsed < 600) {
      console.log(`🏁 ${raceId}: maxDistance=${maxDistance.toFixed(1)}, totalDistance=${totalDistance}`);
    }
    const progressMap: Record<string, number> = {};
    
    // Calculate current positions based on total distance - only update every few seconds to prevent acceleration
    const shouldUpdatePositions = Math.floor(elapsed / 5000) > Math.floor((elapsed - updateInterval) / 5000); // Every 5 seconds
    if (shouldUpdatePositions) {
      const positions = [...raceRacers]
        .filter(r => r.status === 'active')
        .sort((a, b) => b.totalDistance - a.totalDistance)
        .map((racer, index) => ({ id: racer.id, position: index + 1 }));
      
      // Update racer positions
      positions.forEach(({ id, position }) => {
        const racer = raceRacers.find(r => r.id === id);
        if (racer) racer.position = position;
      });
    } else {
      // Keep existing positions if not updating to maintain consistency
      for (const racer of raceRacers) {
        if (racer.status === 'active' && !racer.position) {
          racer.position = 1; // Default position if not set
        }
      }
    }

    for (const racer of raceRacers) {
      if (racer.status !== 'active') continue;

      // Calculate race progress percentage (0-1)
      const raceProgress = racer.totalDistance / totalDistance;
      
      // Health decay during race based on strategy AND endurance attribute
      // Higher endurance = slower health decay
      const strategyBaseDecay = {
        aggressive: 0.025,    // ~0.75 health per second (fastest burn)
        balanced: 0.012,      // ~0.36 health per second (moderate)
        conservative: 0.006  // ~0.18 health per second (slowest burn)
      };
      const baseDecayRate = strategyBaseDecay[racer.strategy] || strategyBaseDecay.balanced;
      // Endurance reduces decay: (100 - endurance) / 100 gives multiplier (e.g., 80 endurance = 0.2 * decay)
      const enduranceMultiplier = Math.max(0.2, (100 - racer.endurance) / 100);
      const decayRate = baseDecayRate * enduranceMultiplier;
      racer.health = Math.max(0, (racer.health || 100) - decayRate);
      const currentHealth = racer.health;

      // Base speed calculation
      const baseSpeed = racer.baseSpeed * (updateInterval / 1000);
      
      // Acceleration boost: stronger in first 10% of race, then fades
      // Higher acceleration = bigger initial boost
      let accelerationBoost = 0;
      if (raceProgress < 0.1) {
        const accelerationFactor = racer.acceleration / 100; // 0-1
        accelerationBoost = 0.3 * accelerationFactor * (1 - raceProgress * 10); // Fades from 30% to 0%
      }
      
      // Track preference penalties/bonuses
      let trackPenalty = 0;
      if (racer.trackPreference === 'asphalt' && track.surface === 'dirt') {
        trackPenalty = 0.25;
      } else if (racer.trackPreference === 'dirt' && track.surface === 'asphalt') {
        trackPenalty = 0.25;
      } else if (racer.trackPreference === 'grass') {
        trackPenalty = -0.1;
      }
      
      // Fatigue penalty increases as health decreases
      const fatiguePenalty = Math.max(0, (100 - currentHealth) / 200);
      
      // Speed variance - based on strategy AND consistency attribute
      // Higher consistency = less variance
      const strategyBaseVariance = {
        aggressive: 0.15,   // High variance - big speed swings
        balanced: 0.08,    // Moderate variance
        conservative: 0.04 // Low variance - steadier pace
      };
      const baseVariance = strategyBaseVariance[racer.strategy] || strategyBaseVariance.balanced;
      // Consistency reduces variance: (100 - consistency) / 100 gives multiplier
      const consistencyMultiplier = Math.max(0.3, (100 - racer.consistency) / 100);
      const varianceCap = baseVariance * consistencyMultiplier;
      
      // Random speed adjustment - can be positive OR negative, bounded
      const speedAdjustment = (Math.random() - 0.5) * 2 * varianceCap; // -varianceCap to +varianceCap
      
      // Final speed with all factors
      const finalSpeed = baseSpeed * (1 + accelerationBoost + speedAdjustment - fatiguePenalty - trackPenalty);
      
      // Debug: log first tick speed
      if (elapsed < 500 && raceRacers.indexOf(racer) === 0) {
        console.log(`🏃 ${racer.name}: baseSpeed=${baseSpeed.toFixed(2)}, accelBoost=${accelerationBoost.toFixed(2)}, variance=${varianceCap.toFixed(2)}, adjust=${speedAdjustment.toFixed(2)}, fatigue=${fatiguePenalty.toFixed(2)}, final=${finalSpeed.toFixed(2)}`);
      }
      
      const previousLaps = racer.laps;
      racer.totalDistance += finalSpeed;
      
      // Calculate lap progress - distance into current lap
      const currentLapDistance = racer.totalDistance % track.length;
      racer.laps = Math.floor(racer.totalDistance / track.length);
      
      // Handle lap completion - reset progress to 0 at lap boundaries
      const wasLapCompleted = racer.laps > previousLaps;
      if (wasLapCompleted) {
        racer.progress = 0;
        
        // Injury chance increases significantly at lower health (1% base + up to 4% more at critical health)
        const injuryChance = 0.01 * (1 + Math.pow((100 - racer.health) / 100, 2) * 4);
        if (Math.random() < injuryChance && racer.health < 85) {
          racer.status = 'injured';
          racer.health = Math.max(0, racer.health - 25); // Significant health reduction on injury
          console.log(`🏥 ${racer.name} was injured during lap ${racer.laps}! Health: ${racer.health}`);
          continue; // Skip further processing for injured racer
        }
      } else {
        // Only update progress if not at a lap boundary
        racer.progress = currentLapDistance / track.length;
      }
      
      // Calculate progress as a percentage of total race distance (0-1)
      // This ensures racers complete all laps before finishing
      const raceProgressPct = Math.min(1, racer.totalDistance / totalDistance);
      progressMap[racer.id] = raceProgressPct;
      
      // Also track lap-specific progress for visual representation
      const lapProgress = currentLapDistance / track.length;
      // Store both race progress and current lap progress in the progress map
      // This allows the frontend to handle multi-lap visualization correctly

      // Check if finished
      if (racer.totalDistance >= totalDistance) {
        console.log(`🏁 ${racer.name} finished! distance=${racer.totalDistance}, totalDistance=${totalDistance}`);
        racer.status = 'finished';
        racer.finishTime = elapsed;
        // Cap distance at exact total to prevent overruns (e.g., 4003m instead of 4000m)
        racer.totalDistance = totalDistance;
        // Ensure lap count and progress align perfectly with completion
        racer.laps = track.laps;
        racer.progress = 1;
      } else {
        allFinished = false;
      }
    }
    
    // Debug: log allFinished status
    if (elapsed < 600) {
      const finishedCount = raceRacers.filter(r => r.status === 'finished').length;
      console.log(`🏁 Tick ${elapsed}ms: allFinished=${allFinished}, finished=${finishedCount}/${raceRacers.length}`);
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
    } catch (err) {
      console.error(`🏁 Race loop error for ${raceId}:`, err);
    }
  }, updateInterval);

  // Store the interval reference
  activeRaces.set(raceId, raceInterval);

  // Safety cleanup: Force stop race after 5 minutes
  setTimeout(async () => {
    if (activeRaces.has(raceId)) {
      clearInterval(activeRaces.get(raceId)!);
      activeRaces.delete(raceId);
      console.log(`⏱️ Race ${raceId} timed out after 5 minutes`);

      const results = [...raceRacers].sort((a, b) => 
        (a.finishTime || Infinity) - (b.finishTime || Infinity)
      );

      try {
        await channel.publish('race-update', {
          type: 'finished',
          raceId,
          timestamp: Date.now(),
          results,
          timedOut: true,
        } as RaceUpdate);

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
            timedOut: true,
          }));
        }
      } catch (err) {
        console.error('Failed to save timeout race results:', err);
      }
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
