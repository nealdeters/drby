import { renderHook, act } from '@testing-library/react-hooks';
import { useRace } from '../useRace';
import { Racer, Track } from '../gameTypes';

// Mock Reanimated functions since we are not in a Reanimated environment
jest.mock('react-native-reanimated', () => ({
  makeMutable: (val: any) => ({ value: val }),
  useSharedValue: (val: any) => ({ value: val }),
  withSpring: jest.fn(),
}));

describe('useRace', () => {
  const mockTrack: Track = { id: 't1', name: 'Test', surface: 'asphalt', length: 1000, laps: 1 };
  const mockRacers: Racer[] = [
    { id: '1', name: 'R1', color: 'red', baseSpeed: 10, health: 100, strategy: 'balanced', trackPreference: 'asphalt', lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
    { id: '2', name: 'R2', color: 'blue', baseSpeed: 10, health: 100, strategy: 'balanced', trackPreference: 'asphalt', lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'waiting', currentSpeed: 0 },
  ];
  const onRaceFinish = jest.fn();

  it('initializes correctly', () => {
    const { result } = renderHook(() => useRace({ racers: mockRacers, track: mockTrack, onRaceFinish }));
    expect(result.current.racers).toHaveLength(2);
    expect(result.current.isRacing).toBe(false);
    expect(Object.keys(result.current.progressMap)).toHaveLength(2);
  });

  it('starts race', () => {
    const { result } = renderHook(() => useRace({ racers: mockRacers, track: mockTrack, onRaceFinish }));
    act(() => {
      result.current.startRace();
    });
    expect(result.current.isRacing).toBe(true);
  });
});