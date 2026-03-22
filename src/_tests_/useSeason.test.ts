import { renderHook, act } from '@testing-library/react';
import { useSeason } from '../hooks/useSeason';

jest.mock('../services/racesService', () => {
  const schedule = [
    { id: 's1-race-0-1234567890', startTime: Date.now() - 1000, seed: 12345, track: { id: 't1', name: 'Test', surface: 'asphalt', length: 1000, laps: 3 }, racerIds: ['r1'], completed: false },
    { id: 's1-race-1-1234567890', startTime: Date.now() + 600000, seed: 12346, track: { id: 't1', name: 'Test', surface: 'asphalt', length: 1000, laps: 3 }, racerIds: ['r2'], completed: false },
  ];
  return {
    racesService: {
      getSeasonSchedule: jest.fn().mockResolvedValue(schedule),
      getStandings: jest.fn().mockResolvedValue({}),
      getCompletedSeasons: jest.fn().mockResolvedValue([]),
      getCurrentSeasonNumber: jest.fn().mockResolvedValue(1),
      saveSeasonSchedule: jest.fn().mockResolvedValue(undefined),
      saveStandings: jest.fn().mockResolvedValue(undefined),
      saveRoster: jest.fn().mockResolvedValue(undefined),
      resetAll: jest.fn().mockResolvedValue(undefined),
    }
  };
});

jest.mock('../services/racersService', () => ({
  racersService: {
    getAll: jest.fn().mockResolvedValue([
      { id: 'r1', name: 'Racer 1', color: '#FF0000', baseSpeed: 80, health: 100, strategy: 'balanced', trackPreference: 'asphalt', acceleration: 50, endurance: 50, consistency: 50, staminaRecovery: 50, lane: 1, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
      { id: 'r2', name: 'Racer 2', color: '#00FF00', baseSpeed: 85, health: 100, strategy: 'aggressive', trackPreference: 'dirt', acceleration: 60, endurance: 40, consistency: 50, staminaRecovery: 50, lane: 2, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
    ]),
  }
}));

jest.mock('../services/tracksService', () => ({
  tracksService: {
    getAll: jest.fn().mockResolvedValue([
      { id: 't1', name: 'Test Track', surface: 'asphalt', length: 1000, laps: 3 },
    ]),
  }
}));

describe('useSeason', () => {
  it('initializes with schedule from service', async () => {
    const { result } = renderHook(() => useSeason());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.schedule.length).toBeGreaterThan(0);
    expect(result.current.loading).toBe(false);
  });

  it('loads roster from service', async () => {
    const { result } = renderHook(() => useSeason());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.roster.length).toBeGreaterThan(0);
  });

  it('completeRace marks race as completed', async () => {
    const { result } = renderHook(() => useSeason());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const testRaceId = 's1-race-0-1234567890';

    await act(async () => {
      result.current.completeRace(testRaceId, [{ id: 'r1', name: 'Racer 1', color: '#FF0000', baseSpeed: 80, health: 100, strategy: 'balanced', trackPreference: 'asphalt', acceleration: 50, endurance: 50, consistency: 50, staminaRecovery: 50, lane: 1, progress: 0, laps: 0, totalDistance: 0, status: 'finished' as const, currentSpeed: 0, finishTime: 5000 }]);
    });

    const completedRace = result.current.schedule.find(r => r.id === testRaceId);
    expect(completedRace?.completed).toBe(true);
  });

  it('skipOverdueRace marks race as completed with empty results', async () => {
    const { result } = renderHook(() => useSeason());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const testRaceId = 's1-race-1-1234567890';

    await act(async () => {
      result.current.skipOverdueRace(testRaceId);
    });

    const completedRace = result.current.schedule.find(r => r.id === testRaceId);
    expect(completedRace?.completed).toBe(true);
  });

  it('resetSeason clears all data', async () => {
    const { result } = renderHook(() => useSeason());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      await result.current.resetSeason();
    });

    expect(result.current.schedule).toEqual([]);
    expect(result.current.currentSeasonNumber).toBe(1);
  });

  it('provides refreshFromServer function', async () => {
    const { result } = renderHook(() => useSeason());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(typeof result.current.refreshFromServer).toBe('function');
  });
});
