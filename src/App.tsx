import './polyfills';
import './index.css';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, FlatList, Text, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { RaceTrack } from './components/RaceTrack';
import { useRace } from './hooks/useRace';
import { useSeason } from './hooks/useSeason';
import { Racer, ViewState, Track } from './gameTypes';
import { formatCountdown } from './utils/format';
import { getRacerStats } from './utils/stats';
import { API_URL, headers } from './services/apiClient';
import { TabButton } from './components/TabButton';
import { RacerItem } from './components/RacerItem';
import { StandingsItem } from './components/StandingsItem';
import { TrackItem } from './components/TrackItem';
import { RacerProfile } from './components/RacerProfile';

const LOADING_TRACK: Track = { id: '0', name: 'Loading', surface: 'asphalt', length: 1000, laps: 3 };

export default function App() {
  const [view, setView] = useState<ViewState>('race');
  const [selectedRacerId, setSelectedRacerId] = useState<string | null>(null);
  const { roster, schedule, standings, nextRace, completeRace, tracks } = useSeason();
  
  // Prepare racers for the current/next race
  // Fix: Memoize this array to prevent infinite re-renders in useRace
  const currentRaceRacers = useMemo(() => nextRace 
    ? roster.filter(r => nextRace.racerIds.includes(r.id))
    : [], [nextRace, roster]);

  // Fix: Memoize callback to prevent unnecessary updates
  const handleRaceFinish = useCallback((results: Racer[]) => {
    if (nextRace) completeRace(nextRace.id, results);
  }, [nextRace, completeRace]);

  // Real-time race hook - subscribes to Ably channel
  const { racers, isRacing, progressMap } = useRace({
    racers: currentRaceRacers,
    track: nextRace?.track || LOADING_TRACK,
    raceId: nextRace?.id || '',
    isActive: !!nextRace && !nextRace.completed,
    onRaceFinish: handleRaceFinish
  });

  // Countdown Timer & Race Trigger
  const [timeLeft, setTimeLeft] = useState(0);
  const raceStartTriggered = useRef(false);
  
  useEffect(() => {
    if (!nextRace || nextRace.completed) return;
    
    // Check if race should have already started (on refresh)
    const shouldHaveStarted = Date.now() >= nextRace.startTime;
    
    // If race should have started, don't show countdown, just wait for race data
    if (shouldHaveStarted) {
      setTimeLeft(0);
      
      // Only trigger race start if not already triggered
      if (!raceStartTriggered.current && !isRacing) {
        raceStartTriggered.current = true;
        fetch(`${API_URL}/race-manager`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            raceId: nextRace.id,
            racers: currentRaceRacers,
            track: nextRace.track
          })
        }).catch(err => console.error('Failed to start race:', err));
      }
      return;
    }
    
    // Reset trigger flag when race changes
    raceStartTriggered.current = false;
    
    const interval = setInterval(() => {
      const diff = nextRace.startTime - Date.now();
      if (diff <= 0 && !raceStartTriggered.current) {
        raceStartTriggered.current = true;
        setTimeLeft(0);
        // Trigger race start via server
        fetch(`${API_URL}/race-manager`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            raceId: nextRace.id,
            racers: currentRaceRacers,
            track: nextRace.track
          })
        }).catch(err => console.error('Failed to start race:', err));
      } else if (diff > 0) {
        setTimeLeft(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRace, isRacing, currentRaceRacers]);

  const formatRaceTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  };

  const handleRacerClick = (racerId: string) => {
    setSelectedRacerId(racerId);
    setView('profile');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header / Nav */}
      <View className="flex-row justify-between items-center px-6 py-6 bg-[#020617]" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24, backgroundColor: '#020617' }}>
        <View>
          <Text className="text-3xl font-black italic text-white tracking-tighter" style={{ fontSize: 30, fontWeight: '900', fontStyle: 'italic', color: '#f8fafc', letterSpacing: -1 }}>DRBY<Text className="text-[#6366f1]" style={{ color: '#6366f1' }}>.</Text></Text>
          {/* <Text className="text-[#64748b] text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', letterSpacing: 3, textTransform: 'uppercase' }}>Racing League</Text> */}
        </View>
        <View className="flex-row bg-[#0f172a] p-1.5 rounded-full" style={{ flexDirection: 'row', backgroundColor: '#0f172a', padding: 6, borderRadius: 999 }}>
          <TabButton title="Race" active={view === 'race'} onPress={() => setView('race')} />
          <TabButton title="Standings" active={view === 'standings'} onPress={() => setView('standings')} />
          <TabButton title="Tracks" active={view === 'tracks'} onPress={() => setView('tracks')} />
        </View>
      </View>

      {view === 'race' && (
        <>
          <View className="p-2 items-center" style={{ padding: 8, alignItems: 'center' }}>
            <Text className="text-[#64748b] text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 }}>
              {nextRace ? `Next: ${nextRace.track?.name || 'Loading...'} (${nextRace.track?.length || 0}m)` : 'Season Finished'}
            </Text>
            {!isRacing && nextRace && (
              <Text className="text-[#f8fafc] text-5xl font-black mt-2 tracking-tight" style={{ color: '#f8fafc', fontSize: 48, fontWeight: '900', marginTop: 8, letterSpacing: -1 }}>{formatCountdown(timeLeft)}</Text>
            )}
          </View>

          <View className="h-[300px] w-full" style={{ height: 300, width: '100%' }}>
            <RaceTrack racers={racers} track={nextRace?.track || LOADING_TRACK} progressMap={progressMap} />
          </View>

          <FlatList
            data={racers}
            renderItem={({ item, index }) => <RacerItem racer={item} index={index} onPress={handleRacerClick} />}
            keyExtractor={(item) => item.id}
            className="flex-1 mt-2.5"
            style={{ flex: 1, marginTop: 10 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          />
        </>
      )}

      {view === 'standings' && (
        <FlatList
          data={roster
            .map(racer => ({ 
              racer, 
              points: standings[racer.id] || 0,
              stats: getRacerStats(racer.id, roster, schedule)
            }))
            .sort((a, b) => b.points - a.points)}
          renderItem={({ item, index }) => {
            if (!item.stats) return null;
            return (
              <StandingsItem racer={item.racer} index={index} points={item.points} stats={item.stats} onPress={handleRacerClick} />
            );
          }}
          keyExtractor={(item) => item.racer.id}
          className="flex-1 mt-2.5"
          style={{ flex: 1, marginTop: 10 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        />
      )}

      {view === 'profile' && selectedRacerId && (
        <RacerProfile stats={getRacerStats(selectedRacerId, roster, schedule)!} onBack={() => setView('standings')} />
      )}

      {view === 'tracks' && (
        <FlatList
          data={tracks}
          renderItem={({ item }) => <TrackItem track={item} />}
          keyExtractor={(item) => item.id}
          className="flex-1 mt-2.5"
          style={{ flex: 1, marginTop: 10 }}
        />
      )}
    </SafeAreaView>
  );
}