import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SharedValue, makeMutable, withTiming } from 'react-native-reanimated';
import { Racer, Track } from '../gameTypes';
import { getRaceChannel, getAblyClient } from '../services/apiClient';

interface UseRaceProps {
  racers: Racer[];
  track: Track;
  raceId: string;
  isActive: boolean;
  onRaceFinish?: (results: Racer[]) => void;
}

interface RaceUpdate {
  type: 'progress' | 'finished' | 'started';
  raceId: string;
  timestamp: number;
  racers?: Racer[];
  results?: Racer[];
  progressMap?: Record<string, number>;
}

// Validate race update to prevent stale data
const validateRaceUpdate = (update: RaceUpdate, currentRaceId: string): boolean => {
  const now = Date.now();
  const isValidRaceId = update.raceId === currentRaceId;
  const isRecent = (now - update.timestamp) < 30000; // Reject updates older than 30 seconds
  const isNotFuture = update.timestamp <= now + 5000; // Reject updates more than 5 seconds in future
  
  return isValidRaceId && isRecent && isNotFuture;
};

export const useRace = ({ racers: inputRacers, track, raceId, isActive, onRaceFinish }: UseRaceProps) => {
  // React State for the UI List (throttled updates)
  const [racers, setRacers] = useState<Racer[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  
  // Refs for tracking
  const racersRef = useRef<Racer[]>([]);
  const lastStateUpdate = useRef(0);
  const isSubscribed = useRef(false);
  const currentRaceId = useRef<string>('');

  // Reanimated Shared Values for UI (Map of ID -> Progress)
  const progressMap = useMemo(() => {
    const map: Record<string, SharedValue<number>> = {};
    inputRacers.forEach(r => {
      map[r.id] = makeMutable(0);
    });
    return map;
  }, [inputRacers]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (currentRaceId.current && isSubscribed.current) {
      try {
        const client = getAblyClient();
        if (client) {
          const channel = client.channels.get(`race:${currentRaceId.current}`);
          channel.unsubscribe('race-update');
          console.log(`🧹 Cleaned up race subscription for ${currentRaceId.current}`);
        }
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
      isSubscribed.current = false;
    }
  }, []);

  // Subscribe to Ably channel when race becomes active
  useEffect(() => {
    // Cleanup previous subscription if raceId changes
    if (currentRaceId.current && currentRaceId.current !== raceId) {
      cleanup();
    }

    if (!isActive || !raceId) {
      cleanup();
      return;
    }

    // Prevent duplicate subscriptions
    if (isSubscribed.current && currentRaceId.current === raceId) {
      return;
    }

    try {
      const channel = getRaceChannel(raceId);
      currentRaceId.current = raceId;
      isSubscribed.current = true;

      console.log(`📡 Subscribing to race: ${raceId}`);

      // Subscribe to race updates
      channel.subscribe('race-update', (message: any) => {
        const update = message.data as RaceUpdate;
        const now = Date.now();
        
        // Validate race update to prevent stale or invalid data
        if (!validateRaceUpdate(update, raceId)) {
          console.warn(`Invalid race update rejected for race ${raceId}:`, update);
          return;
        }
        
        if (update.type === 'started') {
          console.log('🚀 Race started');
          setIsRacing(true);
          if (update.racers) {
            racersRef.current = update.racers;
            setRacers(update.racers);
            lastStateUpdate.current = now;
          }
        } else if (update.type === 'progress') {
          if (update.progressMap) {
            // Update shared values for smooth animation
            Object.entries(update.progressMap).forEach(([racerId, progress]) => {
              if (progressMap[racerId]) {
                progressMap[racerId].value = withTiming(progress, { duration: 33 });
              }
            });
          }
          
          if (update.racers) {
            // Preserve lane assignments to prevent lane switching
            const updatedRacers = update.racers.map(updatedRacer => {
              const currentRacer = racersRef.current.find(r => r.id === updatedRacer.id);
              return {
                ...updatedRacer,
                lane: currentRacer?.lane ?? updatedRacer.lane // Preserve existing lane assignment
              };
            });
            
            racersRef.current = updatedRacers;
            
            // Throttle React state updates to every 100ms for smoother UI updates
            if (now - lastStateUpdate.current > 100) {
              setRacers(updatedRacers);
              lastStateUpdate.current = now;
            }
          }
        } else if (update.type === 'finished') {
          console.log('🏁 Race finished');
          setIsRacing(false);
          if (update.results) {
            racersRef.current = update.results;
            setRacers(update.results);
            onRaceFinish?.(update.results);
          }
          // Clean up subscription after race finishes
          cleanup();
        }
      });

      return () => {
        cleanup();
      };
    } catch (error) {
      console.error('Failed to subscribe to Ably channel:', error);
      isSubscribed.current = false;
    }
  }, [isActive, raceId, progressMap, onRaceFinish, cleanup]);

  // Reset state when input racers change (new race)
  useEffect(() => {
    const newRacers = inputRacers.map((r, index) => ({
      ...r,
      lane: r.lane ?? Math.min(index + 1, 8), // Lane 1-N (1-based indexing), max 8 lanes
      progress: 0,
      totalDistance: 0,
      laps: 0,
      status: 'waiting' as const,
      currentSpeed: 0,
      position: index + 1
    }));
    racersRef.current = newRacers;
    setRacers(newRacers);
    setIsRacing(false);
    lastStateUpdate.current = 0;
    
    // Reset shared values
    Object.keys(progressMap).forEach(key => {
      progressMap[key].value = 0;
    });
  }, [inputRacers, track, progressMap]);

  // Cleanup on unmount and when race finishes
  useEffect(() => {
    if (!isRacing && currentRaceId.current) {
      cleanup();
      currentRaceId.current = '';
    }
  }, [isRacing, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRace = useCallback(() => {
    console.log('Race will start automatically via server');
  }, []);

  const stopRace = useCallback(() => {
    console.log('Race will finish automatically via server');
  }, []);

  return { racers, isRacing, startRace, stopRace, progressMap };
};
