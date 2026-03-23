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

const validateRaceUpdate = (update: RaceUpdate, currentRaceId: string): boolean => {
  const now = Date.now();
  const isValidRaceId = update.raceId === currentRaceId;
  const isRecent = (now - update.timestamp) < 60000;
  
  return isValidRaceId && isRecent;
};

export const useRace = ({ racers: inputRacers, track, raceId, isActive, onRaceFinish }: UseRaceProps) => {
  const [racers, setRacers] = useState<Racer[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState<number | null>(null);
  
  const racersRef = useRef<Racer[]>([]);
  const lastStateUpdate = useRef(0);
  const isSubscribed = useRef(false);
  const currentRaceId = useRef<string>('');

  const progressMap = useMemo(() => {
    const map: Record<string, SharedValue<number>> = {};
    inputRacers.forEach(r => {
      map[r.id] = makeMutable(0);
    });
    return map;
  }, [inputRacers]);

  const cleanup = useCallback(() => {
    if (currentRaceId.current && isSubscribed.current) {
      try {
        const client = getAblyClient();
        if (client) {
          const channel = client.channels.get(`race:${currentRaceId.current}`);
          channel.unsubscribe('race-update');
          console.log(`Cleaned up race subscription for ${currentRaceId.current}`);
        }
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
      isSubscribed.current = false;
    }
  }, []);

  useEffect(() => {
    if (currentRaceId.current && currentRaceId.current !== raceId) {
      cleanup();
    }

    if (!isActive || !raceId) {
      cleanup();
      return;
    }

    if (isSubscribed.current && currentRaceId.current === raceId) {
      return;
    }

    try {
      const channel = getRaceChannel(raceId);
      currentRaceId.current = raceId;
      isSubscribed.current = true;

      console.log(`Subscribing to race: ${raceId}`);

      channel.subscribe('race-update', (message: any) => {
        const update = message.data as RaceUpdate;
        const now = Date.now();
        
        if (!validateRaceUpdate(update, raceId)) {
          console.warn(`Invalid race update rejected for race ${raceId}`);
          return;
        }
        
        if (update.type === 'started') {
          setIsRacing(true);
          if (update.timestamp) {
            setRaceStartTime(update.timestamp);
          }
          if (update.racers) {
            racersRef.current = update.racers;
            setRacers(update.racers);
            lastStateUpdate.current = now;
          }
        } else if (update.type === 'progress') {
          if (!isRacing) {
            setIsRacing(true);
            if (update.timestamp) {
              setRaceStartTime(update.timestamp);
            }
          }
          
          if (update.progressMap) {
            Object.entries(update.progressMap).forEach(([racerId, progress]) => {
              if (progressMap[racerId]) {
                progressMap[racerId].value = withTiming(progress, { duration: 33 });
              }
            });
          }
          
          if (update.racers) {
            const updatedRacers = update.racers.map(updatedRacer => {
              const currentRacer = racersRef.current.find(r => r.id === updatedRacer.id);
              return {
                ...updatedRacer,
                lane: currentRacer?.lane ?? updatedRacer.lane
              };
            });
            
            racersRef.current = updatedRacers;
            
            if (now - lastStateUpdate.current > 100) {
              setRacers(updatedRacers);
              lastStateUpdate.current = now;
            }
          }
        } else if (update.type === 'finished') {
          setIsRacing(false);
          setRaceStartTime(null);
          if (update.results) {
            racersRef.current = update.results;
            setRacers(update.results);
            onRaceFinish?.(update.results);
          }
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

  useEffect(() => {
    const newRacers = inputRacers.map((r, index) => ({
      ...r,
      lane: r.lane ?? Math.min(index + 1, 8),
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
    setRaceStartTime(null);
    lastStateUpdate.current = 0;
    
    Object.keys(progressMap).forEach(key => {
      progressMap[key].value = 0;
    });
  }, [inputRacers, track, progressMap]);

  useEffect(() => {
    if (!isRacing && currentRaceId.current) {
      cleanup();
      currentRaceId.current = '';
    }
  }, [isRacing, cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { racers, isRacing, raceStartTime, progressMap };
};
