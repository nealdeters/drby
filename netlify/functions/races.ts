import { Handler, HandlerEvent } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const SCHEDULE_KEY = 'season-schedule';
const STANDINGS_KEY = 'season-standings';
const COMPLETED_SEASONS_KEY = 'completed-seasons';
const SEASON_NUMBER_KEY = 'current-season-number';
const ROSTER_KEY = 'roster';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.headers["x-api-key"] !== process.env.API_KEY) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const siteId = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  
  if (!siteId || !token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
  }

  const store = getStore('races', { siteID: siteId, token });
  
  const segments = event.path.split('/').filter(Boolean);
  const pathId = segments.length > 3 ? segments[segments.length - 1] : null;
  const isScheduleRequest = segments.length > 3 && segments[segments.length - 1] === 'schedule';
  const isStandingsRequest = segments.length > 3 && segments[segments.length - 1] === 'standings';
  const isCompletedSeasonsRequest = segments.length > 3 && segments[segments.length - 1] === 'completed-seasons';
  const isSeasonNumberRequest = segments.length > 3 && segments[segments.length - 1] === 'season-number';
  const isRosterRequest = segments.length > 3 && segments[segments.length - 1] === 'roster';

  try {
    const method = event.httpMethod;
    console.log(`📡 Request: ${method} ${pathId ? `/races/${pathId}` : '/races'}`);

    // Handle schedule endpoint
    if (isScheduleRequest) {
      if (method === 'GET') {
        try {
          const data = await store.get(SCHEDULE_KEY);
          return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" }, 
            body: String(data || '[]') 
          };
        } catch {
          return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: '[]' };
        }
      }
      
      if (method === 'POST') {
        const body = event.body || '{}';
        const { schedule } = JSON.parse(body);
        await store.set(SCHEDULE_KEY, JSON.stringify(schedule || []));
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true }) };
      }
      
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    // Handle completed seasons endpoint
    if (isCompletedSeasonsRequest) {
      if (method === 'GET') {
        try {
          const data = await store.get(COMPLETED_SEASONS_KEY);
          return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" }, 
            body: String(data || '[]') 
          };
        } catch {
          return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: '[]' };
        }
      }
      
      if (method === 'POST') {
        const body = event.body || '{}';
        const { seasons } = JSON.parse(body);
        await store.set(COMPLETED_SEASONS_KEY, JSON.stringify(seasons || []));
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true }) };
      }
      
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    // Handle season number endpoint
    if (isSeasonNumberRequest) {
      if (method === 'GET') {
        try {
          const data = await store.get(SEASON_NUMBER_KEY);
          const number = data ? JSON.parse(String(data)) : 1;
          return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ number }) 
          };
        } catch {
          return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: 1 }) };
        }
      }
      
      if (method === 'POST') {
        const body = event.body || '{}';
        const { number } = JSON.parse(body);
        await store.set(SEASON_NUMBER_KEY, JSON.stringify(number || 1));
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true }) };
      }
      
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    // Handle roster endpoint (for persisting racer health and stats)
    if (isRosterRequest) {
      if (method === 'GET') {
        try {
          const data = await store.get(ROSTER_KEY);
          return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" }, 
            body: String(data || '[]') 
          };
        } catch {
          return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: '[]' };
        }
      }
      
      if (method === 'POST') {
        const body = event.body || '{}';
        const { roster } = JSON.parse(body);
        await store.set(ROSTER_KEY, JSON.stringify(roster || []));
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true }) };
      }
      
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    // Handle standings endpoint - dynamically calculated from race results
    if (isStandingsRequest) {
      if (method === 'GET') {
         try {
          // Get current season number first
          let currentSeasonNumber = 1;
          try {
            const seasonNumData = await store.get(SEASON_NUMBER_KEY);
            if (seasonNumData) {
              const parsed = JSON.parse(String(seasonNumData));
              currentSeasonNumber = parsed.number || 1;
            }
          } catch (err) {
            console.log('Could not get current season number, defaulting to 1');
          }
          
          // Get all races to calculate standings dynamically, but only for current season
          const { blobs } = await store.list();
          const races = await Promise.all(
            blobs
              .filter(b => b.key !== SCHEDULE_KEY && b.key !== STANDINGS_KEY && b.key !== COMPLETED_SEASONS_KEY && b.key !== SEASON_NUMBER_KEY)
              .map(async (b) => {
                const data = await store.get(b.key);
                return JSON.parse(String(data));
              })
          );
          
          // Filter races to only include current season races
          const currentSeasonRaces = races.filter(race => {
            // Race IDs are formatted as: s{seasonNum}-race-{i}-{timestamp}
            // For example: s1-race-0-1234567890
            return race.id && race.id.startsWith(`s${currentSeasonNumber}-`);
          });
          
          console.log(`📊 Found ${currentSeasonRaces.length} races for season ${currentSeasonNumber} out of ${races.length} total races`);
          
          // Calculate standings from race results - only for current season
          const standings: Record<string, number> = {};
          const processedRaces = new Set<string>(); // Track processed race IDs to avoid duplicates
          
          currentSeasonRaces.forEach(race => {
            // Skip if this race ID has already been processed (prevent duplicate counting)
            if (!race.id || processedRaces.has(race.id)) {
              console.log('⚠️ Skipping duplicate or invalid race:', race.id);
              return;
            }
            
            processedRaces.add(race.id);
            
            if (race.results && Array.isArray(race.results)) {
              // 1st place: 5 points
              if (race.results[0]) {
                standings[race.results[0]] = (standings[race.results[0]] || 0) + 5;
              }
              // 2nd place: 3 points
              if (race.results[1]) {
                standings[race.results[1]] = (standings[race.results[1]] || 0) + 3;
              }
              // 3rd place: 1 point
              if (race.results[2]) {
                standings[race.results[2]] = (standings[race.results[2]] || 0) + 1;
              }
            }
          });
          
          console.log('📊 Calculated standings from', processedRaces.size, 'unique races for season', currentSeasonNumber, ':', standings);
          return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(standings) 
          };
        } catch (err) {
          console.error('Failed to calculate standings:', err);
          return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: '{}' };
        }
      }
      
      if (method === 'POST') {
        // Keep backwards compatibility - accept posted standings but we don't really need them now
        const body = event.body || '{}';
        const { standings } = JSON.parse(body);
        await store.set(STANDINGS_KEY, JSON.stringify(standings || {}));
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true }) };
      }
      
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    // Handle regular race endpoints
    if (method === 'GET') {
      if (pathId) {
        const data = await store.get(pathId);
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: String(data || '{}') };
      } else {
        const { blobs } = await store.list();
        const races = await Promise.all(
          blobs
            .filter(b => b.key !== SCHEDULE_KEY && b.key !== STANDINGS_KEY)
            .map(async (b) => {
              const data = await store.get(b.key);
              return JSON.parse(String(data));
            })
        );
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(races) };
      }
    }

    if (method === 'POST' || method === 'PUT') {
      const body = event.body || '{}';
      const raceData = JSON.parse(body);
      const raceId = pathId || raceData.id || `race-${Date.now()}`;
      await store.set(raceId, body);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: body };
    }

    if (method === 'DELETE' && pathId) {
      await store.delete(pathId);
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
