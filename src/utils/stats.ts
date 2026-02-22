import { Racer, RaceEvent } from '../gameTypes';

export const getRacerStats = (racerId: string, roster: Racer[], schedule: RaceEvent[]) => {
  const racer = roster.find(r => r.id === racerId);
  if (!racer) return null;

  let first = 0, second = 0, third = 0, racesRun = 0;
  schedule.forEach(event => {
    if (event.completed && event.results) {
      if (event.results.includes(racerId)) {
        racesRun++;
        if (event.results[0] === racerId) first++;
        if (event.results[1] === racerId) second++;
        if (event.results[2] === racerId) third++;
      }
    }
  });

  return { ...racer, first, second, third, racesRun };
};

export interface TrackAverage {
  trackId: string;
  trackName: string;
  totalRaces: number;
  averageFinishTime: number;
  bestFinishTime: number;
  wins: number;
}

export const getRacerTrackAverages = (racerId: string, schedule: RaceEvent[]): TrackAverage[] => {
  console.log('📊 getRacerTrackAverages', { 
    racerId, 
    scheduleLength: schedule.length,
    completedRaces: schedule.filter(e => e.completed && e.results?.includes(racerId)).length,
    withFinishTimes: schedule.filter(e => e.completed && e.results?.includes(racerId) && e.finishTimes?.[racerId]).length,
    sampleWithFinishTimes: schedule.find(e => e.completed && e.results?.includes(racerId) && e.finishTimes?.[racerId])?.track
  });
  const trackMap = new Map<string, { times: number[]; wins: number; trackName: string }>();

  schedule.forEach(event => {
    if (event.completed && event.results?.includes(racerId) && event.finishTimes?.[racerId]) {
      const trackId = event.track?.id || 'unknown';
      const trackName = event.track?.name || 'Unknown Track';
      const finishTime = event.finishTimes[racerId];
      const position = event.results.indexOf(racerId);

      if (!trackMap.has(trackId)) {
        trackMap.set(trackId, { times: [], wins: 0, trackName });
      }
      const trackData = trackMap.get(trackId)!;
      trackData.times.push(finishTime);
      if (position === 0) trackData.wins++;
    }
  });

  return Array.from(trackMap.entries()).map(([trackId, data]) => ({
    trackId,
    trackName: data.trackName,
    totalRaces: data.times.length,
    averageFinishTime: Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length),
    bestFinishTime: Math.min(...data.times),
    wins: data.wins,
  })).sort((a, b) => a.trackName.localeCompare(b.trackName));
};