import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SharedValue, makeMutable, withTiming } from 'react-native-reanimated';
import { Racer, Track } from '../gameTypes';
import { createRaceSubscription, hasRealtimeConfigured } from '../services/apiClient';

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
  elapsed: number;
  racers?: Racer[];
  results?: Racer[];
  progressMap?: Record<string, number>;
}

export const useRace = ({ racers: inputRacers, track, raceId, isActive, onRaceFinish }: UseRaceProps) => {
  const [racers, setRacers] = useState<Racer[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState<number | null>(null);
  const [raceElapsedTime, setRaceElapsedTime] = useState(0);
  const racersRef = useRef<Racer[]>([]);
  const isRacingRef = useRef(false);
  const subscriptionRef = useRef<{ close: () => void } | null>(null);
  const lastLaneDecisionTick = useRef<Record<string, number>>({});

  const recordLaneDebug = useCallback((nextRacers: Racer[]) => {
    const debugEnabled = typeof globalThis !== 'undefined' && Boolean((globalThis as { __DRBY_RACE_DEBUG__?: boolean }).__DRBY_RACE_DEBUG__);
    if (!debugEnabled) return;
    nextRacers.forEach((racer) => {
      const decision = racer.laneDecision;
      if (!decision || lastLaneDecisionTick.current[racer.id] === decision.evaluatedAtTick) return;
      lastLaneDecisionTick.current[racer.id] = decision.evaluatedAtTick;
      const event = {
        horse: racer.name,
        horseId: racer.id,
        currentLane: decision.currentLane,
        targetLane: decision.targetLane,
        reason: decision.reason,
        blockerId: decision.blockerId ?? null,
        targetSpaceAvailable: decision.targetSpaceAvailable,
        nearbyHorses: decision.nearbyHorses,
        scores: decision.scores,
        lanePosition: racer.lanePosition,
        laneChange: racer.laneChange ?? null,
        tick: decision.evaluatedAtTick,
      };
      console.debug('[DRBY lane decision]', event);
      if (typeof window !== 'undefined') {
        const traceWindow = window as Window & { __DRBY_LANE_TRACE__?: unknown[] };
        traceWindow.__DRBY_LANE_TRACE__ ??= [];
        traceWindow.__DRBY_LANE_TRACE__!.push(event);
      }
    });
  }, []);

  const progressMap = useMemo(() => {
    const map: Record<string, SharedValue<number>> = {};
    inputRacers.forEach(r => { map[r.id] = makeMutable(0); });
    return map;
  }, [inputRacers]);

  const cleanup = useCallback(() => {
    subscriptionRef.current?.close();
    subscriptionRef.current = null;
  }, []);

  useEffect(() => {
    if (!isActive || !raceId || !hasRealtimeConfigured()) {
      cleanup();
      isRacingRef.current = false;
      setIsRacing(false);
      return;
    }

    try {
      subscriptionRef.current = createRaceSubscription(
        raceId,
        (message) => {
          const update = message.data as RaceUpdate;
          if (!update || update.raceId !== raceId) return;
          if (update.type === 'started') {
            isRacingRef.current = true;
            setIsRacing(true);
            setRaceStartTime(Date.now() - (update.elapsed ?? 0));
            if (update.racers) { recordLaneDebug(update.racers); racersRef.current = update.racers; setRacers(update.racers); }
          } else if (update.type === 'progress') {
            if (!isRacingRef.current) {
              isRacingRef.current = true;
              setIsRacing(true);
              setRaceStartTime(Date.now() - (update.elapsed ?? 0));
            }
            setRaceElapsedTime(update.elapsed ?? 0);
            Object.entries(update.progressMap ?? {}).forEach(([id, progress]) => {
              if (progressMap[id]) progressMap[id].value = withTiming(progress, { duration: 20 });
            });
            if (update.racers) {
              const next = update.racers.map(r => ({ ...r, lane: r.lane ?? racersRef.current.find(c => c.id === r.id)?.lane }));
              racersRef.current = next;
              recordLaneDebug(next);
              setRacers(next);
            }
          } else if (update.type === 'finished') {
            isRacingRef.current = false;
            setIsRacing(false);
            setRaceStartTime(null);
            setRaceElapsedTime(update.elapsed ?? 0);
            if (update.results) {
              racersRef.current = update.results;
              setRacers(update.results);
              onRaceFinish?.(update.results);
            }
            cleanup();
          }
        },
        () => console.log(`[useRace] realtime attached for ${raceId}`),
        (error) => console.warn('[useRace] realtime error', error),
      );
    } catch (error) {
      console.warn('[useRace] realtime subscribe failed', error);
    }
    return cleanup;
  }, [isActive, raceId, progressMap, onRaceFinish, cleanup, recordLaneDebug]);

  useEffect(() => {
    const next = inputRacers.map((r, index) => ({
      ...r,
      lane: r.lane ?? Math.min(index + 1, 8),
      progress: 0,
      totalDistance: 0,
      laps: 0,
      status: 'waiting' as const,
      currentSpeed: 0,
      position: index + 1,
    }));
    racersRef.current = next;
    setRacers(next);
    isRacingRef.current = false;
    setIsRacing(false);
    setRaceStartTime(null);
    setRaceElapsedTime(0);
    Object.keys(progressMap).forEach(key => { progressMap[key].value = 0; });
  }, [inputRacers, track, progressMap]);

  useEffect(() => () => cleanup(), [cleanup]);
  return { racers, isRacing, raceStartTime, raceElapsedTime, progressMap };
};
