import { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import Ably from "ably";

/**
 * Netlify Scheduled Function
 * Runs every minute to check for races that need to be started
 * @schedule * * * * *
 */

const SCHEDULE_KEY = 'season-schedule';
const TRIGGERED_RACES_KEY = 'triggered-races';

interface Race {
  id: string;
  startTime: number;
  track: any;
  racers?: string[];
}

export const handler: Handler = async (event: any) => {
  console.log('🕐 Scheduled race checker running...', { 
    timestamp: new Date().toISOString(),
    eventId: event.id 
  });

  const siteId = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const apiKey = process.env.API_KEY;

  if (!siteId || !token) {
    console.error('❌ Server configuration error: missing siteId or token');
    return { statusCode: 500, body: 'Server configuration error' };
  }

  const store = getStore('races', { siteID: siteId, token });

  try {
    const scheduleData = await store.get(SCHEDULE_KEY);
    const schedule: Race[] = scheduleData ? JSON.parse(String(scheduleData)) : [];

    const triggeredRacesData = await store.get(TRIGGERED_RACES_KEY);
    const triggeredRaces: string[] = triggeredRacesData ? JSON.parse(String(triggeredRacesData)) : [];

    const now = Date.now();
    const racesToStart = schedule.filter(race => 
      race.startTime <= now && 
      !triggeredRaces.includes(race.id)
    );

    console.log(`📋 Found ${racesToStart.length} races to start`, { 
      totalScheduled: schedule.length,
      alreadyTriggered: triggeredRaces.length,
      now: new Date(now).toISOString()
    });

    for (const race of racesToStart) {
      console.log(`🚀 Starting race: ${race.id}`, {
        startTime: new Date(race.startTime).toISOString(),
        delay: now - race.startTime
      });

      const racerIds = race.racers || [];
      
      // Need to fetch racer details from roster
      const rosterData = await store.get('roster');
      const roster = rosterData ? JSON.parse(String(rosterData)) : [];
      const selectedRacers = racerIds.map((id: string) => 
        roster.find((r: any) => r.id === id)
      ).filter(Boolean);

      if (selectedRacers.length === 0) {
        console.error(`❌ No racers found for race ${race.id}`);
        continue;
      }

      // Call race-manager to start the race
      const raceManagerUrl = process.env.URL 
        ? `https://${process.env.URL}/.netlify/functions/race-manager`
        : 'http://localhost:9999/.netlify/functions/race-manager';

      const response = await fetch(raceManagerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        },
        body: JSON.stringify({
          raceId: race.id,
          racers: selectedRacers,
          track: race.track
        })
      });

      if (response.ok) {
        console.log(`✅ Race started successfully: ${race.id}`);
        triggeredRaces.push(race.id);

        const ablyApiKey = process.env.ABLY_API_KEY;
        if (ablyApiKey) {
          try {
            const ably = new Ably.Rest(ablyApiKey);
            const controlChannel = ably.channels.get(`race:${race.id}:control`);
            await controlChannel.publish('race-trigger', {
              raceId: race.id,
              timestamp: Date.now(),
              racers: selectedRacers,
              track: race.track,
            });
            console.log(`📡 Published race-trigger to Ably for race ${race.id}`);
          } catch (ablyErr) {
            console.error(`⚠️ Failed to publish to Ably for race ${race.id}:`, ablyErr);
          }
        }
      } else {
        const error = await response.text();
        console.error(`❌ Failed to start race ${race.id}:`, error);
      }
    }

    // Save updated triggered races list
    await store.set(TRIGGERED_RACES_KEY, JSON.stringify(triggeredRaces));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        racesTriggered: racesToStart.length,
        raceIds: racesToStart.map(r => r.id)
      })
    };

  } catch (error) {
    console.error('❌ Error in scheduled race checker:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};
