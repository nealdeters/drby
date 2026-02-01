import { useState, useEffect, useCallback } from 'react';
import { Racer, RaceEvent, Track } from '../gameTypes';
import { racersService } from '../services/racersService';
import { tracksService } from '../services/tracksService';

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
        const [fetchedRacers, fetchedTracks] = await Promise.all([
          racersService.getAll(),
          tracksService.getAll()
        ]);

        setRoster(fetchedRacers);
        setTracks(fetchedTracks);
        generateSchedule(fetchedRacers, fetchedTracks);
      } catch (error) {
        console.error("Failed to initialize season data", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const generateSchedule = (currentRoster: Racer[], currentTracks: Track[]) => {
    const newSchedule: RaceEvent[] = [];
    const now = Date.now();
    // Schedule 10 races, 10 minutes apart
    for (let i = 0; i < 10; i++) {
      // Pick 3-12 random racers (Simulating racers choosing to race or rest)
      const numRacers = 3 + Math.floor(Math.random() * 10);
      const shuffled = [...currentRoster].sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, numRacers).map(r => r.id);

      newSchedule.push({
        id: `race-${i}`,
        startTime: now + (i * 10 * 60 * 1000) + 5000, // First race in 5s, then 10m intervals
        seed: Math.floor(Math.random() * 1000000), // In real app, this comes from DB/Blob
        track: currentTracks[i % currentTracks.length],
        racerIds: selectedIds,
        completed: false,
      });
    }
    setSchedule(newSchedule);
    setNextRace(newSchedule[0]);
    
    // Init standings
    const initialStandings: Record<string, number> = {};
    currentRoster.forEach(r => initialStandings[r.id] = 0);
    setStandings(initialStandings);
  };

  const completeRace = useCallback((raceId: string, results: Racer[]) => {
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
      if (results[0]) newStandings[results[0].id] = (newStandings[results[0].id] || 0) + 5;
      if (results[1]) newStandings[results[1].id] = (newStandings[results[1].id] || 0) + 3;
      if (results[2]) newStandings[results[2].id] = (newStandings[results[2].id] || 0) + 1;
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