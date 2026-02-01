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