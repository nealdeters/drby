import { useState, useEffect, useCallback } from 'react';
import { Racer, RaceEvent, Track } from '../gameTypes';
import { racersService } from '../services/racersService';
import { tracksService } from '../services/tracksService';
import { racesService } from '../services/racesService';
import { getRacerStats } from '../utils/stats';

const STORAGE_KEY = 'season-schedule';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [initialRosterLoaded, setInitialRosterLoaded] = useState(false);

  // Initialize Season / Schedule
  useEffect(() => {
    const initData = async () => {
      try {
        // Try to load roster from races service first (has health/stats)
        // Fall back to racers service if no saved roster
        let fetchedRacers = await racesService.getRoster().catch(() => null);
        if (!fetchedRacers || fetchedRacers.length === 0) {
          fetchedRacers = await racersService.getAll();
        }
        
        const [fetchedTracks, savedSchedule, savedStandings, savedSeasons, savedSeasonNum] = await Promise.all([
          tracksService.getAll(),
          racesService.getSeasonSchedule().catch(() => null),
          racesService.getStandings().catch(() => null),
          racesService.getCompletedSeasons().catch(() => []),
          racesService.getCurrentSeasonNumber().catch(() => 1)
        ]);

        setRoster(fetchedRacers);
        setTracks(fetchedTracks);
        setCompletedSeasons(savedSeasons || []);
        
        // Handle season number - could be number or { number: number }
        let seasonNum = 1;
        if (typeof savedSeasonNum === 'number') {
          seasonNum = savedSeasonNum;
        } else if (savedSeasonNum && typeof savedSeasonNum === 'object' && 'number' in savedSeasonNum) {
          seasonNum = (savedSeasonNum as any).number || 1;
        }
        setCurrentSeasonNumber(seasonNum);
        
        // Debug: Check the structure of loaded seasons
        if (savedSeasons && savedSeasons.length > 0) {
          console.log('📊 Loaded', savedSeasons.length, 'completed seasons');
          savedSeasons.forEach((season, index) => {
            console.log(`📊 Season ${season.number}: racerStats=${season.racerStats?.length}, winner=${season.winner?.name}, totalRaces=${season.totalRaces}`);
          });
        }
        
        // Init standings - use saved if available, otherwise all zeros
        const initialStandings: Record<string, number> = {};
        fetchedRacers.forEach(r => {
          initialStandings[r.id] = savedStandings?.[r.id] || 0;
        });
        setStandings(initialStandings);
        console.log('🏆 Loaded standings:', initialStandings);

        // Check if we have a saved schedule that's still valid
        if (savedSchedule && savedSchedule.length > 0) {
          // Check if all races are completed - if so, start new season immediately
          const allCompleted = savedSchedule.every(r => r.completed);
          if (allCompleted) {
            console.log('📅 Saved schedule has all races completed, starting new season immediately...');
            console.log('📊 Current standings before reset:', savedStandings);
            // Start new season immediately with fetched data
            await startNewSeasonFromInit(fetchedRacers, fetchedTracks, savedSeasons || [], savedSeasonNum || 1, savedStandings);
          } else {
            // Restore saved schedule and standings (normal case for active season)
            setSchedule(savedSchedule);
            const next = savedSchedule.find(r => !r.completed);
            setNextRace(next || null);
            console.log('📅 Restored saved schedule with', savedSchedule.length, 'races');
            console.log('📊 Loaded existing standings:', savedStandings);
          }
        } else {
          // Generate new schedule for fresh season
          console.log('🆕 No saved schedule found, generating new season...');
          // Reset standings for completely new season
          const resetStandings: Record<string, number> = {};
          fetchedRacers.forEach(r => {
            resetStandings[r.id] = 0;
          });
          setStandings(resetStandings);
          await racesService.saveStandings(resetStandings);
          const newSchedule = await generateSchedule(fetchedRacers, fetchedTracks);
          setSchedule(newSchedule);
          const next = newSchedule.find(r => !r.completed);
          setNextRace(next || null);
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

  // Save schedule to Blobs whenever it changes
  useEffect(() => {
    if (schedule.length > 0) {
      racesService.saveSeasonSchedule(schedule).catch(err => 
        console.error('Failed to save schedule:', err)
      );
    }
  }, [schedule]);

  // Save standings to Blobs whenever they change
  useEffect(() => {
    if (Object.keys(standings).length > 0) {
      racesService.saveStandings(standings).catch(err => 
        console.error('Failed to save standings:', err)
      );
    }
  }, [standings]);

  // Save roster to Blobs whenever it changes (after initial load)
  useEffect(() => {
    if (initialRosterLoaded && roster.length > 0) {
      racesService.saveRoster(roster).catch(err => 
        console.error('Failed to save roster:', err)
      );
    }
  }, [roster, initialRosterLoaded]);

  const generateSchedule = async (currentRoster: Racer[], currentTracks: Track[], seasonNum: number = currentSeasonNumber) => {
    const newSchedule: RaceEvent[] = [];
    const now = Date.now();
    const seasonPrefix = `s${seasonNum}`;
    
    // 24-Hour Season: 144 races, 10 minutes apart (6 races per hour)
    // Schedule: Continuous 24-hour cycle starting 1 hour from now
    for (let i = 0; i < 144; i++) {
      // Pick 4-6 random racers for better competition
      const numRacers = 4 + Math.floor(Math.random() * 3); // 4-6 racers
      const shuffled = [...currentRoster].sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, numRacers).map(r => r.id);

      newSchedule.push({
        id: `${seasonPrefix}-race-${i}-${now}`,
        startTime: now + (i * 10 * 60 * 1000) + (10 * 60 * 1000), // First race in 10 mins, then 10min intervals
        seed: Math.floor(Math.random() * 1000000),
        track: currentTracks[i % currentTracks.length],
        racerIds: selectedIds,
        completed: false,
      });
    }
    return newSchedule;
  };

  const startNewSeasonFromInit = async (
    currentRoster: Racer[], 
    currentTracks: Track[], 
    savedSeasons: CompletedSeason[], 
    seasonNum: number,
    savedStandings: Record<string, number> | null
  ) => {
    console.log('🏁 Starting new season from initialization...');
    
    // Prevent concurrent season transitions
    if (isTransitioning) {
      console.log('⚠️ Season transition already in progress, skipping...');
      return;
    }
    
    setIsTransitioning(true);
    
    try {
      // Save current season to completed seasons if there are standings
      if (savedStandings && Object.keys(savedStandings).length > 0) {
        const winner = Object.entries(savedStandings)
          .sort(([, a], [, b]) => b - a)[0];
        
        if (winner) {
          const winnerRacer = currentRoster.find(r => r.id === winner[0]);
          if (winnerRacer) {
            // Calculate stats for all racers
            const racerStats: RacerSeasonStats[] = currentRoster.map(racer => {
              const stats = getRacerStats(racer.id, currentRoster, schedule);
              return {
                id: racer.id,
                name: racer.name,
                color: racer.color,
                baseSpeed: racer.baseSpeed,
                health: racer.health,
                strategy: racer.strategy,
                trackPreference: racer.trackPreference,
                acceleration: racer.acceleration || 50,
                endurance: racer.endurance || 50,
                consistency: racer.consistency || 50,
                staminaRecovery: racer.staminaRecovery || 50,
                points: savedStandings[racer.id] || 0,
                first: stats?.first || 0,
                second: stats?.second || 0,
                third: stats?.third || 0,
                racesRun: stats?.racesRun || 0
              };
            });

            const completedSeason: CompletedSeason = {
              id: `season-${seasonNum}-${Date.now()}`,
              number: seasonNum,
              completedAt: new Date().toISOString(),
              winner: {
                id: winnerRacer.id,
                name: winnerRacer.name,
                color: winnerRacer.color,
                points: winner[1]
              },
              totalRaces: schedule.filter(r => r.completed).length,
              finalStandings: { ...savedStandings },
              racerStats
            };
            
          const updatedSeasons = [...savedSeasons, completedSeason];
          setCompletedSeasons(updatedSeasons);
          console.log('🏆 Saving completed season with racerStats:', completedSeason.racerStats?.length, 'racers');
          await racesService.saveCompletedSeasons(updatedSeasons);
          console.log('🏆 Saved completed season from init:', completedSeason);
          }
        }
      }
      
      // Increment season number
      const newSeasonNumber = seasonNum + 1;
      setCurrentSeasonNumber(newSeasonNumber);
      await racesService.saveCurrentSeasonNumber(newSeasonNumber);
      
      // Reset standings for new season
      const resetStandings: Record<string, number> = {};
      currentRoster.forEach(r => {
        resetStandings[r.id] = 0;
      });
      setStandings(resetStandings);
      await racesService.saveStandings(resetStandings);
      
      // Generate new schedule
      await generateSchedule(currentRoster, currentTracks, newSeasonNumber);
      
      console.log('✅ New season started from init:', newSeasonNumber);
    } catch (error) {
      console.error('❌ Error starting new season from init:', error);
    } finally {
      setIsTransitioning(false);
    }
  };

  const startNewSeason = useCallback(async () => {
    console.log('🏁 Starting new season...');
    
    // Prevent concurrent season transitions
    if (isTransitioning) {
      console.log('⚠️ Season transition already in progress, skipping...');
      return;
    }
    
    setIsTransitioning(true);
    
    try {
      // Save current season to completed seasons if there were races
      if (schedule.length > 0 && schedule.some(r => r.completed)) {
      const winner = Object.entries(standings)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (winner) {
        const winnerRacer = roster.find(r => r.id === winner[0]);
        if (winnerRacer) {
          // Calculate stats for all racers
          const racerStats: RacerSeasonStats[] = roster.map(racer => {
            const stats = getRacerStats(racer.id, roster, schedule);
            return {
              id: racer.id,
              name: racer.name,
              color: racer.color,
              baseSpeed: racer.baseSpeed,
              health: racer.health,
              strategy: racer.strategy,
              trackPreference: racer.trackPreference,
              acceleration: racer.acceleration || 50,
              endurance: racer.endurance || 50,
              consistency: racer.consistency || 50,
              staminaRecovery: racer.staminaRecovery || 50,
              points: standings[racer.id] || 0,
              first: stats?.first || 0,
              second: stats?.second || 0,
              third: stats?.third || 0,
              racesRun: stats?.racesRun || 0
            };
          });

          const completedSeason: CompletedSeason = {
            id: `season-${currentSeasonNumber}-${Date.now()}`,
            number: currentSeasonNumber,
            completedAt: new Date().toISOString(),
            winner: {
              id: winnerRacer.id,
              name: winnerRacer.name,
              color: winnerRacer.color,
              points: winner[1]
            },
            totalRaces: schedule.filter(r => r.completed).length,
            finalStandings: { ...standings },
            racerStats
          };
          
          const updatedSeasons = [...completedSeasons, completedSeason];
          setCompletedSeasons(updatedSeasons);
          await racesService.saveCompletedSeasons(updatedSeasons);
          console.log('🏆 Saved completed season:', completedSeason.number, 'with', completedSeason.racerStats?.length, 'racers');
        }
      }
    }
    
    // Increment season number
    const newSeasonNumber = currentSeasonNumber + 1;
    setCurrentSeasonNumber(newSeasonNumber);
    await racesService.saveCurrentSeasonNumber(newSeasonNumber);
    
    // Reset standings for new season
    const resetStandings: Record<string, number> = {};
    roster.forEach(r => {
      resetStandings[r.id] = 0;
    });
    setStandings(resetStandings);
    
    // Clear schedule and generate new one
    setSchedule([]);
    await racesService.saveSeasonSchedule([]);
    
    // Generate new schedule
    await generateSchedule(roster, tracks);
    
    console.log('✅ New season started:', newSeasonNumber);
    } catch (error) {
      console.error('❌ Error starting new season:', error);
    } finally {
      setIsTransitioning(false);
    }
  }, [schedule, standings, roster, currentSeasonNumber, completedSeasons, tracks, isTransitioning]);

  // Check if all races are completed and start new season
  useEffect(() => {
    if (schedule.length > 0 && schedule.every(r => r.completed) && roster.length > 0 && tracks.length > 0) {
      console.log('🎯 All races completed! Auto-starting new season...');
      startNewSeason();
    }
  }, [schedule, roster.length, tracks.length, startNewSeason]);

  const skipOverdueRace = useCallback((raceId: string) => {
    console.log('⏭️ Skipping overdue race:', raceId);
    
    setSchedule(prev => {
      const idx = prev.findIndex(r => r.id === raceId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      updated[idx] = { ...updated[idx], completed: true, results: [] };
      
      // Set next race - find next upcoming race by scheduled time
      const now = Date.now();
      const nextUpcoming = updated
        .filter(r => !r.completed && r.startTime > now)
        .sort((a, b) => a.startTime - b.startTime)[0];
      
      setNextRace(nextUpcoming || null);
      
      return updated;
    });
  }, []);

  const completeRace = useCallback((raceId: string, results: Racer[]) => {
    console.log('🏁 Completing race:', raceId);
    console.log('📊 Race results:', results.map((r, i) => `${i + 1}. ${r.name} (${r.id})`));
    
    setSchedule(prev => {
      const idx = prev.findIndex(r => r.id === raceId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      updated[idx] = { ...updated[idx], completed: true, results: results.map(r => r.id) };
      
      // Set next race - find next upcoming race by scheduled time
      const now = Date.now();
      const nextUpcoming = updated
        .filter(r => !r.completed && r.startTime > now)
        .sort((a, b) => a.startTime - b.startTime)[0];
      
      setNextRace(nextUpcoming || null);
      
      return updated;
    });

    // Update Standings (5, 3, 1 points)
    setStandings(prev => {
      const newStandings = { ...prev };
      if (results[0]) {
        newStandings[results[0].id] = (newStandings[results[0].id] || 0) + 5;
        console.log(`🥇 Added 5 points to ${results[0].name}, total: ${newStandings[results[0].id]}`);
      }
      if (results[1]) {
        newStandings[results[1].id] = (newStandings[results[1].id] || 0) + 3;
        console.log(`🥈 Added 3 points to ${results[1].name}, total: ${newStandings[results[1].id]}`);
      }
      if (results[2]) {
        newStandings[results[2].id] = (newStandings[results[2].id] || 0) + 1;
        console.log(`🥉 Added 1 point to ${results[2].name}, total: ${newStandings[results[2].id]}`);
      }
      console.log('📊 Updated standings:', newStandings);
      return newStandings;
    });

    // Update Roster Health/Stats - strategy affects fatigue
    setRoster(prev => prev.map(r => {
      const raceResult = results.find(res => res.id === r.id);
      if (raceResult) {
        // Health reduction based on strategy - aggressive tires faster, conservative endures longer
        const fatigueRates = {
          aggressive: 8 + Math.random() * 4,   // 8-12 health lost
          balanced: 5 + Math.random() * 3,     // 5-8 health lost  
          conservative: 3 + Math.random() * 2  // 3-5 health lost
        };
        let newHealth = r.health - (fatigueRates[r.strategy] || fatigueRates.balanced);
        if (raceResult.status === 'injured') newHealth -= 25;
        return { ...r, health: Math.max(0, newHealth) };
      } else {
        // Recover health if they rested - based on staminaRecovery attribute
        // staminaRecovery 0-100 maps to 3-15 health recovered
        const recoveryRate = 3 + (r.staminaRecovery || 50) / 100 * 12;
        const healthRecovered = recoveryRate + Math.random() * 3;
        return { ...r, health: Math.min(100, r.health + healthRecovered) };
      }
    }));
  }, []);

  // Calculate historical standings from all completed seasons
  const getHistoricalStandings = (): Record<string, { totalPoints: number; seasonsWon: number; bestFinish: number; racesWon: number }> => {
    const historical: Record<string, { totalPoints: number; seasonsWon: number; bestFinish: number; racesWon: number }> = {};
    
    completedSeasons.forEach(season => {
      // Count season wins
      if (season.winner) {
        if (!historical[season.winner.id]) {
          historical[season.winner.id] = { totalPoints: 0, seasonsWon: 0, bestFinish: 999, racesWon: 0 };
        }
        historical[season.winner.id].seasonsWon++;
      }
      
      // Accumulate total points and track best finishes
      Object.entries(season.finalStandings).forEach(([racerId, points]) => {
        if (!historical[racerId]) {
          historical[racerId] = { totalPoints: 0, seasonsWon: 0, bestFinish: 999, racesWon: 0 };
        }
        historical[racerId].totalPoints += points;
        
        // Track best finish position (lower is better)
        const finishPosition = Object.keys(season.finalStandings)
          .sort((a, b) => season.finalStandings[b] - season.finalStandings[a])
          .indexOf(racerId) + 1;
        historical[racerId].bestFinish = Math.min(historical[racerId].bestFinish, finishPosition);
      });
      
      // Count race wins from racer stats
      season.racerStats?.forEach(racerStat => {
        if (!historical[racerStat.id]) {
          historical[racerStat.id] = { totalPoints: 0, seasonsWon: 0, bestFinish: 999, racesWon: 0 };
        }
        historical[racerStat.id].racesWon += racerStat.first;
      });
    });
    
    return historical;
  };

  return { roster, schedule, standings, nextRace, completeRace, skipOverdueRace, tracks, loading, completedSeasons, currentSeasonNumber, getHistoricalStandings };
};
