import { renderHook, act } from '@testing-library/react-hooks';
import { useSeason } from './useSeason';

describe('useSeason', () => {
  it('initializes with a roster and schedule', () => {
    const { result } = renderHook(() => useSeason());
    expect(result.current.roster.length).toBeGreaterThan(0);
    expect(result.current.schedule.length).toBe(10);
    expect(result.current.nextRace).toBeDefined();
    expect(result.current.tracks.length).toBeGreaterThan(0);
  });

  it('updates standings after race completion', () => {
    const { result } = renderHook(() => useSeason());
    const raceId = result.current.schedule[0].id;
    const winner = result.current.roster[0];
    
    act(() => {
      result.current.completeRace(raceId, [winner]);
    });
    
    expect(result.current.standings[winner.id]).toBe(5);
  });
});