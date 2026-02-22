import { getRacerStats } from '../utils/stats';
import { Racer, RaceEvent, Track } from '../gameTypes';

describe('stats', () => {
  const mockRacer: Racer = {
    id: '1', name: 'R1', color: 'red', baseSpeed: 10, health: 100, strategy: 'balanced', trackPreference: 'asphalt',
    acceleration: 50, endurance: 50, consistency: 50, staminaRecovery: 50,
    lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'active', currentSpeed: 0, finishTime: 0
  };
  const mockTrack: Track = { id: 't1', name: 'T1', surface: 'asphalt', length: 1000, laps: 1 };
  const mockSchedule: RaceEvent[] = [
    { id: 'r1', startTime: 0, seed: 0, track: mockTrack, racerIds: ['1', '2'], completed: true, results: ['1', '2'] },
    { id: 'r2', startTime: 0, seed: 0, track: mockTrack, racerIds: ['1', '2'], completed: true, results: ['2', '1'] },
  ];

  it('calculates stats correctly', () => {
    const stats = getRacerStats('1', [mockRacer], mockSchedule);
    expect(stats).toEqual({
      ...mockRacer,
      first: 1,
      second: 1,
      third: 0,
      racesRun: 2
    });
  });
});