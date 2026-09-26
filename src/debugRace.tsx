import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text, View } from 'react-native';
import { makeMutable } from 'react-native-reanimated';
import { RaceTrack } from './components/RaceTrack';
import { Racer, Track } from './gameTypes';

const track: Track = { id: 'debug', name: 'Traffic Test Oval', surface: 'asphalt', length: 1000, laps: 3 };
const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'];
const schedules = [
  [[0, 2], [0.18, 1]], [[0, 3], [0.26, 2]], [[0, 4], [0.20, 5]], [[0, 5], [0.34, 4]],
  [[0, 6], [0.45, 5]], [[0, 7], [0.12, 6]], [[0, 8], [0.30, 7]], [[0, 1], [0.60, 2]],
] as const;
const baseRacers: Racer[] = Array.from({ length: 8 }, (_, index) => ({
  id: `debug-${index}`, name: `Horse ${index + 1}`, color: colors[index], baseSpeed: 80, health: 100,
  strategy: index % 3 === 0 ? 'aggressive' : 'balanced', trackPreference: 'asphalt', acceleration: 60,
  endurance: 60, consistency: 60, staminaRecovery: 50, lane: index + 1, laneTarget: index + 1,
  lanePosition: index + 1, progress: 0, laps: 0, totalDistance: 0, status: 'active', currentSpeed: 80,
}));

function interpolateSchedule(schedule: readonly (readonly [number, number])[], t: number) {
  if (t <= schedule[0][0]) return schedule[0][1];
  for (let i = 1; i < schedule.length; i += 1) {
    const [start, from] = schedule[i - 1]; const [end, to] = schedule[i];
    if (t <= end) { const p = (t - start) / (end - start); return from + (to - from) * p; }
  }
  return schedule[schedule.length - 1][1];
}

function DebugRace() {
  const [time, setTime] = useState(0);
  const progressMap = useMemo(() => Object.fromEntries(baseRacers.map((r) => [r.id, makeMutable(0)])), []);
  const [racers, setRacers] = useState(baseRacers);
  useEffect(() => { const timer = window.setInterval(() => setTime((value) => (value + 0.02) % 1), 20); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    setRacers(baseRacers.map((racer, index) => {
      const lanePosition = interpolateSchedule(schedules[index], time);
      progressMap[racer.id].value = time;
      return { ...racer, lane: Math.round(lanePosition), lanePosition, laneTarget: schedules[index][schedules[index].length - 1][1], progress: time };
    }));
  }, [time, progressMap]);
  return <View style={{ flex: 1, minHeight: 760, padding: 24, backgroundColor: '#0f172a' }}>
    <Text style={{ color: '#f8fafc', fontSize: 26, fontWeight: '900' }}>DRBY · lane traffic debug</Text>
    <Text style={{ color: '#94a3b8', marginTop: 6 }}>Browser-rendered production-equivalent RaceTrack • smooth lateral state • t={time.toFixed(2)}</Text>
    <View style={{ height: 520, marginTop: 18 }}><RaceTrack racers={racers} track={track} progressMap={progressMap} /></View>
    <Text style={{ color: '#cbd5e1', marginTop: 12 }}>Trace: Horse 3 passes outside • Horse 4 holds for traffic • Horse 8 improves inside • lanePosition is continuous.</Text>
  </View>;
}

createRoot(document.getElementById('root')!).render(<DebugRace />);
