import './polyfills';
import './index.css';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, FlatList, Text, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { RaceTrack } from './components/RaceTrack';
import { useRace } from './hooks/useRace';
import { useSeason } from './hooks/useSeason';
import { Racer, ViewState, Track } from './gameTypes';
import { formatCountdown } from './utils/format';
import { getRacerStats } from './utils/stats';
import { TabButton } from './components/TabButton';
import { RacerItem } from './components/RacerItem';
import { StandingsItem } from './components/StandingsItem';
import { RosterItem } from './components/RosterItem';
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

  const { racers, startRace, isRacing, progressMap } = useRace({
    racers: currentRaceRacers,
    track: nextRace?.track || LOADING_TRACK,
    raceSeed: nextRace?.seed || 0,
    startTime: nextRace?.startTime || 0,
    onRaceFinish: handleRaceFinish
  });

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!nextRace || nextRace.completed || isRacing) return;
    const interval = setInterval(() => {
      const diff = nextRace.startTime - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        startRace(); // Auto start
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRace, isRacing, startRace]);

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
          <TabButton title="Roster" active={view === 'roster'} onPress={() => setView('roster')} />
          <TabButton title="Tracks" active={view === 'tracks'} onPress={() => setView('tracks')} />
        </View>
      </View>

      {view === 'race' && (
        <>
          <View className="p-2 items-center" style={{ padding: 8, alignItems: 'center' }}>
            <Text className="text-[#64748b] text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 }}>
              {nextRace ? `Next: ${nextRace.track.name} (${nextRace.track.length}m)` : 'Season Finished'}
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
          data={Object.keys(standings).sort((a, b) => standings[b] - standings[a])}
          renderItem={({ item, index }) => {
            const racer = roster.find(r => r.id === item);
            const stats = getRacerStats(item, roster, schedule);
            if (!racer || !stats) return null;
            return (
              <StandingsItem racer={racer} index={index} points={standings[item]} stats={stats} onPress={handleRacerClick} />
            );
          }}
          keyExtractor={(item) => item}
          className="flex-1 mt-2.5"
          style={{ flex: 1, marginTop: 10 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        />
      )}

      {view === 'roster' && (
        <FlatList
          data={roster}
          renderItem={({ item }) => <RosterItem racer={item} onPress={handleRacerClick} />}
          keyExtractor={(item) => item.id}
          className="flex-1 mt-2.5"
          style={{ flex: 1, marginTop: 10 }}
        />
      )}

      {view === 'profile' && selectedRacerId && (
        <RacerProfile stats={getRacerStats(selectedRacerId, roster, schedule)!} onBack={() => setView('roster')} />
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