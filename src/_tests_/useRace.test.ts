import { renderHook } from '@testing-library/react';
import { useRace } from '../hooks/useRace';
import { Racer, Track } from '../gameTypes';

jest.mock('../services/apiClient');

describe('useRace', () => {
  const mockTrack: Track = { id: 't1', name: 'Test', surface: 'asphalt', length: 1000, laps: 1 };
  const mockRacers: Racer[] = [
    { id: '1', name: 'R1', color: 'red', baseSpeed: 10, health: 100, strategy: 'balanced', trackPreference: 'asphalt', acceleration: 50, endurance: 50, consistency: 50, staminaRecovery: 50, lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0, finishTime: 0 },
    { id: '2', name: 'R2', color: 'blue', baseSpeed: 10, health: 100, strategy: 'balanced', trackPreference: 'asphalt', acceleration: 50, endurance: 50, consistency: 50, staminaRecovery: 50, lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0, finishTime: 0 },
  ];

  it('initializes correctly', () => {
    const { result } = renderHook(() => useRace({ racers: mockRacers, track: mockTrack, raceId: 'test-race', isActive: false }));
    expect(result.current.racers).toHaveLength(2);
    expect(result.current.isRacing).toBe(false);
    expect(Object.keys(result.current.progressMap)).toHaveLength(2);
  });

  it('initializes racers with lanes assigned', () => {
    const { result } = renderHook(() => useRace({ racers: mockRacers, track: mockTrack, raceId: 'test-race', isActive: false }));
    expect(result.current.racers[0].lane).toBe(1);
    expect(result.current.racers[1].lane).toBe(2);
  });
});
