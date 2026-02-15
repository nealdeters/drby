import { useState, useEffect, useCallback } from 'react';
import { Racer, RaceEvent, Track } from '../gameTypes';
import { racersService } from '../services/racersService';
import { tracksService } from '../services/tracksService';
import { racesService } from '../services/racesService';

const STORAGE_KEY = 'season-schedule';

export const useSeason = () => {
  const [roster, setRoster] = useState<Racer[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [schedule, setSchedule] = useState<RaceEvent[]>([]);
  const [standings, setStandings] = useState<Record<string, number>>({});
  const [nextRace, setNextRace] = useState<RaceEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Season / Schedule
  useEffect(() => {
    const initData = async () => {
      try {
        const [fetchedRacers, fetchedTracks, savedSchedule, savedStandings] = await Promise.all([
          racersService.getAll(),
          tracksService.getAll(),
          racesService.getSeasonSchedule().catch(() => null),
          racesService.getStandings().catch(() => null)
        ]);

        setRoster(fetchedRacers);
        setTracks(fetchedTracks);
        
        // Init standings - use saved if available, otherwise all zeros
        const initialStandings: Record<string, number> = {};
        fetchedRacers.forEach(r => {
          initialStandings[r.id] = savedStandings?.[r.id] || 0;
        });
        setStandings(initialStandings);
        console.log('🏆 Loaded standings:', initialStandings);

        // Check if we have a saved schedule that's still valid
        if (savedSchedule && savedSchedule.length > 0) {
          // Restore saved schedule
          setSchedule(savedSchedule);
          const next = savedSchedule.find(r => !r.completed);
          setNextRace(next || null);
          console.log('📅 Restored saved schedule with', savedSchedule.length, 'races');
        } else {
          // Generate new schedule
          generateSchedule(fetchedRacers, fetchedTracks);
        }
      } catch (error) {
        console.error("Failed to initialize season data", error);
      } finally {
        setLoading(false);
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

  const generateSchedule = async (currentRoster: Racer[], currentTracks: Track[]) => {
    const newSchedule: RaceEvent[] = [];
    const now = Date.now();
    // Schedule 10 races, 10 minutes apart
    for (let i = 0; i < 10; i++) {
      // Pick 3-8 random racers (limited to 8 for track visibility)
      const numRacers = 3 + Math.floor(Math.random() * 6);
      const shuffled = [...currentRoster].sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, numRacers).map(r => r.id);

      newSchedule.push({
        id: `race-${i}`,
        startTime: now + (i * 10 * 60 * 1000) + 5000, // First race in 5s, then 10m intervals
        seed: Math.floor(Math.random() * 1000000),
        track: currentTracks[i % currentTracks.length],
        racerIds: selectedIds,
        completed: false,
      });
    }
    setSchedule(newSchedule);
    setNextRace(newSchedule[0]);
    
    // Save the new schedule
    await racesService.saveSeasonSchedule(newSchedule);
    console.log('📅 Generated new schedule with', newSchedule.length, 'races');
  };

  const completeRace = useCallback((raceId: string, results: Racer[]) => {
    console.log('🏁 Completing race:', raceId);
    console.log('📊 Race results:', results.map((r, i) => `${i + 1}. ${r.name} (${r.id})`));
    
    setSchedule(prev => {
      const idx = prev.findIndex(r => r.id === raceId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      updated[idx] = { ...updated[idx], completed: true, results: results.map(r => r.id) };
      
      // Set next race
      const next = updated.find(r => !r.completed && r.id !== raceId);
      setNextRace(next || null);
      
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

    // Update Roster Health/Stats
    setRoster(prev => prev.map(r => {
      const raceResult = results.find(res => res.id === r.id);
      if (raceResult) {
        // Reduce health if they raced
        let newHealth = r.health - (Math.random() * 3); // Reduced fatigue
        if (raceResult.status === 'injured') newHealth -= 10; // Reduced injury penalty
        return { ...r, health: Math.max(0, newHealth) };
      } else {
        // Recover health if they rested
        return { ...r, health: Math.min(100, r.health + 15) }; // Faster recovery
      }
    }));
  }, []);

  return { roster, schedule, standings, nextRace, completeRace, tracks, loading };
};
