import { Handler, HandlerEvent } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const SCHEDULE_KEY = 'season-schedule';
const STANDINGS_KEY = 'season-standings';

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

    // Handle standings endpoint - dynamically calculated from race results
    if (isStandingsRequest) {
      if (method === 'GET') {
        try {
          // Get all races to calculate standings dynamically
          const { blobs } = await store.list();
          const races = await Promise.all(
            blobs
              .filter(b => b.key !== SCHEDULE_KEY && b.key !== STANDINGS_KEY)
              .map(async (b) => {
                const data = await store.get(b.key);
                return JSON.parse(String(data));
              })
          );
          
          // Calculate standings from race results
          const standings: Record<string, number> = {};
          races.forEach(race => {
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
          
          console.log('📊 Calculated standings from', races.length, 'races:', standings);
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
