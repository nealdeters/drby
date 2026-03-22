import { useState, useEffect, useCallback } from 'react';
import { Racer, RaceEvent, Track } from '../gameTypes';
import { racersService } from '../services/racersService';
import { tracksService } from '../services/tracksService';
import { racesService } from '../services/racesService';

export interface RacerSeasonStats {
  id: string;
  name: string;
  color: string;
  baseSpeed: number;
  health: number;
  strategy: string;
  trackPreference: string;
  acceleration: number;
  endurance: number;
  consistency: number;
  staminaRecovery: number;
  points: number;
  first: number;
  second: number;
  third: number;
  racesRun: number;
}

export interface CompletedSeason {
  id: string;
  number: number;
  completedAt: string;
  winner: {
    id: string;
    name: string;
    color: string;
    points: number;
  };
  totalRaces: number;
  finalStandings: Record<string, number>;
  racerStats: RacerSeasonStats[];
  races: RaceEvent[];
}

export const useSeason = () => {
  const [roster, setRoster] = useState<Racer[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [schedule, setSchedule] = useState<RaceEvent[]>([]);
  const [standings, setStandings] = useState<Record<string, number>>({});
  const [nextRace, setNextRace] = useState<RaceEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSeasons, setCompletedSeasons] = useState<CompletedSeason[]>([]);
  const [currentSeasonNumber, setCurrentSeasonNumber] = useState(1);
  const [initialRosterLoaded, setInitialRosterLoaded] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [fetchedRacers, fetchedTracks, savedSchedule, savedStandings, savedSeasons, savedSeasonNum] = await Promise.all([
          racersService.getAll().catch(() => []),
          tracksService.getAll().catch(() => []),
          racesService.getSeasonSchedule().catch(() => []),
          racesService.getStandings().catch(() => ({})),
          racesService.getCompletedSeasons().catch(() => []),
          racesService.getCurrentSeasonNumber().catch(() => 1)
        ]);

        setRoster(fetchedRacers);
        setTracks(fetchedTracks);
        setCompletedSeasons(savedSeasons || []);
        
        const seasonNum = typeof savedSeasonNum === 'number' 
          ? savedSeasonNum 
          : (savedSeasonNum as any)?.number || 1;
        setCurrentSeasonNumber(seasonNum);

        const initialStandings: Record<string, number> = {};
        const savedStandingsObj = savedStandings as Record<string, number>;
        fetchedRacers.forEach(r => {
          initialStandings[r.id] = savedStandingsObj?.[r.id] || 0;
        });
        setStandings(initialStandings);

        if (savedSchedule && savedSchedule.length > 0) {
          setSchedule(savedSchedule);
          const next = savedSchedule.find(r => !r.completed);
          setNextRace(next || null);
        } else {
          setSchedule([]);
          setNextRace(null);
        }
      } catch (error) {
        console.error("Failed to initialize season data", error);
      } finally {
        setLoading(false);
        setInitialRosterLoaded(true);
      }
    };

    initData();
  }, []);

  useEffect(() => {
    if (schedule.length > 0) {
      racesService.saveSeasonSchedule(schedule).catch(err => 
        console.error('Failed to save schedule:', err)
      );
    }
  }, [schedule]);

  useEffect(() => {
    if (Object.keys(standings).length > 0) {
      racesService.saveStandings(standings).catch(err => 
        console.error('Failed to save standings:', err)
      );
    }
  }, [standings]);

  useEffect(() => {
    if (initialRosterLoaded && roster.length > 0) {
      racesService.saveRoster(roster).catch(err => 
        console.error('Failed to save roster:', err)
      );
    }
  }, [roster, initialRosterLoaded]);

  const refreshFromServer = useCallback(async () => {
    const [savedSchedule, savedStandings, savedSeasons, savedSeasonNum] = await Promise.all([
      racesService.getSeasonSchedule().catch(() => []),
      racesService.getStandings().catch(() => ({})),
      racesService.getCompletedSeasons().catch(() => []),
      racesService.getCurrentSeasonNumber().catch(() => 1)
    ]);

    setSchedule(savedSchedule || []);
    setCompletedSeasons(savedSeasons || []);
    
    const seasonNum = typeof savedSeasonNum === 'number' 
      ? savedSeasonNum 
      : (savedSeasonNum as any)?.number || 1;
    setCurrentSeasonNumber(seasonNum);

    setStandings(savedStandings || {});

    const next = (savedSchedule || []).find(r => !r.completed);
    setNextRace(next || null);
  }, []);

  const completeRace = useCallback((raceId: string, results: Racer[]) => {
    setSchedule(prev => {
      const idx = prev.findIndex(r => r.id === raceId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      const finishTimes = results.reduce((acc, r) => {
        if (r.finishTime) acc[r.id] = r.finishTime;
        return acc;
      }, {} as Record<string, number>);
      updated[idx] = { ...updated[idx], completed: true, results: results.map(r => r.id), finishTimes };
      
      const now = Date.now();
      const nextUpcoming = updated
        .filter(r => !r.completed && r.startTime > now)
        .sort((a, b) => a.startTime - b.startTime)[0];
      
      setNextRace(nextUpcoming || null);
      
      return updated;
    });
  }, []);

  const skipOverdueRace = useCallback((raceId: string) => {
    setSchedule(prev => {
      const idx = prev.findIndex(r => r.id === raceId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      updated[idx] = { ...updated[idx], completed: true, results: [] };
      
      const now = Date.now();
      const nextUpcoming = updated
        .filter(r => !r.completed && r.startTime > now)
        .sort((a, b) => a.startTime - b.startTime)[0];
      
      setNextRace(nextUpcoming || null);
      
      return updated;
    });
  }, []);

  const resetSeason = useCallback(async () => {
    await racesService.resetAll();
    setCompletedSeasons([]);
    setCurrentSeasonNumber(1);
    setStandings({});
    setSchedule([]);
    setNextRace(null);
  }, []);

  const getHistoricalStandings = useCallback((): Record<string, { totalPoints: number; seasonsWon: number; bestFinish: number; racesWon: number }> => {
    const historical: Record<string, { totalPoints: number; seasonsWon: number; bestFinish: number; racesWon: number }> = {};
    
    completedSeasons.forEach(season => {
      if (season.winner) {
        if (!historical[season.winner.id]) {
          historical[season.winner.id] = { totalPoints: 0, seasonsWon: 0, bestFinish: 999, racesWon: 0 };
        }
        historical[season.winner.id].seasonsWon++;
      }
      
      Object.entries(season.finalStandings).forEach(([racerId, points]) => {
        if (!historical[racerId]) {
          historical[racerId] = { totalPoints: 0, seasonsWon: 0, bestFinish: 999, racesWon: 0 };
        }
        historical[racerId].totalPoints += points;
        
        const finishPosition = Object.keys(season.finalStandings)
          .sort((a, b) => season.finalStandings[b] - season.finalStandings[a])
          .indexOf(racerId) + 1;
        historical[racerId].bestFinish = Math.min(historical[racerId].bestFinish, finishPosition);
      });
      
      season.racerStats?.forEach(racerStat => {
        if (!historical[racerStat.id]) {
          historical[racerStat.id] = { totalPoints: 0, seasonsWon: 0, bestFinish: 999, racesWon: 0 };
        }
        historical[racerStat.id].racesWon += racerStat.first;
      });
    });
    
    return historical;
  }, [completedSeasons]);

  return { 
    roster, 
    schedule, 
    standings, 
    nextRace, 
    completeRace, 
    skipOverdueRace, 
    tracks, 
    loading, 
    completedSeasons, 
    currentSeasonNumber, 
    getHistoricalStandings, 
    resetSeason,
    refreshFromServer
  };
};
