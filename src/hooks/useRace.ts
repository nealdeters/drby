import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SharedValue, withSpring, makeMutable } from 'react-native-reanimated';
import { Racer, Track } from '../gameTypes';
import { SeededRandom } from '../utils/random';

const SPEED_VARIANCE = 0.15; // +/- 15% performance swing per race

interface UseRaceProps {
  racers: Racer[];
  track: Track;
  raceSeed: number;
  startTime: number;
  onRaceFinish: (results: Racer[]) => void;
}

export const useRace = ({ racers: inputRacers, track, raceSeed, startTime, onRaceFinish }: UseRaceProps) => {
  // React State for the UI List (updates less frequently)
  const [racers, setRacers] = useState<Racer[]>(
    inputRacers.map((r, index) => ({
      ...r,
      lane: index, // Assign lane based on starting position
      progress: 0,
      totalDistance: 0,
      laps: 0,
      status: 'active' as const,
      currentSpeed: r.baseSpeed
    }))
  );
  const [isRacing, setIsRacing] = useState(false);

  // Refs for Game Loop State (Mutable, high performance)
  const gameState = useRef({ racers, isRacing: false });
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  // Reanimated Shared Values for UI (Map of ID -> Progress)
  const progressMap = useMemo(() => {
    const map: Record<string, SharedValue<number>> = {};
    inputRacers.forEach(r => {
      map[r.id] = makeMutable(0);
    });
    return map;
  }, [inputRacers]);

  // Calculate deterministic performance modifiers for this specific race
  const raceModifiers = useMemo(() => {
    const rng = new SeededRandom(raceSeed);
    const mods: Record<string, number> = {};
    
    inputRacers.forEach(r => {
      // Base variance from seed
      let mod = rng.range(1 - SPEED_VARIANCE, 1 + SPEED_VARIANCE);
      
      // Track preference bonus
      if (r.trackPreference === track.surface) mod *= 1.05;
      
      mods[r.id] = mod;
    });
    return mods;
  }, [raceSeed, inputRacers, track]);

  // Reset state when input racers change (new race)
  useEffect(() => {
    const newRacers = inputRacers.map((r, index) => ({
      ...r,
      lane: index,
      progress: 0,
      totalDistance: 0,
      laps: 0,
      status: 'active' as const,
      currentSpeed: r.baseSpeed
    }));
    setRacers(newRacers);
    gameState.current = { racers: newRacers, isRacing: false };
    setIsRacing(false);
    
    // Reset shared values
    Object.keys(progressMap).forEach(key => {
      progressMap[key].value = 0;
    });
  }, [inputRacers, track, progressMap]);

  const updateRace = useCallback((time: number) => {
    // Calculate elapsed time based on the fixed Server Start Time
    // This makes the race deterministic for all users
    const now = Date.now();
    const elapsed = Math.max(0, now - startTime);

    let activeRacers = 0;

    const updatedRacers = gameState.current.racers.map(racer => {
      // If already finished in a previous frame, keep it finished
      if (racer.status === 'finished') return racer;

      activeRacers++;

      // 1. Calculate Speed (m/s) using the pre-calculated deterministic modifier
      const mod = raceModifiers[racer.id] || 1;
      const speed = racer.baseSpeed * mod;
      
      // 2. Calculate Total Distance based on Elapsed Time
      // Distance = Speed (m/s) * Time (s)
      const newTotalDistance = speed * (elapsed / 1000);

      let newLaps = Math.floor(newTotalDistance / track.length);
      let newProgress = (newTotalDistance % track.length) / track.length;

      // 3. Check Finish
      if (newLaps >= track.laps) {
        return { 
          ...racer, 
          status: 'finished' as const, 
          progress: 1, 
          totalDistance: track.length * track.laps,
          finishTime: elapsed // Use calculated elapsed time for consistency
        };
      }

      // Update SharedValue for UI
      if (progressMap[racer.id]) {
        progressMap[racer.id].value = newProgress;
      }

      return {
        ...racer,
        progress: newProgress,
        totalDistance: newTotalDistance,
        laps: newLaps,
      };
    });

    // Sort by distance for the Leaderboard
    updatedRacers.sort((a, b) => {
        // If finished, prioritize finished
        if (a.status === 'finished' && b.status !== 'finished') return -1;
        if (b.status === 'finished' && a.status !== 'finished') return 1;
        return b.totalDistance - a.totalDistance;
    });

    gameState.current = { ...gameState.current, racers: updatedRacers };

    setRacers(updatedRacers);

    if (activeRacers > 0) {
      requestRef.current = requestAnimationFrame(updateRace);
    } else {
      setIsRacing(false);
      gameState.current.isRacing = false;
      onRaceFinish(updatedRacers);
    }
  }, [track, startTime, onRaceFinish, progressMap, raceModifiers]);

  const startRace = () => {
    if (gameState.current.isRacing) return;
    
    gameState.current.isRacing = true;
    setIsRacing(true);
    // We don't set start time here anymore, it comes from props
    requestRef.current = requestAnimationFrame(updateRace);
  };

  const stopRace = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    gameState.current.isRacing = false;
    setIsRacing(false);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return { racers, isRacing, startRace, stopRace, progressMap };
};